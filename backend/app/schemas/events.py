from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class MatchStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    LIVE = "LIVE"
    HALF_TIME = "HALF_TIME"
    FULL_TIME = "FULL_TIME"
    PAUSED = "PAUSED"

class EventType(str, Enum):
    KICKOFF = "KICKOFF"
    PASS = "PASS"
    INTERCEPTION = "INTERCEPTION"
    TACKLE = "TACKLE"
    SHOT = "SHOT"
    SHOT_BLOCKED = "SHOT_BLOCKED"
    GOAL = "GOAL"
    FOUL = "FOUL"
    YELLOW_CARD = "YELLOW_CARD"
    RED_CARD = "RED_CARD"
    OFFSIDE = "OFFSIDE"
    CORNER = "CORNER"
    PENALTY_AWARDED = "PENALTY_AWARDED"
    PENALTY_CHECK = "PENALTY_CHECK"
    HANDBALL_CHECK = "HANDBALL_CHECK"
    VAR_REVIEW = "VAR_REVIEW"
    SUBSTITUTION = "SUBSTITUTION"
    POSSESSION_CHANGE = "POSSESSION_CHANGE"

class PlayerPosition(str, Enum):
    GK = "GK"
    DEF = "DEF"
    MID = "MID"
    FWD = "FWD"

class Player(BaseModel):
    player_id: str
    jersey_number: int
    display_name: str
    display_name_ar: str
    team_id: str
    position: PlayerPosition
    is_starter: bool = True
    yellow_cards: int = 0
    red_cards: int = 0
    touches: int = 0
    passes_completed: int = 0
    passes_attempted: int = 0
    shots: int = 0
    shots_on_target: int = 0
    fouls_committed: int = 0

class Team(BaseModel):
    team_id: str
    name: str
    name_ar: str
    short_code: str
    primary_color: str
    secondary_color: str
    players: List[Player] = Field(default_factory=list)

class FieldCoordinates(BaseModel):
    x: float = Field(..., description="Field X percentage: 0 to 100 from left to right goal")
    y: float = Field(..., description="Field Y percentage: 0 to 100 from top touchline to bottom touchline")
    z: Optional[float] = Field(0.0, description="Height in meters off the turf")

class MatchEvent(BaseModel):
    event_id: str
    match_id: str
    timestamp_seconds: float
    minute: int
    second: int
    event_type: EventType
    team_id: str
    player_id: Optional[str] = None
    related_player_id: Optional[str] = None
    coordinates: Optional[FieldCoordinates] = None
    end_coordinates: Optional[FieldCoordinates] = None
    event_attributes: Dict[str, Any] = Field(default_factory=dict)
    is_noteworthy: bool = False
    source: str = "synthetic_engine_v1"
    validation_status: str = "verified"

class Match(BaseModel):
    match_id: str
    home_team: Team
    away_team: Team
    home_score: int = 0
    away_score: int = 0
    current_minute: int = 0
    current_second: int = 0
    current_timestamp_seconds: float = 0.0
    status: MatchStatus = MatchStatus.SCHEDULED
    simulation_seed: str = "MATCH_PL_2026_01"
    stadium_name: str = "Apex Arena"
    stadium_name_ar: str = "أرينا أبيكس"
    referee_name: str = "Marcus Sterling"
    referee_name_ar: str = "ماركوس ستيرلينغ"
    var_official_name: str = "David Alpert"
    var_official_name_ar: str = "ديفيد ألبرت"
