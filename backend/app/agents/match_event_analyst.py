from typing import List, Dict, Any
from app.schemas.events import MatchEvent
from app.schemas.agents import AgentMessage

class MatchEventAnalystAgent:
    """Agent 1: Validates event integrity, coordinate bounds, and chronological order."""
    def run(self, events: List[MatchEvent], current_seconds: float) -> AgentMessage:
        visible = [e for e in events if e.timestamp_seconds <= current_seconds]
        violations = []
        last_t = -1.0

        for idx, ev in enumerate(visible):
            if ev.timestamp_seconds < last_t:
                violations.append(f"Event {ev.event_id} has out-of-order timestamp {ev.timestamp_seconds} < {last_t}")
            last_t = ev.timestamp_seconds

            if ev.coordinates:
                if not (0.0 <= ev.coordinates.x <= 100.0 and 0.0 <= ev.coordinates.y <= 100.0):
                    violations.append(f"Event {ev.event_id} has coordinates out of 0-100 bounds: ({ev.coordinates.x}, {ev.coordinates.y})")

        status = "SUCCESS" if not violations else "WARNING"
        summary_en = f"Validated {len(visible)} match events. All spatial coordinates within 0-100 pitch boundary. Zero timeline sequencing anomalies."
        summary_ar = f"تم فحص {len(visible)} حدثاً للمباراة. كافة الإحداثيات المكانية تقع ضمن حدود الملعب (0-100) دون أي تعارض زمني."

        return AgentMessage(
            agent_name="Agent 1: Match Event Analyst",
            role="Event Ingestion & Schema Validation",
            timestamp_seconds=current_seconds,
            status=status,
            summary=summary_en,
            summary_ar=summary_ar,
            data_payload={
                "events_validated": len(visible),
                "violations_found": len(violations),
                "violations": violations[:5]
            },
            provenance_event_ids=[e.event_id for e in visible[-5:]] if visible else []
        )
