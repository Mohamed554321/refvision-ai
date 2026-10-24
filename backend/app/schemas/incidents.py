from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IncidentType(str, Enum):
    PENALTY_AREA_CONTACT = "PENALTY_AREA_CONTACT"
    POTENTIAL_HANDBALL = "POTENTIAL_HANDBALL"
    SERIOUS_FOUL_PLAY = "SERIOUS_FOUL_PLAY"
    POTENTIAL_OFFSIDE_GOAL = "POTENTIAL_OFFSIDE_GOAL"
    DOGSO = "DOGSO"  # Denial of an Obvious Goal-Scoring Opportunity
    VIOLENT_CONDUCT = "VIOLENT_CONDUCT"

class IncidentReviewStatus(str, Enum):
    FLAGGED = "FLAGGED"
    UNDER_VAR_INSPECTION = "UNDER_VAR_INSPECTION"
    ANGLES_COMPARED = "ANGLES_COMPARED"
    DECISION_RECORDED = "DECISION_RECORDED"
    EXPLANATION_PUBLISHED = "EXPLANATION_PUBLISHED"

class CameraType(str, Enum):
    MAIN_BROADCAST = "MAIN_BROADCAST"
    WIDE_TACTICAL = "WIDE_TACTICAL"
    EIGHTEEN_YARD_BOX_LEFT = "EIGHTEEN_YARD_BOX_LEFT"
    EIGHTEEN_YARD_BOX_RIGHT = "EIGHTEEN_YARD_BOX_RIGHT"
    GOAL_LINE_LEFT = "GOAL_LINE_LEFT"
    GOAL_LINE_RIGHT = "GOAL_LINE_RIGHT"
    REFEREE_BODY_CAM = "REFEREE_BODY_CAM"
    HIGH_BEHIND_GOAL = "HIGH_BEHIND_GOAL"

class CameraEvidence(BaseModel):
    evidence_id: str
    incident_id: str
    camera_id: str
    camera_name: str
    camera_name_ar: str
    camera_type: CameraType
    timestamp_start_seconds: float
    timestamp_end_seconds: float
    sync_offset_ms: float = 0.0
    field_coverage: str
    field_coverage_ar: str
    occlusion_level: str = "Low"  # Low, Moderate, High
    visibility_score: float = Field(..., ge=0.0, le=100.0)
    is_recommended: bool = False
    recommendation_reason: str
    recommendation_reason_ar: str
    simulated_perspective_url: str
    key_observation: str
    key_observation_ar: str
    limitations: str
    limitations_ar: str

class CandidateInterpretation(BaseModel):
    interpretation_id: str
    title: str
    title_ar: str
    likelihood: str  # Plausible, Less Likely, Supported by Evidence
    supporting_arguments: List[str]
    supporting_arguments_ar: List[str]
    counter_arguments: List[str]
    counter_arguments_ar: List[str]
    applicable_law: str
    applicable_law_ar: str

class RecordedDecision(BaseModel):
    decision_id: str
    incident_id: str
    recorded_by: str
    role: str  # Referee, VAR, Assistant
    timestamp_recorded_seconds: float
    official_ruling: str
    official_ruling_ar: str
    disciplinary_action: str  # None, Yellow Card, Red Card
    restart_play: str  # Penalty Kick, Direct Free Kick, Indirect Free Kick, Goal Kick, Corner Kick, Dropped Ball
    rationale: str
    rationale_ar: str

class ExplanationMode(str, Enum):
    FAN = "FAN"
    ANALYST = "ANALYST"
    BROADCAST = "BROADCAST"

class StructuredExplanation(BaseModel):
    fan_mode: Dict[str, Any]
    analyst_mode: Dict[str, Any]
    broadcast_mode: Dict[str, Any]
    uncertainty_statement: str
    uncertainty_statement_ar: str
    missing_evidence: List[str]
    missing_evidence_ar: List[str]
    laws_referenced: List[str]
    laws_referenced_ar: List[str]
    verification_status: str = "AI_ASSESSMENT_PROVISIONAL"

class Incident(BaseModel):
    incident_id: str
    match_id: str
    minute: int
    second: int
    timestamp_seconds: float
    incident_type: IncidentType
    involved_player_ids: List[str]
    involved_team_id: str
    source_event_ids: List[str]
    coordinates: Dict[str, float] = Field(default_factory=dict)
    initial_flag_reason: str
    initial_flag_reason_ar: str
    preliminary_assessment: str
    preliminary_assessment_ar: str
    confidence_rating: float = Field(..., ge=0.0, le=100.0)
    confidence_rationale: str
    confidence_rationale_ar: str
    review_status: IncidentReviewStatus = IncidentReviewStatus.FLAGGED
    evidence_items: List[CameraEvidence] = Field(default_factory=list)
    candidate_interpretations: List[CandidateInterpretation] = Field(default_factory=list)
    recorded_decision: Optional[RecordedDecision] = None
    structured_explanation: Optional[StructuredExplanation] = None
    created_at_iso: str
    updated_at_iso: str

class AuditEvent(BaseModel):
    audit_id: str
    incident_id: str
    timestamp_seconds: float
    action: str
    actor_type: str  # SYSTEM_EVENT_DETECTOR, VAR_OPERATOR, HUMAN_REFEREE, EXPLANATION_AGENT
    description: str
    payload_snapshot: Dict[str, Any] = Field(default_factory=dict)
