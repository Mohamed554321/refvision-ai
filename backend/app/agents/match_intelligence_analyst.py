from typing import List, Dict, Any
from app.schemas.events import MatchEvent
from app.schemas.agents import AgentMessage
from app.analytics.statistics import compute_match_analytics

class MatchIntelligenceAnalystAgent:
    """Agent 2: Calculates deterministic statistics, possession share, and momentum changes."""
    def run(self, events: List[MatchEvent], current_seconds: float) -> AgentMessage:
        analytics = compute_match_analytics(events, current_seconds)

        summary_en = (
            f"Minute {analytics.current_minute}: Apex Vanguard {analytics.home_stats.possession_percentage}% vs "
            f"Crown Meridian {analytics.away_stats.possession_percentage}% possession. "
            f"Turning points registered: {len(analytics.turning_points)}. Tactical momentum active."
        )
        summary_ar = (
            f"الدقيقة {analytics.current_minute}: نسبة الاستحواذ {analytics.home_stats.possession_percentage}% لأبيكس "
            f"مقابل {analytics.away_stats.possession_percentage}% لكراون. تم رصد {len(analytics.turning_points)} نقاط تحول تكتيكية."
        )

        return AgentMessage(
            agent_name="Agent 2: Match Intelligence Analyst",
            role="Deterministic Match Analytics & Tactical State",
            timestamp_seconds=current_seconds,
            status="SUCCESS",
            summary=summary_en,
            summary_ar=summary_ar,
            data_payload={
                "possession_home": analytics.home_stats.possession_percentage,
                "possession_away": analytics.away_stats.possession_percentage,
                "home_xg": analytics.home_stats.expected_goals_xg,
                "away_xg": analytics.away_stats.expected_goals_xg,
                "turning_points_count": len(analytics.turning_points)
            },
            provenance_event_ids=[tp.related_event_id for tp in analytics.turning_points]
        )
