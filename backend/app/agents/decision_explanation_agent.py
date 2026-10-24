from typing import Optional, Dict, Any, Tuple
from app.schemas.incidents import Incident, StructuredExplanation
from app.schemas.agents import AgentMessage
from app.incidents.engine import IncidentEngine

TupleAgentMessage = Tuple[Optional[StructuredExplanation], AgentMessage]

class DecisionExplanationAgent:
    """Agent 5: Generates verified, multi-mode explanations for fans, analysts, and broadcasters."""
    def run(self, incident: Optional[Incident], current_seconds: float) -> TupleAgentMessage:
        if not incident:
            return None, AgentMessage(
                agent_name="Agent 5: Decision Explanation Agent",
                role="Multi-Tier Decision Explanation",
                timestamp_seconds=current_seconds,
                status="SUCCESS",
                summary="Standby. Ready to synthesize explanations upon incident review.",
                summary_ar="في وضع الاستعداد لتوليد الشروحات فور مراجعة الحالة التحكيمية.",
                data_payload={}
            )

        explanation = IncidentEngine.generate_structured_explanation(incident)
        summary_en = f"Synthesized grounded explanations for Incident {incident.incident_id} across Fan, Analyst, and Broadcast tiers."
        summary_ar = f"تم توليد الشروحات الموثقة للحالة {incident.incident_id} للمشجعين، المحللين، وغرف البث."

        msg = AgentMessage(
            agent_name="Agent 5: Decision Explanation Agent",
            role="Multi-Tier Decision Explanation",
            timestamp_seconds=current_seconds,
            status="SUCCESS",
            summary=summary_en,
            summary_ar=summary_ar,
            data_payload={
                "incident_id": incident.incident_id,
                "fan_headline": explanation.fan_mode.get("headline"),
                "analyst_citation": explanation.analyst_mode.get("ifab_rule_citation"),
                "broadcast_header": explanation.broadcast_mode.get("on_screen_graphic_header"),
                "uncertainty": explanation.uncertainty_statement
            },
            provenance_event_ids=incident.source_event_ids
        )
        return explanation, msg

# Tuple helper for type annotation
from typing import Tuple
TupleAgentMessage = Tuple[Optional[StructuredExplanation], AgentMessage]
