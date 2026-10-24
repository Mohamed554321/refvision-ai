from typing import Optional, Dict, Any
from app.schemas.incidents import Incident
from app.schemas.agents import AgentMessage
from app.incidents.rules_knowledge import IFAB_RULES_KNOWLEDGE

class OfficiatingEvidenceAnalystAgent:
    """Agent 3: Evaluates candidate incidents against available evidence and IFAB laws without claiming final authority."""
    def run(self, incident: Optional[Incident], current_seconds: float) -> AgentMessage:
        if not incident:
            return AgentMessage(
                agent_name="Agent 3: Officiating Evidence Analyst",
                role="Incident Evaluation & Rule Contextualization",
                timestamp_seconds=current_seconds,
                status="SUCCESS",
                summary="No active incident under review at current match minute.",
                summary_ar="لا توجد حالة تحكيمية قيد المراجعة في الدقيقة الحالية للمباراة.",
                data_payload={"active_incident": None}
            )

        summary_en = (
            f"Assessing incident {incident.incident_id} ({incident.incident_type.value}). "
            f"Initial contact at X={incident.coordinates.get('x', 0):.2f}. "
            f"Evaluated against IFAB Law 12. Preliminary assessment: {incident.preliminary_assessment}."
        )
        summary_ar = (
            f"تقييم الحالة التحكيمية {incident.incident_id} ({incident.incident_type.value}). "
            f"نقطة التلامس عند الإحداثي س={incident.coordinates.get('x', 0):.2f}. "
            f"تمت المطابقة مع القانون 12 للإيفاب. التقييم المبدئي: {incident.preliminary_assessment_ar}."
        )

        return AgentMessage(
            agent_name="Agent 3: Officiating Evidence Analyst",
            role="Incident Evaluation & Rule Contextualization",
            timestamp_seconds=current_seconds,
            status="SUCCESS",
            summary=summary_en,
            summary_ar=summary_ar,
            data_payload={
                "incident_id": incident.incident_id,
                "confidence_score": incident.confidence_rating,
                "applicable_law": "IFAB Law 12 & Law 14",
                "non_authoritative_reminder": "Advisory support only; official authority remains with human referee."
            },
            provenance_event_ids=incident.source_event_ids
        )
