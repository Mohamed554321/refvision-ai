from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(String(50), primary_key=True, index=True)
    source_name = Column(String(100), nullable=False)
    source_url = Column(String(255), nullable=False)
    license = Column(String(100), nullable=False)
    attribution = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    imports = relationship("DatasetImport", back_populates="source")


class DatasetImport(Base):
    __tablename__ = "dataset_imports"

    id = Column(String(50), primary_key=True, index=True)
    source_id = Column(String(50), ForeignKey("data_sources.id"), nullable=False)
    dataset_name = Column(String(100), nullable=False)
    version = Column(String(50), default="1.0")
    records_count = Column(Integer, default=0)
    matches_count = Column(Integer, default=0)
    events_count = Column(Integer, default=0)
    import_status = Column(String(50), default="COMPLETED")
    manifest_path = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("DataSource", back_populates="imports")


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    country_name = Column(String(100), default="International")
    gender = Column(String(20), default="male")
    is_synthetic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    seasons = relationship("Season", back_populates="competition")
    matches = relationship("Match", back_populates="competition")


class Season(Base):
    __tablename__ = "seasons"

    id = Column(String(50), primary_key=True, index=True)
    competition_id = Column(String(50), ForeignKey("competitions.id"), nullable=False)
    season_name = Column(String(50), nullable=False)

    competition = relationship("Competition", back_populates="seasons")
    matches = relationship("Match", back_populates="season")


class Team(Base):
    __tablename__ = "teams"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_ar = Column(String(100), nullable=True)
    short_code = Column(String(10), nullable=False)
    country = Column(String(100), default="International")
    primary_color = Column(String(20), default="#00FF87")
    secondary_color = Column(String(20), default="#0B132B")
    is_synthetic = Column(Boolean, default=False)

    players = relationship("Player", back_populates="team")


class Player(Base):
    __tablename__ = "players"

    id = Column(String(50), primary_key=True, index=True)
    team_id = Column(String(50), ForeignKey("teams.id"), nullable=False)
    name = Column(String(100), nullable=False)
    name_ar = Column(String(100), nullable=True)
    jersey_number = Column(Integer, default=1)
    position = Column(String(50), default="Midfielder")
    position_ar = Column(String(50), nullable=True)
    is_starter = Column(Boolean, default=True)

    team = relationship("Team", back_populates="players")


class Match(Base):
    __tablename__ = "matches"

    id = Column(String(50), primary_key=True, index=True)
    competition_id = Column(String(50), ForeignKey("competitions.id"), nullable=True)
    season_id = Column(String(50), ForeignKey("seasons.id"), nullable=True)
    home_team_id = Column(String(50), ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(String(50), ForeignKey("teams.id"), nullable=False)
    match_date = Column(String(50), nullable=True)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    current_minute = Column(Integer, default=0)
    current_second = Column(Integer, default=0)
    status = Column(String(20), default="COMPLETED")  # LIVE, PAUSED, COMPLETED
    stadium_name = Column(String(100), default="Main Stadium")
    referee_name = Column(String(100), default="Official Referee")
    var_official_name = Column(String(100), default="VAR Specialist")
    is_synthetic = Column(Boolean, default=False)
    provenance_source = Column(String(100), default="StatsBomb Open Data")
    provenance_url = Column(String(255), nullable=True)

    competition = relationship("Competition", back_populates="matches")
    season = relationship("Season", back_populates="matches")
    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])
    events = relationship("MatchEvent", back_populates="match", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="match", cascade="all, delete-orphan")


class MatchLineup(Base):
    __tablename__ = "match_lineups"

    id = Column(String(50), primary_key=True, index=True)
    match_id = Column(String(50), ForeignKey("matches.id"), nullable=False)
    team_id = Column(String(50), ForeignKey("teams.id"), nullable=False)
    player_id = Column(String(50), ForeignKey("players.id"), nullable=False)
    jersey_number = Column(Integer, default=1)
    position = Column(String(50), default="Starter")
    is_starter = Column(Boolean, default=True)


