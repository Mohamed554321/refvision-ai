from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MomentumDataPoint(BaseModel):
    minute: int
    second: int
    timestamp_seconds: float
    home_momentum: float = Field(..., ge=-100.0, le=100.0, description="Negative for away, positive for home dominance")
    away_momentum: float = Field(..., ge=-100.0, le=100.0)
    trigger_event: Optional[str] = None
    dominant_team_id: str

class TeamStats(BaseModel):
    team_id: str
    possession_percentage: float
    total_shots: int
    shots_on_target: int
    shots_off_target: int
    blocked_shots: int
    passes_attempted: int
    passes_completed: int
    pass_accuracy_pct: float
    fouls_committed: int
    yellow_cards: int
    red_cards: int
    corners: int
    offsides: int
    expected_goals_xg: float
    penalty_box_entries: int

class TurningPoint(BaseModel):
    minute: int
    second: int
    title: str
    title_ar: str
    description: str
    description_ar: str
    impact_level: str  # Critical, High, Moderate
    related_event_id: str

class MatchAnalytics(BaseModel):
    match_id: str
    current_minute: int
    home_stats: TeamStats
    away_stats: TeamStats
    momentum_series: List[MomentumDataPoint] = Field(default_factory=list)
    turning_points: List[TurningPoint] = Field(default_factory=list)
    tactical_narrative: str
    tactical_narrative_ar: str
