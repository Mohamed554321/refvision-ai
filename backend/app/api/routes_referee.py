from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.db.session import SessionLocal
from app.db.models import Incident as DBIncident, EvidenceItem as DBEvidenceItem, AuditEvent as DBAuditEvent

router = APIRouter(prefix="/api/referee", tags=["referee"])

class RecordDecisionRequest(BaseModel):
    incident_id: str
    official_ruling: str
    official_ruling_ar: Optional[str] = None
    disciplinary_action: Optional[str] = "None"
    restart_play: Optional[str] = "Direct Free Kick"
    rationale: str
    rationale_ar: Optional[str] = None
    recorded_by: Optional[str] = "Marcus Sterling"

class GenerateExplanationRequest(BaseModel):
    incident_id: str

def get_routes(engine, orchestration_pipeline):
    @router.get("/incidents")
    def get_incidents(match_id: Optional[str] = Query(None)):
        """
        Returns incidents for the requested match or all matches.
        Supports both the in-memory simulation engine and the persistent SQLite database.
        """
        # If match_id matches synthetic demo or is not specified, get engine incidents
        synthetic_incidents = engine.get_visible_incidents()

        # If a specific historical match is requested, fetch from database
        db = SessionLocal()
        try:
            if match_id and match_id != engine.seed:
                db_incs = db.query(DBIncident).filter_by(match_id=match_id).all()
                result = []
                for inc in db_incs:
                    result.append({
                        "incident_id": inc.id,
                        "match_id": inc.match_id,
                        "minute": inc.minute,
                        "second": inc.second,
                        "timestamp_seconds": float(inc.minute * 60 + inc.second),
                        "incident_type": inc.incident_type,
                        "review_category": inc.review_category,
                        "description": inc.description,
                        "description_ar": inc.description_ar,
                        "coordinates": {"x": inc.x or 83.6, "y": inc.y or 49.2},
                        "review_status": inc.review_status,
                        "initial_decision": inc.initial_decision,
                        "human_ruling": inc.human_ruling,
                        "human_ruling_ar": inc.human_ruling_ar,
                        "disciplinary_action": inc.disciplinary_action,
                        "restart_play": inc.restart_play,
                        "rationale": inc.rationale,
                        "is_synthetic": inc.is_synthetic,
                        "uncertainty_margin": inc.uncertainty_margin or "±3.2cm",
                        "evidence_items": [
                            {
                                "evidence_id": f"EV_{ev.id}",
                                "incident_id": inc.id,
                                "camera_id": ev.camera_id,
                                "camera_name": ev.camera_name,
                                "camera_name_ar": ev.camera_name_ar or ev.camera_name,
                                "is_recommended": ev.is_recommended,
                                "visibility_score": ev.clarity_score or 90.0,
                                "field_coverage": "18-Yard Box demarkation",
                                "field_coverage_ar": "تغطية خط منطقة الـ 18 ياردة",
                                "recommendation_reason": ev.description or "Collinear viewpoint with field boundary.",
                                "recommendation_reason_ar": "زاوية موازية لحدود الملعب.",
                                "occlusion_level": ev.occlusion_level or "Low",
                                "simulated_perspective_url": "/api/static/cam.jpg",
                                "key_observation": "Initial physical challenge observable relative to line boundary.",
                                "key_observation_ar": "الالتحام الأولي ملاحظ بوضوح بالنسبة لحدود الخط.",
                                "limitations": "Standard broadcast camera perspective angle.",
                                "limitations_ar": "زاوية تصوير قياسية من البث التلفزيوني."
                            }
                            for ev in inc.evidence_items
                        ]
                    })
                return result

            # If match_id matches synthetic demo or None, return synthetic
            return synthetic_incidents
        finally:
            db.close()

    @router.get("/incident/{incident_id}")
    def get_incident(incident_id: str):
        # 1. First check in-memory engine
        if incident_id in engine.incidents:
            return engine.incidents[incident_id]

        # 2. Check persistent database
        db = SessionLocal()
        try:
            inc = db.query(DBIncident).filter_by(id=incident_id).first()
            if not inc:
                raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")

            evidence = db.query(DBEvidenceItem).filter_by(incident_id=incident_id).all()
            return {
                "incident_id": inc.id,
                "match_id": inc.match_id,
                "minute": inc.minute,
                "second": inc.second,
                "timestamp_seconds": float(inc.minute * 60 + inc.second),
                "incident_type": inc.incident_type,
                "review_category": inc.review_category,
                "description": inc.description,
                "description_ar": inc.description_ar,
                "coordinates": {"x": inc.x or 83.6, "y": inc.y or 49.2},
                "review_status": inc.review_status,
                "initial_decision": inc.initial_decision,
                "human_ruling": inc.human_ruling,
                "human_ruling_ar": inc.human_ruling_ar,
                "disciplinary_action": inc.disciplinary_action,
                "restart_play": inc.restart_play,
                "rationale": inc.rationale,
                "is_synthetic": inc.is_synthetic,
                "uncertainty_margin": inc.uncertainty_margin or "±3.2cm",
                "evidence_items": [
                    {
                        "evidence_id": f"EV_{ev.id}",
                        "incident_id": inc.id,
                        "camera_id": ev.camera_id,
                        "camera_name": ev.camera_name,
                        "camera_name_ar": ev.camera_name_ar or ev.camera_name,
                        "is_recommended": ev.is_recommended,
                        "visibility_score": ev.clarity_score or 90.0,
                        "field_coverage": "Demarcation Line",
                        "field_coverage_ar": "خط حدود منطقة الجزاء",
                        "recommendation_reason": ev.description or "Synchronized view.",
                        "recommendation_reason_ar": "رؤية متزامنة.",
                        "occlusion_level": ev.occlusion_level or "Low",
                        "simulated_perspective_url": "/api/static/cam.jpg",
                        "key_observation": "Foul contact dynamics observable.",
                        "key_observation_ar": "ديناميكية التلامس ومكان بدء المخالفة واضحة.",
                        "limitations": "Broadcast camera single angle.",
                        "limitations_ar": "لقطة فردية من زاوية البث التلفزيوني."
                    }
                    for ev in evidence
                ]
            }
        finally:
            db.close()

    @router.post("/record-decision")
    def record_decision(req: RecordDecisionRequest):
        # 1. Update in-memory engine if present
        engine_incident = None
        if req.incident_id in engine.incidents:
            engine_incident = engine.record_referee_decision(
                incident_id=req.incident_id,
                official_ruling=req.official_ruling,
                official_ruling_ar=req.official_ruling_ar or req.official_ruling,
                disciplinary_action=req.disciplinary_action,
                restart_play=req.restart_play,
                rationale=req.rationale,
                rationale_ar=req.rationale_ar or req.rationale,
                recorded_by=req.recorded_by or "Marcus Sterling"
            )

        # 2. Update database persistence
        db = SessionLocal()
        try:
            db_inc = db.query(DBIncident).filter_by(id=req.incident_id).first()
            if db_inc:
                prev_status = db_inc.review_status
                db_inc.review_status = "DECISION_RECORDED"
                db_inc.human_ruling = req.official_ruling
                db_inc.human_ruling_ar = req.official_ruling_ar or req.official_ruling
                db_inc.disciplinary_action = req.disciplinary_action
                db_inc.restart_play = req.restart_play
                db_inc.rationale = req.rationale
                db_inc.rationale_ar = req.rationale_ar or req.rationale
                db_inc.reviewed_by = req.recorded_by or "Marcus Sterling"
                db_inc.reviewed_at = datetime.utcnow()

                audit = DBAuditEvent(
                    id=f"AUD_{datetime.utcnow().timestamp()}",
                    incident_id=req.incident_id,
                    action_type="REFEREE_DECISION_RECORDED",
                    previous_status=prev_status,
                    new_status="DECISION_RECORDED",
                    actor_name=db_inc.reviewed_by,
                    details=f"Ruling: {req.official_ruling}. Action: {req.disciplinary_action}. Restart: {req.restart_play}."
                )
                db.add(audit)
                db.commit()

            if engine_incident:
                return engine_incident
            elif db_inc:
                return {
                    "incident_id": db_inc.id,
                    "review_status": db_inc.review_status,
                    "human_ruling": db_inc.human_ruling,
                    "disciplinary_action": db_inc.disciplinary_action,
                    "restart_play": db_inc.restart_play,
                    "rationale": db_inc.rationale,
                    "reviewed_by": db_inc.reviewed_by
                }
            else:
                raise HTTPException(status_code=404, detail="Incident not found in memory or database")
        finally:
            db.close()

    @router.post("/generate-explanation")
    def generate_explanation(req: GenerateExplanationRequest):
        from app.incidents.engine import IncidentEngine

        # Check in engine
        if req.incident_id in engine.incidents:
            incident = engine.incidents[req.incident_id]
            explanation = IncidentEngine.generate_structured_explanation(incident)
            engine.attach_explanation(req.incident_id, explanation)
            return {
                "incident_id": req.incident_id,
                "review_status": incident.review_status,
                "structured_explanation": explanation
            }

        # Otherwise check database
        db = SessionLocal()
        try:
            db_inc = db.query(DBIncident).filter_by(id=req.incident_id).first()
            if not db_inc:
                raise HTTPException(status_code=404, detail="Incident not found")

            from app.schemas.incidents import Incident as SchemaIncident, IncidentType
            schema_inc = SchemaIncident(
                incident_id=db_inc.id,
                match_id=db_inc.match_id,
                minute=db_inc.minute,
                second=db_inc.second,
                timestamp_seconds=float(db_inc.minute * 60 + db_inc.second),
                incident_type=IncidentType.PENALTY_AREA_CONTACT,
                involved_player_ids=[],
                involved_team_id=db_inc.match.home_team_id if db_inc.match else "ARG",
                source_event_ids=[],
                coordinates={"x": db_inc.x or 83.6, "y": db_inc.y or 49.2},
                initial_flag_reason=db_inc.description,
                initial_flag_reason_ar=db_inc.description_ar or db_inc.description,
                preliminary_assessment="Review requested under Law 12 physical challenge provisions.",
                preliminary_assessment_ar="تم طلب المراجعة وفقاً لأحكام القانون 12 للاحتكاكات البدنية.",
                confidence_rating=85.0,
                confidence_rationale="Evidence corroborated by multi-frame positional data.",
                confidence_rationale_ar="الأدلة مدعومة ببيانات الإحداثيات متعددة الإطارات.",
                created_at_iso=datetime.utcnow().isoformat(),
                updated_at_iso=datetime.utcnow().isoformat()
            )
            explanation = IncidentEngine.generate_structured_explanation(schema_inc)
            return {
                "incident_id": req.incident_id,
                "review_status": db_inc.review_status,
                "structured_explanation": explanation
            }
        finally:
            db.close()

    @router.get("/audit-log")
    def get_audit_log():
        """Returns union of memory simulation audit log and persistent database audit events."""
        db = SessionLocal()
        try:
            db_audits = db.query(DBAuditEvent).order_by(DBAuditEvent.timestamp.desc()).limit(50).all()
            formatted = [
                {
                    "audit_id": a.id,
                    "incident_id": a.incident_id,
                    "action": a.action_type,
                    "actor_type": "HUMAN_REFEREE" if "HUMAN" in a.action_type else "SYSTEM",
                    "description": a.details or f"Action {a.action_type} on {a.incident_id}",
                    "timestamp_seconds": a.timestamp.timestamp() if a.timestamp else 0.0,
                    "created_at": a.timestamp.isoformat() if a.timestamp else None
                }
                for a in db_audits
            ]
            return formatted or [a.dict() if hasattr(a, 'dict') else a for a in engine.audit_log]
        finally:
            db.close()

    @router.get("/cv-evidence/{incident_id}/{camera_id}")
    def get_cv_evidence(incident_id: str, camera_id: str):
        from app.evidence.cv_processor import ComputerVisionEvidenceProcessor
        return ComputerVisionEvidenceProcessor.process_incident_clip_metadata(incident_id, camera_id)

    return router