class MatchEvent(Base):
    __tablename__ = "match_events"

    id = Column(String(50), primary_key=True, index=True)
    match_id = Column(String(50), ForeignKey("matches.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    minute = Column(Integer, default=0)
    second = Column(Integer, default=0)
    timestamp_seconds = Column(Float, default=0.0)
    period = Column(Integer, default=1)
    team_id = Column(String(50), nullable=True)
    player_id = Column(String(50), nullable=True)
    player_name = Column(String(100), nullable=True)
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    end_x = Column(Float, nullable=True)
    end_y = Column(Float, nullable=True)
    outcome = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    description_ar = Column(Text, nullable=True)
    is_synthetic = Column(Boolean, default=False)
    metadata_json = Column(JSON, nullable=True)

    match = relationship("Match", back_populates="events")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    match_id = Column(String(50), ForeignKey("matches.id"), nullable=False)
    minute = Column(Integer, nullable=False)
    second = Column(Integer, default=0)
    incident_type = Column(String(50), nullable=False)  # PENALTY_CHECK, RED_CARD_CHECK, GOAL_CHECK, OFFSIDE_CHECK
    review_category = Column(String(50), default="Penalty / No Penalty")
    description = Column(Text, nullable=False)
    description_ar = Column(Text, nullable=True)
    x = Column(Float, nullable=True)
    y = Column(Float, nullable=True)
    review_status = Column(String(50), default="AWAITING_REVIEW")
    initial_decision = Column(String(100), nullable=True)
    human_ruling = Column(String(100), nullable=True)
    human_ruling_ar = Column(String(100), nullable=True)
    disciplinary_action = Column(String(100), nullable=True)
    restart_play = Column(String(100), nullable=True)
    rationale = Column(Text, nullable=True)
    rationale_ar = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    is_synthetic = Column(Boolean, default=False)
    uncertainty_margin = Column(String(50), default="+/- 3.2cm")

    match = relationship("Match", back_populates="incidents")
    evidence_items = relationship("EvidenceItem", back_populates="incident", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="incident", cascade="all, delete-orphan")


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False)
    camera_id = Column(String(50), nullable=False)
    camera_name = Column(String(100), nullable=False)
    camera_name_ar = Column(String(100), nullable=True)
    is_recommended = Column(Boolean, default=False)
    clarity_score = Column(Float, default=90.0)
    collinearity_score = Column(Float, default=85.0)
    distance_to_play = Column(Float, default=15.0)
    occlusion_level = Column(String(20), default="LOW")
    camera_type = Column(String(50), default="18-Yard Line Camera")
    description = Column(Text, nullable=True)

    incident = relationship("Incident", back_populates="evidence_items")


class RuleReference(Base):
    __tablename__ = "rule_references"

    id = Column(String(50), primary_key=True, index=True)
    law_number = Column(String(20), nullable=False)
    section = Column(String(100), nullable=False)
    title_en = Column(String(200), nullable=False)
    title_ar = Column(String(200), nullable=True)
    summary_en = Column(Text, nullable=False)
    summary_ar = Column(Text, nullable=True)
    full_text_en = Column(Text, nullable=True)
    full_text_ar = Column(Text, nullable=True)
    official_source_url = Column(String(255), default="https://www.theifab.com/laws/2025-26/")
    relevance_keywords = Column(Text, nullable=True)
    edition = Column(String(50), default="2025/2026")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(String(50), primary_key=True, index=True)
    document_type = Column(String(50), default="IFAB_LAWS")  # IFAB_LAWS, VAR_PROTOCOL
    title = Column(String(200), nullable=False)
    title_ar = Column(String(200), nullable=True)
    edition = Column(String(50), default="2025/2026")
    source_url = Column(String(255), nullable=False)
    section = Column(String(100), nullable=False)
    content_en = Column(Text, nullable=False)
    content_ar = Column(Text, nullable=True)
    indexed_at = Column(DateTime, default=datetime.utcnow)


class FanGame(Base):
    __tablename__ = "fan_games"

    id = Column(String(50), primary_key=True, index=True)
    game_type = Column(String(50), nullable=False)  # PREDICT_XI, FIRST_CARD, SPOT_THE_RULE, MATCH_MINUTE, TOUCHLINE_TACTICIAN, NEXT_TOUCH, VAR_RULING
    match_id = Column(String(50), nullable=False)
    title_en = Column(String(200), nullable=False)
    title_ar = Column(String(200), nullable=True)
    description_en = Column(Text, nullable=True)
    description_ar = Column(Text, nullable=True)
    options_json = Column(JSON, nullable=False)
    correct_option_id = Column(String(50), nullable=True)
    is_resolved = Column(Boolean, default=False)
    points_reward = Column(Integer, default=50)
    deadline_minute = Column(Integer, default=90)
    deadline_seconds = Column(Float, default=5400.0)
    status = Column(String(20), default="OPEN")  # OPEN, LOCKED, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("FanPrediction", back_populates="game")


class FanPrediction(Base):
    __tablename__ = "fan_predictions"

    id = Column(String(50), primary_key=True, index=True)
    game_id = Column(String(50), ForeignKey("fan_games.id"), nullable=False)
    user_id = Column(String(50), nullable=False)
    selected_option_id = Column(String(50), nullable=False)
    status = Column(String(50), default="OPEN")  # OPEN, RESOLVED_WON, RESOLVED_LOST
    points_awarded = Column(Integer, default=0)
    streak_multiplier = Column(Float, default=1.0)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    game = relationship("FanGame", back_populates="predictions")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(50), primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    favorite_team_id = Column(String(50), default="APX")
    points = Column(Integer, default=140)
    streak_count = Column(Integer, default=2)
    predictions_count = Column(Integer, default=3)
    accuracy_rate = Column(Float, default=66.7)
    badges_json = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False)
    action_type = Column(String(50), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    actor_name = Column(String(100), default="Human Official")
    details = Column(Text, nullable=True)
    evidence_references = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="audit_events")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String(50), primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    task_type = Column(String(100), nullable=False)
    algorithm = Column(String(100), nullable=False)
    version = Column(String(20), default="1.0.0")
    dataset_name = Column(String(100), nullable=False)
    train_samples = Column(Integer, default=0)
    val_samples = Column(Integer, default=0)
    test_samples = Column(Integer, default=0)
    metrics_json = Column(JSON, nullable=False)
    baseline_metrics_json = Column(JSON, nullable=True)
    hyperparameters_json = Column(JSON, nullable=True)
    artifact_path = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    trained_at = Column(DateTime, default=datetime.utcnow)
    limitations_notes = Column(Text, nullable=True)


