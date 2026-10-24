from typing import Optional, Dict, Any
from app.schemas.incidents import Incident
from app.schemas.agents import AgentMessage
from app.incidents.engine import IncidentEngine

class EvidenceAngleAssistantAgent:
    """Agent 4: Evaluates camera angles, collinearity, occlusion, and recommends best review perspectives."""
    def run(self, incident: Optional[Incident], current_seconds: float) -> AgentMessage:
        if not incident or not incident.evidence_items:
            return AgentMessage(
                agent_name="Agent 4: Evidence & Angle Assistant",
                role="Spatial Camera Geometry & Angle Recommendation",
                timestamp_seconds=current_seconds,
                status="SUCCESS",
                summary="Camera evidence feeds idling; waiting for incident trigger.",
                summary_ar="كاميرات التوثيق في وضع الانتظار لحين بدء مراجعة حالة تحكيمية.",
                data_payload={"angles_ranked": 0}
            )

        ranked = IncidentEngine.rank_camera_angles(
            incident.evidence_items,
            incident.coordinates.get("x", 50.0),
            incident.coordinates.get("y", 50.0)
        )
        rec = next((c for c in ranked if c.is_recommended), ranked[0])

        summary_en = (
            f"Evaluated {len(ranked)} camera feeds. Top recommended viewpoint: {rec.camera_name} "
            f"(Score: {rec.visibility_score:.1f}/100). Reason: {rec.recommendation_reason}."
        )
        summary_ar = (
            f"تم تقييم {len(ranked)} زوايا تصوير. الزاوية الأفضل الموصى بها: {rec.camera_name_ar} "
            f"(درجة الوضوح: {rec.visibility_score:.1f}/100). السبب: {rec.recommendation_reason_ar}."
        )

        return AgentMessage(
            agent_name="Agent 4: Evidence & Angle Assistant",
            role="Spatial Camera Geometry & Angle Recommendation",
            timestamp_seconds=current_seconds,
            status="SUCCESS",
            summary=summary_en,
            summary_ar=summary_ar,
            data_payload={
                "recommended_camera_id": rec.camera_id,
                "recommended_camera_name": rec.camera_name,
                "visibility_score": rec.visibility_score,
                "total_angles_available": len(ranked),
                "limitations_noted": rec.limitations
            },
            provenance_event_ids=incident.source_event_ids
        )
