from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class GameType(str, Enum):
    NEXT_TOUCH = "NEXT_TOUCH"
    NEXT_EVENT = "NEXT_EVENT"
    NEXT_FOUL = "NEXT_FOUL"
    TACTICAL_SHIFT = "TACTICAL_SHIFT"
    PENALTY_PREDICTOR = "PENALTY_PREDICTOR"

class PredictionStatus(str, Enum):
    OPEN = "OPEN"
    LOCKED = "LOCKED"
    RESOLVED_WON = "RESOLVED_WON"
    RESOLVED_LOST = "RESOLVED_LOST"
    VOIDED = "VOIDED"

class EligibleOption(BaseModel):
    id: str
    label: str
    label_ar: str
    subtext: Optional[str] = None
    points_multiplier: float = 1.0

class ActivePredictionGame(BaseModel):
    game_id: str
    match_id: str
    game_type: GameType
    title: str
    title_ar: str
    description: str
    description_ar: str
    options: List[EligibleOption]
    opened_at_seconds: float
    lock_deadline_seconds: float
    is_locked: bool = False
    is_resolved: bool = False
    qualifying_event_types: List[str]
    rule_explanation: str
    rule_explanation_ar: str
    correct_option_id: Optional[str] = None
    resolved_at_seconds: Optional[float] = None
    resolving_event_id: Optional[str] = None
    outcome_summary: Optional[str] = None
    outcome_summary_ar: Optional[str] = None

class PredictionSubmission(BaseModel):
    prediction_id: str
    game_id: str
    user_id: str
    selected_option_id: str
    submission_timestamp_seconds: float
    status: PredictionStatus = PredictionStatus.OPEN
    points_awarded: int = 0
    resolved_event_id: Optional[str] = None

class FanBadge(BaseModel):
    badge_id: str
    name: str
    name_ar: str
    description: str
    description_ar: str
    icon_name: str
    unlocked_at: Optional[str] = None
    is_unlocked: bool = False

class FanUserProfile(BaseModel):
    user_id: str
    username: str
    favorite_team_id: str
    points: int = 0
    streak_count: int = 0
    predictions_count: int = 0
    accuracy_rate: float = 0.0
    badges: List[FanBadge] = Field(default_factory=list)
    prediction_history: List[PredictionSubmission] = Field(default_factory=list)

class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    favorite_team: str
    points: int
    accuracy_rate: float
    streak: int