class VideoAnalysis(Base):
    __tablename__ = "video_analyses"

    id = Column(String(50), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    fps = Column(Float, default=0.0)
    width = Column(Integer, default=0)
    height = Column(Integer, default=0)
    frame_count = Column(Integer, default=0)
    incident_timestamp = Column(Float, nullable=True)
    incident_type = Column(String(100), default="POTENTIAL_FOUL")
    user_description = Column(Text, nullable=True)
    status = Column(String(50), default="UPLOADED")  # UPLOADED, PROCESSING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    observable_evidence_json = Column(JSON, nullable=True)
    rule_references_json = Column(JSON, nullable=True)
    decision_support_json = Column(JSON, nullable=True)
    extracted_frames_json = Column(JSON, nullable=True)
    human_ruling = Column(String(100), nullable=True)
    human_disciplinary = Column(String(100), nullable=True)
    human_restart = Column(String(100), nullable=True)
    human_rationale = Column(Text, nullable=True)
    human_reviewed_by = Column(String(100), nullable=True)
    human_reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LiveSession(Base):
    __tablename__ = "live_sessions"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    match_id = Column(String(50), nullable=True)
    source_type = Column(String(50), default="EVENT_FEED_SIMULATION")  # VIDEO_URL, VIDEO_UPLOAD, EVENT_FEED_SIMULATION, MANUAL
    source_url = Column(String(500), nullable=True)
    video_analysis_id = Column(String(50), nullable=True)
    status = Column(String(50), default="IDLE")  # IDLE, ACTIVE, PAUSED, STOPPED, ERROR
    connection_status = Column(String(50), default="DISCONNECTED")  # CONNECTED, BUFFERING, DISCONNECTED, ERROR
    current_minute = Column(Integer, default=0)
    current_second = Column(Integer, default=0)
    current_timestamp_seconds = Column(Float, default=0.0)
    events_processed_count = Column(Integer, default=0)
    incidents_flagged_count = Column(Integer, default=0)
    human_decisions_count = Column(Integer, default=0)
    measured_latency_ms = Column(Float, default=14.2)
    source_check_result_json = Column(JSON, nullable=True)
    events_log_json = Column(JSON, nullable=True)
    incidents_log_json = Column(JSON, nullable=True)
    session_report_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


