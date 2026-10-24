import os
import io
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.evidence.video_pipeline import (
    VideoProcessingPipeline, VIDEOS_DIR, FRAMES_DIR
)

client = TestClient(app)


@pytest.fixture(scope="module")
def sample_video_path():
    """Generates a small 2-second synthetic football clip for testing."""
    test_video_file = os.path.join(VIDEOS_DIR, "test_clip_unit.mp4")
    VideoProcessingPipeline.generate_synthetic_sample_video(test_video_file, duration_sec=2.0, fps=25)
    yield test_video_file
    if os.path.exists(test_video_file):
        try:
            os.remove(test_video_file)
        except Exception:
            pass


def test_video_metadata_extraction(sample_video_path):
    assert os.path.exists(sample_video_path)
    meta = VideoProcessingPipeline.extract_video_metadata(sample_video_path)
    assert meta["duration_seconds"] > 1.5
    assert meta["fps"] == 25.0
    assert meta["width"] == 640
    assert meta["height"] == 360
    assert meta["frame_count"] > 40


def test_video_format_validation():
    is_valid, err = VideoProcessingPipeline.validate_file("match.mp4", 1024 * 1024)
    assert is_valid is True
    assert err is None

    is_valid, err = VideoProcessingPipeline.validate_file("malicious.exe", 1024)
    assert is_valid is False
    assert "Unsupported video format" in err

    is_valid, err = VideoProcessingPipeline.validate_file("huge.mp4", 60 * 1024 * 1024)
    assert is_valid is False
    assert "exceeds local processing limit" in err


def test_frame_sampling_and_clustering(sample_video_path):
    frames = VideoProcessingPipeline.extract_incident_frames(
        video_path=sample_video_path,
        analysis_id="TEST_UNIT_01",
        incident_timestamp=1.0,
        max_samples=6
    )
    assert len(frames) >= 3
    for f in frames:
        assert "timestamp_seconds" in f
        assert "filename" in f
        assert "sharpness_score" in f
        assert "motion_energy" in f
        frame_disk_path = os.path.join(FRAMES_DIR, f["filename"])
        assert os.path.exists(frame_disk_path)
        # Cleanup frame
        try:
            os.remove(frame_disk_path)
        except Exception:
            pass


def test_referee_analysis_reasoning(sample_video_path):
    meta = VideoProcessingPipeline.extract_video_metadata(sample_video_path)
    frames = [
        {"timestamp_seconds": 0.5, "motion_energy": 2.1, "sharpness_score": 75.0},
        {"timestamp_seconds": 1.0, "motion_energy": 9.4, "sharpness_score": 82.0},
        {"timestamp_seconds": 1.5, "motion_energy": 3.0, "sharpness_score": 70.0}
    ]

    analysis = VideoProcessingPipeline.generate_referee_analysis(
        metadata=meta,
        extracted_frames=frames,
        incident_timestamp=1.0,
        incident_type="PENALTY_AREA_CONTACT",
        user_description="Did foul start outside 18-yd box?"
    )

    evidence = analysis["observable_evidence"]
    assert "spatial_tolerance_margin" in evidence
    assert "visual_observations" in evidence
    assert len(evidence["limitations"]) > 0

    rules = analysis["rule_references"]
    assert any("Law 12" in r["law_number"] for r in rules)

    support = analysis["decision_support"]
    assert support["review_recommendation"] in ["FURTHER_REVIEW_RECOMMENDED", "EVIDENCE_INSUFFICIENT"]
    assert len(support["factors_supporting_offence"]) > 0
    assert len(support["factors_against_offence"]) > 0
    assert "uncertainty_statement" in support


def test_api_upload_run_and_lifecycle(sample_video_path):
    # 1. Upload video
    with open(sample_video_path, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        "/api/video-analysis/upload",
        files={"file": ("test_match_clip.mp4", io.BytesIO(file_bytes), "video/mp4")},
        data={
            "incident_timestamp": "1.0",
            "incident_type": "PENALTY_AREA_CONTACT",
            "user_description": "Check if contact is inside 18-yard box line"
        }
    )
    assert res.status_code == 200
    upload_data = res.json()
    analysis_id = upload_data["analysis_id"]
    assert analysis_id.startswith("VID_")
    assert upload_data["status"] == "UPLOADED"

    # 2. Run Analysis
    run_res = client.post(
        f"/api/video-analysis/{analysis_id}/run",
        json={
            "incident_timestamp": 1.0,
            "incident_type": "PENALTY_AREA_CONTACT",
            "user_description": "Check if contact is inside 18-yard box line"
        }
    )
    assert run_res.status_code == 200
    report = run_res.json()
    assert report["status"] == "COMPLETED"
    assert len(report["extracted_frames"]) > 0
    assert len(report["rule_references"]) > 0
    assert "decision_support" in report

    # 3. Retrieve Analysis
    detail_res = client.get(f"/api/video-analysis/{analysis_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["analysis_id"] == analysis_id
    assert detail["status"] == "COMPLETED"

    # 4. Check frames endpoint
    frames_res = client.get(f"/api/video-analysis/{analysis_id}/frames")
    assert frames_res.status_code == 200
    frames_list = frames_res.json()
    assert len(frames_list) > 0

    first_frame_filename = frames_list[0]["filename"]
    img_res = client.get(f"/api/video-analysis/frames/{first_frame_filename}")
    assert img_res.status_code == 200
    assert img_res.headers["content-type"] == "image/jpeg"

    # 5. Record human referee decision
    decision_res = client.post(
        f"/api/video-analysis/{analysis_id}/record-decision",
        json={
            "official_ruling": "Direct Free Kick Outside Box",
            "disciplinary_action": "Yellow Card",
            "restart_play": "Direct Free Kick",
            "rationale": "High-speed frames prove contact occurred 10cm before 18-yard line.",
            "reviewed_by": "Referee Marcus Sterling"
        }
    )
    assert decision_res.status_code == 200
    dec_data = decision_res.json()
    assert dec_data["human_decision"]["ruling"] == "Direct Free Kick Outside Box"

    # 6. Delete analysis and verify cleanup
    del_res = client.delete(f"/api/video-analysis/{analysis_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "DELETED"

    # Verify 404 after deletion
    after_del = client.get(f"/api/video-analysis/{analysis_id}")
    assert after_del.status_code == 404


def test_api_sample_video_endpoint():
    res = client.get("/api/video-analysis/sample")
    assert res.status_code == 200
    data = res.json()
    assert data["analysis_id"] == "VID_SAMPLE_DEMO_01"
    assert "sample_var_18yd" in data["filename"]
    assert data["incident_timestamp"] == 2.0
