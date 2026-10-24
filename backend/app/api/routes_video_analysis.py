import os
import uuid
import shutil
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import VideoAnalysis, AuditEvent
from app.evidence.video_pipeline import (
    VideoProcessingPipeline, VIDEOS_DIR, FRAMES_DIR, MAX_VIDEO_SIZE_BYTES
)

router = APIRouter(prefix="/api/video-analysis", tags=["Video Analysis"])


class RunAnalysisPayload(BaseModel):
    incident_timestamp: Optional[float] = None
    incident_type: Optional[str] = "PENALTY_AREA_CONTACT"
    user_description: Optional[str] = None


class RecordHumanDecisionPayload(BaseModel):
    official_ruling: str
    disciplinary_action: Optional[str] = "None"
    restart_play: Optional[str] = "Direct Free Kick"
    rationale: str
    reviewed_by: Optional[str] = "Match Referee"


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    incident_timestamp: Optional[float] = Form(None),
    incident_type: Optional[str] = Form("PENALTY_AREA_CONTACT"),
    user_description: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Safely uploads a football match clip, extracts video stream metadata,
    and stages an analysis record. Zero cloud dependencies.
    """
    original_filename = os.path.basename(file.filename or "clip.mp4")
    analysis_id = f"VID_{uuid.uuid4().hex[:12].upper()}"

    ext = os.path.splitext(original_filename.lower())[1]
    is_valid, err_msg = VideoProcessingPipeline.validate_file(original_filename, 0)
    if not is_valid and "format" in (err_msg or ""):
        raise HTTPException(status_code=400, detail=err_msg)

    safe_filename = f"{analysis_id}{ext}"
    dest_path = os.path.join(VIDEOS_DIR, safe_filename)

    total_bytes = 0
    try:
        with open(dest_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                total_bytes += len(chunk)
                if total_bytes > MAX_VIDEO_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(dest_path):
                        os.remove(dest_path)
                    raise HTTPException(
                        status_code=413,
                        detail=f"Video file exceeds maximum local limit of {MAX_VIDEO_SIZE_BYTES // (1024*1024)}MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    # Extract technical metadata
    try:
        meta = VideoProcessingPipeline.extract_video_metadata(dest_path)
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=422, detail=f"Failed to decode video file: {str(e)}")

    # Persist in DB
    analysis = VideoAnalysis(
        id=analysis_id,
        filename=safe_filename,
        original_filename=original_filename,
        file_size_bytes=total_bytes,
        duration_seconds=meta["duration_seconds"],
        fps=meta["fps"],
        width=meta["width"],
        height=meta["height"],
        frame_count=meta["frame_count"],
        incident_timestamp=incident_timestamp,
        incident_type=incident_type or "PENALTY_AREA_CONTACT",
        user_description=user_description,
        status="UPLOADED"
    )
    db.add(analysis)
    db.commit()

    return {
        "analysis_id": analysis_id,
        "filename": original_filename,
        "status": "UPLOADED",
        "metadata": meta,
        "video_url": f"/api/video-analysis/video/{safe_filename}",
        "message": "Video successfully uploaded and validated."
    }


@router.post("/{analysis_id}/run")
def run_analysis(
    analysis_id: str,
    payload: RunAnalysisPayload,
    db: Session = Depends(get_db)
):
    """
    Executes OpenCV frame sampling and IFAB-grounded referee analysis.
    """
    analysis = db.query(VideoAnalysis).filter_by(id=analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    video_path = os.path.join(VIDEOS_DIR, analysis.filename)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Underlying video file was removed or missing")

    timestamp = payload.incident_timestamp if payload.incident_timestamp is not None else analysis.incident_timestamp
    inc_type = payload.incident_type or analysis.incident_type or "PENALTY_AREA_CONTACT"
    desc = payload.user_description or analysis.user_description

    try:
        # Extract frames
        frames = VideoProcessingPipeline.extract_incident_frames(
            video_path=video_path,
            analysis_id=analysis_id,
            incident_timestamp=timestamp,
            max_samples=10
        )

        metadata = {
            "duration_seconds": analysis.duration_seconds,
            "fps": analysis.fps,
            "width": analysis.width,
            "height": analysis.height,
            "frame_count": analysis.frame_count,
            "shutter_interval_ms": round(1000.0 / analysis.fps, 2) if analysis.fps > 0 else 33.33
        }

        # Run 4-stage analysis
        report = VideoProcessingPipeline.generate_referee_analysis(
            metadata=metadata,
            extracted_frames=frames,
            incident_timestamp=timestamp,
            incident_type=inc_type,
            user_description=desc
        )

        analysis.incident_timestamp = timestamp
        analysis.incident_type = inc_type
        analysis.user_description = desc
        analysis.status = "COMPLETED"
        analysis.extracted_frames_json = frames
        analysis.observable_evidence_json = report["observable_evidence"]
        analysis.rule_references_json = report["rule_references"]
        analysis.decision_support_json = report["decision_support"]

        db.commit()

        return {
            "analysis_id": analysis.id,
            "status": analysis.status,
            "metadata": metadata,
            "extracted_frames": frames,
            "observable_evidence": report["observable_evidence"],
            "rule_references": report["rule_references"],
            "decision_support": report["decision_support"],
            "human_decision": None
        }

    except Exception as e:
        analysis.status = "FAILED"
        analysis.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Analysis pipeline execution failed: {str(e)}")


@router.get("/sample")
def get_or_generate_sample(db: Session = Depends(get_db)):
    """
    Returns or creates a synthetic demo football referee clip so users can immediately
    test video analysis with $0 budget and zero setup.
    """
    sample_id = "VID_SAMPLE_DEMO_01"
    existing = db.query(VideoAnalysis).filter_by(id=sample_id).first()

    video_filename = f"{sample_id}.mp4"
    dest_path = os.path.join(VIDEOS_DIR, video_filename)

    if not os.path.exists(dest_path):
        VideoProcessingPipeline.generate_synthetic_sample_video(dest_path, duration_sec=4.0, fps=30)

    if not existing:
        meta = VideoProcessingPipeline.extract_video_metadata(dest_path)
        existing = VideoAnalysis(
            id=sample_id,
            filename=video_filename,
            original_filename="sample_var_18yd_contact_cam01.mp4",
            file_size_bytes=os.path.getsize(dest_path),
            duration_seconds=meta["duration_seconds"],
            fps=meta["fps"],
            width=meta["width"],
            height=meta["height"],
            frame_count=meta["frame_count"],
            incident_timestamp=2.0,
            incident_type="PENALTY_AREA_CONTACT",
            user_description="Demarcation check: Did contact between attacker #9 and defender #5 begin outside or inside the 18-yard box line?",
            status="UPLOADED"
        )
        db.add(existing)
        db.commit()

    return {
        "analysis_id": sample_id,
        "filename": existing.original_filename,
        "status": existing.status,
        "incident_timestamp": existing.incident_timestamp,
        "incident_type": existing.incident_type,
        "user_description": existing.user_description,
        "video_url": f"/api/video-analysis/video/{video_filename}"
    }


@router.get("/{analysis_id}")
def get_analysis_detail(analysis_id: str, db: Session = Depends(get_db)):
    """Retrieves full analysis record and stored report."""
    analysis = db.query(VideoAnalysis).filter_by(id=analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    return {
        "analysis_id": analysis.id,
        "filename": analysis.original_filename,
        "stored_file": analysis.filename,
        "file_size_bytes": analysis.file_size_bytes,
        "video_url": f"/api/video-analysis/video/{analysis.filename}",
        "status": analysis.status,
        "incident_timestamp": analysis.incident_timestamp,
        "incident_type": analysis.incident_type,
        "user_description": analysis.user_description,
        "metadata": {
            "duration_seconds": analysis.duration_seconds,
            "fps": analysis.fps,
            "width": analysis.width,
            "height": analysis.height,
            "frame_count": analysis.frame_count,
            "shutter_interval_ms": round(1000.0 / analysis.fps, 2) if analysis.fps > 0 else 33.33
        },
        "extracted_frames": analysis.extracted_frames_json or [],
        "observable_evidence": analysis.observable_evidence_json,
        "rule_references": analysis.rule_references_json or [],
        "decision_support": analysis.decision_support_json,
        "human_decision": {
            "ruling": analysis.human_ruling,
            "disciplinary": analysis.human_disciplinary,
            "restart": analysis.human_restart,
            "rationale": analysis.human_rationale,
            "reviewed_by": analysis.human_reviewed_by,
            "reviewed_at": analysis.human_reviewed_at.isoformat() if analysis.human_reviewed_at else None
        } if analysis.human_ruling else None,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None
    }


@router.get("/{analysis_id}/frames")
def get_analysis_frames(analysis_id: str, db: Session = Depends(get_db)):
    """Retrieves list of extracted frames for the analysis."""
    analysis = db.query(VideoAnalysis).filter_by(id=analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis.extracted_frames_json or []


@router.get("/frames/{filename}")
def serve_frame_image(filename: str):
    """Safely serves extracted JPEG frame images preventing directory traversal."""
    safe_name = os.path.basename(filename)
    frame_path = os.path.join(FRAMES_DIR, safe_name)
    if not os.path.exists(frame_path):
        raise HTTPException(status_code=404, detail="Frame image not found")
    return FileResponse(frame_path, media_type="image/jpeg")


@router.get("/video/{filename}")
def serve_video_clip(filename: str):
    """Safely streams video file for frontend HTML5 video player."""
    safe_name = os.path.basename(filename)
    video_path = os.path.join(VIDEOS_DIR, safe_name)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")
    ext = os.path.splitext(safe_name)[1].lower()
    media_type = "video/mp4" if ext == ".mp4" else ("video/webm" if ext == ".webm" else "application/octet-stream")
    return FileResponse(video_path, media_type=media_type)


@router.post("/{analysis_id}/record-decision")
def record_human_decision(
    analysis_id: str,
    payload: RecordHumanDecisionPayload,
    db: Session = Depends(get_db)
):
    """
    Records the human referee's final decision into the audit trail and attaches it to the analysis.
    Preserves strict separation between machine-generated advice and human legal authority.
    """
    analysis = db.query(VideoAnalysis).filter_by(id=analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    analysis.human_ruling = payload.official_ruling
    analysis.human_disciplinary = payload.disciplinary_action
    analysis.human_restart = payload.restart_play
    analysis.human_rationale = payload.rationale
    analysis.human_reviewed_by = payload.reviewed_by or "Match Official"
    analysis.human_reviewed_at = datetime.utcnow()

    # Create Audit Event
    audit = AuditEvent(
        id=f"AUD_VID_{datetime.utcnow().timestamp()}",
        incident_id=analysis_id,
        action_type="VIDEO_HUMAN_DECISION_RECORDED",
        previous_status=analysis.status,
        new_status="HUMAN_DECISION_RECORDED",
        actor_name=analysis.human_reviewed_by,
        details=(
            f"Human decision recorded on video {analysis.original_filename}: "
            f"Ruling: {payload.official_ruling} | Disciplinary: {payload.disciplinary_action} | "
            f"Restart: {payload.restart_play}"
        )
    )
    db.add(audit)
    db.commit()

    return {
        "status": "SUCCESS",
        "analysis_id": analysis_id,
        "human_decision": {
            "ruling": analysis.human_ruling,
            "disciplinary": analysis.human_disciplinary,
            "restart": analysis.human_restart,
            "rationale": analysis.human_rationale,
            "reviewed_by": analysis.human_reviewed_by,
            "reviewed_at": analysis.human_reviewed_at.isoformat()
        }
    }


@router.delete("/{analysis_id}")
def delete_video_analysis(analysis_id: str, db: Session = Depends(get_db)):
    """
    Safely deletes the uploaded video and all extracted frame artifacts from disk
    and removes the database record. Respects storage policies and zero lingering artifacts.
    """
    analysis = db.query(VideoAnalysis).filter_by(id=analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")

    # Remove video file
    video_path = os.path.join(VIDEOS_DIR, analysis.filename)
    if os.path.exists(video_path):
        try:
            os.remove(video_path)
        except Exception as e:
            logger.warning(f"Could not remove video file {video_path}: {e}")

    # Remove extracted frames
    if analysis.extracted_frames_json:
        for frm in analysis.extracted_frames_json:
            fname = frm.get("filename")
            if fname:
                fpath = os.path.join(FRAMES_DIR, os.path.basename(fname))
                if os.path.exists(fpath):
                    try:
                        os.remove(fpath)
                    except Exception:
                        pass

    db.delete(analysis)
    db.commit()

    return {
        "status": "DELETED",
        "analysis_id": analysis_id,
        "message": "Video analysis and associated local artifacts safely purged."
    }
