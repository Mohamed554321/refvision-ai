from typing import List, Dict, Any
from app.schemas.predictions import ActivePredictionGame, FanUserProfile
from app.schemas.agents import AgentMessage

class FanExperienceAgent:
    """Agent 6: Adapts match narratives, tracks predictions, handles streaks, and personalizes user feed."""
    def run(self, games: List[ActivePredictionGame], profile: FanUserProfile, current_seconds: float) -> AgentMessage:
        open_count = sum(1 for g in games if not g.is_locked and not g.is_resolved)
        resolved_count = sum(1 for g in games if g.is_resolved)

        summary_en = (
            f"Fan Arena personalized for {profile.username}: {profile.points} pts, "
            f"{profile.streak_count} win streak, {open_count} active prediction games open, "
            f"{resolved_count} games resolved."
        )
        summary_ar = (
            f"ساحة المشجعين مخصصة للمستخدم {profile.username}: {profile.points} نقطة، "
            f"سلسلة انتصارات {profile.streak_count}، {open_count} ألعاب توقعات مفتوحة، "
            f"و {resolved_count} ألعاب مكتملة."
        )

        return AgentMessage(
            agent_name="Agent 6: Fan Experience Agent",
            role="Gamification & Fan Personalization",
            timestamp_seconds=current_seconds,
            status="SUCCESS",
            summary=summary_en,
            summary_ar=summary_ar,
            data_payload={
                "user_id": profile.user_id,
                "user_points": profile.points,
                "user_streak": profile.streak_count,
                "unlocked_badges": [b.name for b in profile.badges if b.is_unlocked],
                "active_games_count": len(games)
            },
            provenance_event_ids=[]
        )
