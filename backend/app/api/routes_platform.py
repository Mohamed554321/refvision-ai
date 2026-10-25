from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.db.models import (
    DataSource, DatasetImport, Competition, Season, Team, Player, Match,
    MatchEvent, Incident, EvidenceItem, RuleReference, KnowledgeDocument,
    FanGame, FanPrediction, UserProfile, AuditEvent, ModelVersion
)
from app.knowledge.rules_service import search_rules, get_rule_by_id, get_knowledge_documents
from app.analytics.reproducible_analytics import compute_match_analytics_from_db
from app.predictions.fan_arena_service import get_all_fan_games, submit_fan_prediction, get_leaderboard_from_db
from app.ml.inference import predict_shot_xg, get_model

router = APIRouter(prefix="/api", tags=["Platform & Compliance API"])


# -------------------------------------------------------------
# System & Status
# -------------------------------------------------------------
@router.get("/system/status")
def get_system_status(db: Session = Depends(get_db)):
    db_connected = True
    try:
        db.execute(Match.__table__.select().limit(1))
    except Exception:
        db_connected = False

    _, metadata = get_model()
    model_loaded = metadata is not None

    total_matches = db.query(Match).count()
    total_events = db.query(MatchEvent).count()
    total_rules = db.query(RuleReference).count()

    return {
        "status": "OPERATIONAL",
        "api_health": "HEALTHY",
        "database_persistence": {
            "status": "CONNECTED" if db_connected else "ERROR",
            "type": "SQLite",
            "total_matches": total_matches,
            "total_events": total_events
        },
        "knowledge_base": {
            "status": "INDEXED",
            "indexed_rules": total_rules,
            "official_source": "IFAB Laws of the Game 2025/26"
        },
        "ml_model_service": {
            "status": "READY" if model_loaded else "NOT_TRAINED",
            "model_id": metadata.get("model_id") if metadata else None,
            "algorithm": metadata.get("algorithm") if metadata else None,
            "version": metadata.get("version") if metadata else None,
            "task": metadata.get("task_type") if metadata else None
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/system/methodology")
def get_methodology():
    return {
        "product_name": "RefVision AI",
        "tagline": "See the Decision. Understand the Game.",
        "architecture": {
            "backend": "FastAPI + SQLAlchemy + SQLite",
            "analytics_engine": "Deterministic python analytical algorithms (possession, pass accuracy, momentum)",
            "knowledge_retrieval": "Structured indexing of IFAB Laws of the Game & VAR Protocol with section-aware chunking",
            "multi_agent_system": "Microsoft Agent Framework 7-Agent Pipeline (Match Event, Intelligence, Officiating Evidence, Camera Angle, Explanation, Fan Experience, Quality Gate)",
            "ml_pipeline": "Expected Goals (xG) GradientBoosting model trained on real StatsBomb 2022 World Cup shot events"
        },
        "data_provenance": [
            {
                "source": "StatsBomb Open Data",
                "license": "CC BY 4.0",
                "usage": "Real historical match events, coordinates, lineups, shot outcomes",
                "url": "https://github.com/statsbomb/open-data"
            },
            {
                "source": "The International Football Association Board (IFAB)",
                "license": "Official Football Laws (Public Reference)",
                "usage": "Law 11 Offside, Law 12 Fouls & Misconduct, Law 14 Penalty Kick, VAR Protocol 2025/26",
                "url": "https://www.theifab.com/laws/2025-26/"
            },
            {
                "source": "RefVision Synthetic Test Stream",
                "license": "Hackathon Project Research License",
                "usage": "Deterministic Minute 68 VAR Anchor Demo (Apex Vanguard vs Crown Meridian)",
                "url": "https://github.com/microsoft/insidethegamehackathon"
            }
        ],
        "ethical_ai_commitments": [
            "We NEVER fabricate live match camera feeds or referee statements.",
            "We clearly label synthetic training scenarios vs real historical matches.",
            "We explicitly report data limitations: event datasets do NOT contain 3D optical tracking or audio comms.",
            "Human referees retain final, exclusive authority over all football decisions."
        ]
    }


# -------------------------------------------------------------
# Data Sources & Imports
# -------------------------------------------------------------
@router.get("/data-sources")
def get_data_sources(db: Session = Depends(get_db)):
    sources = db.query(DataSource).all()
    return [
        {
            "id": s.id,
            "source_name": s.source_name,
            "source_url": s.source_url,
            "license": s.license,
            "attribution": s.attribution,
            "is_active": s.is_active
        }
        for s in sources
    ]


@router.get("/data-sources/{source_id}")
def get_data_source(source_id: str, db: Session = Depends(get_db)):
    s = db.query(DataSource).filter_by(id=source_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Data source not found")
    return {
        "id": s.id,
        "source_name": s.source_name,
        "source_url": s.source_url,
        "license": s.license,
        "attribution": s.attribution
    }


@router.get("/datasets")
def get_datasets(db: Session = Depends(get_db)):
    imports = db.query(DatasetImport).all()
    return [
        {
            "id": imp.id,
            "source_id": imp.source_id,
            "dataset_name": imp.dataset_name,
            "version": imp.version,
            "records_count": imp.records_count,
            "matches_count": imp.matches_count,
            "events_count": imp.events_count,
            "import_status": imp.import_status,
            "imported_at": imp.imported_at.isoformat() if imp.imported_at else None,
            "notes": imp.notes
        }
        for imp in imports
    ]


# -------------------------------------------------------------
# Competitions, Seasons, Teams, Players
# -------------------------------------------------------------
@router.get("/competitions")
def get_competitions(db: Session = Depends(get_db)):
    comps = db.query(Competition).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "country_name": c.country_name,
            "gender": c.gender,
            "is_synthetic": c.is_synthetic
        }
        for c in comps
    ]


@router.get("/seasons")
def get_seasons(db: Session = Depends(get_db)):
    seasons = db.query(Season).all()
    return [
        {"id": s.id, "competition_id": s.competition_id, "season_name": s.season_name}
        for s in seasons
    ]


@router.get("/teams")
def get_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "name_ar": t.name_ar,
            "short_code": t.short_code,
            "country": t.country,
            "primary_color": t.primary_color,
            "secondary_color": t.secondary_color,
            "is_synthetic": t.is_synthetic
        }
        for t in teams
    ]


@router.get("/players")
def get_players(team_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Player)
    if team_id:
        query = query.filter_by(team_id=team_id)
    players = query.all()
    return [
        {
            "id": p.id,
            "team_id": p.team_id,
            "name": p.name,
            "name_ar": p.name_ar,
            "jersey_number": p.jersey_number,
            "position": p.position,
            "position_ar": p.position_ar,
            "is_starter": p.is_starter
        }
        for p in players
    ]


# -------------------------------------------------------------
# Matches & Events
# -------------------------------------------------------------
@router.get("/matches")
def get_matches(db: Session = Depends(get_db)):
    matches = db.query(Match).all()
    return [
        {
            "id": m.id,
            "home_team": {
                "id": m.home_team.id if m.home_team else m.home_team_id,
                "name": m.home_team.name if m.home_team else "Home",
                "name_ar": m.home_team.name_ar if m.home_team else None,
                "short_code": m.home_team.short_code if m.home_team else "HOM",
                "primary_color": m.home_team.primary_color if m.home_team else "#00FF87"
            },
            "away_team": {
                "id": m.away_team.id if m.away_team else m.away_team_id,
                "name": m.away_team.name if m.away_team else "Away",
                "name_ar": m.away_team.name_ar if m.away_team else None,
                "short_code": m.away_team.short_code if m.away_team else "AWY",
                "primary_color": m.away_team.primary_color if m.away_team else "#3A86FF"
            },
            "home_score": m.home_score,
            "away_score": m.away_score,
            "match_date": m.match_date,
            "status": m.status,
            "current_minute": m.current_minute,
            "is_synthetic": m.is_synthetic,
            "stadium_name": m.stadium_name,
            "referee_name": m.referee_name,
            "provenance_source": m.provenance_source
        }
        for m in matches
    ]


@router.get("/matches/{match_id}")
def get_match(match_id: str, db: Session = Depends(get_db)):
    m = db.query(Match).filter_by(id=match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    return {
        "id": m.id,
        "home_team": {
            "id": m.home_team.id if m.home_team else m.home_team_id,
            "name": m.home_team.name if m.home_team else "Home",
            "name_ar": m.home_team.name_ar if m.home_team else None,
            "short_code": m.home_team.short_code if m.home_team else "HOM",
            "primary_color": m.home_team.primary_color if m.home_team else "#00FF87"
        },
        "away_team": {
            "id": m.away_team.id if m.away_team else m.away_team_id,
            "name": m.away_team.name if m.away_team else "Away",
            "name_ar": m.away_team.name_ar if m.away_team else None,
            "short_code": m.away_team.short_code if m.away_team else "AWY",
            "primary_color": m.away_team.primary_color if m.away_team else "#3A86FF"
        },
        "home_score": m.home_score,
        "away_score": m.away_score,
        "match_date": m.match_date,
        "status": m.status,
        "current_minute": m.current_minute,
        "stadium_name": m.stadium_name,
        "referee_name": m.referee_name,
        "var_official_name": m.var_official_name,
        "is_synthetic": m.is_synthetic,
        "provenance_source": m.provenance_source,
        "provenance_url": m.provenance_url
    }


@router.get("/matches/{match_id}/events")
def get_match_events(
    match_id: str,
    limit: int = Query(500, le=5000),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    events = db.query(MatchEvent).filter_by(match_id=match_id).offset(offset).limit(limit).all()
    return [
        {
            "id": e.id,
            "match_id": e.match_id,
            "event_type": e.event_type,
            "minute": e.minute,
            "second": e.second,
            "timestamp_seconds": e.timestamp_seconds,
            "period": e.period,
            "team_id": e.team_id,
            "player_id": e.player_id,
            "player_name": e.player_name,
            "x": e.x,
            "y": e.y,
            "end_x": e.end_x,
            "end_y": e.end_y,
            "outcome": e.outcome,
            "is_synthetic": e.is_synthetic,
            "metadata": e.metadata_json
        }
        for e in events
    ]


@router.get("/matches/{match_id}/statistics")
def get_match_statistics(match_id: str, db: Session = Depends(get_db)):
    return compute_match_analytics_from_db(match_id, db)


# -------------------------------------------------------------
# Incidents & Human Review Workflow
# -------------------------------------------------------------
class ReviewDecisionPayload(BaseModel):
    official_ruling: str
    official_ruling_ar: Optional[str] = None
    disciplinary_action: Optional[str] = None
    restart_play: Optional[str] = None
    rationale: str
    rationale_ar: Optional[str] = None
    recorded_by: Optional[str] = "Official Referee"


@router.get("/incidents")
def get_incidents(match_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Incident)
    if match_id:
        query = query.filter_by(match_id=match_id)
    incidents = query.all()
    return [
        {
            "id": inc.id,
            "match_id": inc.match_id,
            "minute": inc.minute,
            "second": inc.second,
            "incident_type": inc.incident_type,
            "review_category": inc.review_category,
            "description": inc.description,
            "description_ar": inc.description_ar,
            "x": inc.x,
            "y": inc.y,
            "review_status": inc.review_status,
            "initial_decision": inc.initial_decision,
            "human_ruling": inc.human_ruling,
            "human_ruling_ar": inc.human_ruling_ar,
            "disciplinary_action": inc.disciplinary_action,
            "restart_play": inc.restart_play,
            "rationale": inc.rationale,
            "rationale_ar": inc.rationale_ar,
            "reviewed_by": inc.reviewed_by,
            "reviewed_at": inc.reviewed_at.isoformat() if inc.reviewed_at else None,
            "is_synthetic": inc.is_synthetic,
            "uncertainty_margin": inc.uncertainty_margin
        }
        for inc in incidents
    ]


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = db.query(EvidenceItem).filter_by(incident_id=incident_id).all()
    audits = db.query(AuditEvent).filter_by(incident_id=incident_id).order_by(AuditEvent.timestamp.desc()).all()

    return {
        "id": inc.id,
        "match_id": inc.match_id,
        "minute": inc.minute,
        "second": inc.second,
        "incident_type": inc.incident_type,
        "review_category": inc.review_category,
        "description": inc.description,
        "description_ar": inc.description_ar,
        "x": inc.x,
        "y": inc.y,
        "review_status": inc.review_status,
        "initial_decision": inc.initial_decision,
        "human_ruling": inc.human_ruling,
        "disciplinary_action": inc.disciplinary_action,
        "restart_play": inc.restart_play,
        "rationale": inc.rationale,
        "reviewed_by": inc.reviewed_by,
        "reviewed_at": inc.reviewed_at.isoformat() if inc.reviewed_at else None,
        "is_synthetic": inc.is_synthetic,
        "uncertainty_margin": inc.uncertainty_margin,
        "evidence_items": [
            {
                "id": ev.id,
                "camera_id": ev.camera_id,
                "camera_name": ev.camera_name,
                "camera_name_ar": ev.camera_name_ar,
                "is_recommended": ev.is_recommended,
                "clarity_score": ev.clarity_score,
                "collinearity_score": ev.collinearity_score,
                "distance_to_play": ev.distance_to_play,
                "occlusion_level": ev.occlusion_level,
                "camera_type": ev.camera_type,
                "description": ev.description
            }
            for ev in evidence
        ],
        "audit_history": [
            {
                "id": a.id,
                "action_type": a.action_type,
                "previous_status": a.previous_status,
                "new_status": a.new_status,
                "actor_name": a.actor_name,
                "details": a.details,
                "timestamp": a.timestamp.isoformat() if a.timestamp else None
            }
            for a in audits
        ]
    }


@router.post("/incidents/{incident_id}/review")
def record_incident_review(
    incident_id: str,
    payload: ReviewDecisionPayload,
    db: Session = Depends(get_db)
):
    inc = db.query(Incident).filter_by(id=incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    prev_status = inc.review_status
    new_status = "DECISION_RECORDED"

    inc.review_status = new_status
    inc.human_ruling = payload.official_ruling
    inc.human_ruling_ar = payload.official_ruling_ar or payload.official_ruling
    inc.disciplinary_action = payload.disciplinary_action
    inc.restart_play = payload.restart_play
    inc.rationale = payload.rationale
    inc.rationale_ar = payload.rationale_ar or payload.rationale
    inc.reviewed_by = payload.recorded_by or "Human Match Official"
    inc.reviewed_at = datetime.utcnow()

    # Record Audit Event
    audit = AuditEvent(
        id=f"AUD_{datetime.utcnow().timestamp()}",
        incident_id=incident_id,
        action_type="HUMAN_DECISION_RECORDED",
        previous_status=prev_status,
        new_status=new_status,
        actor_name=inc.reviewed_by,
        details=f"Decision recorded: {payload.official_ruling}. Restart: {payload.restart_play}."
    )
    db.add(audit)
    db.commit()

    return {
        "status": "SUCCESS",
        "incident_id": incident_id,
        "review_status": new_status,
        "recorded_decision": {
            "ruling": inc.human_ruling,
            "disciplinary": inc.disciplinary_action,
            "restart": inc.restart_play,
            "rationale": inc.rationale,
            "reviewed_by": inc.reviewed_by,
            "reviewed_at": inc.reviewed_at.isoformat()
        }
    }


@router.get("/incidents/{incident_id}/history")
def get_incident_history(incident_id: str, db: Session = Depends(get_db)):
    audits = db.query(AuditEvent).filter_by(incident_id=incident_id).order_by(AuditEvent.timestamp.desc()).all()
    return [
        {
            "id": a.id,
            "action_type": a.action_type,
            "previous_status": a.previous_status,
            "new_status": a.new_status,
            "actor_name": a.actor_name,
            "details": a.details,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        }
        for a in audits
    ]


# -------------------------------------------------------------
# Knowledge & Rules Retrieval
# -------------------------------------------------------------
@router.get("/knowledge/search")
def search_rules_endpoint(q: str = Query("", description="Rule search query")):
    return search_rules(q)


@router.get("/knowledge/documents")
def get_knowledge_documents_endpoint(db: Session = Depends(get_db)):
    return get_knowledge_documents(db)


@router.get("/knowledge/documents/{document_id}")
def get_knowledge_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(KnowledgeDocument).filter_by(id=document_id).first()
    if not doc:
        rule = get_rule_by_id(document_id, db)
        if rule:
            return rule
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "document_type": doc.document_type,
        "title": doc.title,
        "title_ar": doc.title_ar,
        "edition": doc.edition,
        "source_url": doc.source_url,
        "section": doc.section,
        "content_en": doc.content_en,
        "content_ar": doc.content_ar
    }


# -------------------------------------------------------------
# Analytics Overview & Detail
# -------------------------------------------------------------
@router.get("/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_matches = db.query(Match).count()
    total_events = db.query(MatchEvent).count()
    total_shots = db.query(MatchEvent).filter(MatchEvent.event_type.ilike("%shot%")).count()
    total_fouls = db.query(MatchEvent).filter(MatchEvent.event_type.ilike("%foul%")).count()

    return {
        "summary": "RefVision Football Intelligence Platform Analytics Overview",
        "dataset_scope": "StatsBomb Open Data (2022 World Cup) & RefVision Synthetic Premier League Simulator",
        "total_matches_stored": total_matches,
        "total_events_stored": total_events,
        "total_shots_indexed": total_shots,
        "total_fouls_indexed": total_fouls,
        "metrics_supported": [
            "Rolling 5-minute possession percentage (pass distribution)",
            "Pass completion rate and progressive pass maps",
            "Expected Goals (xG) coordinate gradient model",
            "Fouls, bookings, and disciplinary frequency",
            "Tactical momentum curve (-100 to +100 bounds)"
        ]
    }


@router.get("/analytics/matches/{match_id}")
def get_match_analytics(match_id: str, db: Session = Depends(get_db)):
    return compute_match_analytics_from_db(match_id, db)


# -------------------------------------------------------------
# Machine Learning Model Transparency & Prediction
# -------------------------------------------------------------
class ShotPredictionPayload(BaseModel):
    x: float = Field(..., ge=0.0, le=120.0, description="Shot X coordinate on pitch (0-120m)")
    y: float = Field(..., ge=0.0, le=80.0, description="Shot Y coordinate on pitch (0-80m)")
    technique: str = Field("Normal", description="Technique: Normal, Volley, Half Volley, Lob, Header")
    body_part: str = Field("Right Foot", description="Body part: Right Foot, Left Foot, Head, Other")
    play_pattern: str = Field("Regular Play", description="Play pattern: Regular Play, From Corner, From Free Kick, Fast Break")
    under_pressure: bool = Field(False, description="Whether shooter is under active defensive pressure")


@router.get("/models")
def get_models(db: Session = Depends(get_db)):
    models = db.query(ModelVersion).all()
    return [
        {
            "id": m.id,
            "model_name": m.model_name,
            "task_type": m.task_type,
            "algorithm": m.algorithm,
            "version": m.version,
            "dataset_name": m.dataset_name,
            "train_samples": m.train_samples,
            "val_samples": m.val_samples,
            "test_samples": m.test_samples,
            "evaluation_metrics": m.metrics_json,
            "baseline_comparison": m.baseline_metrics_json,
            "is_active": m.is_active,
            "trained_at": m.trained_at.isoformat() if m.trained_at else None,
            "limitations": m.limitations_notes
        }
        for m in models
    ]


@router.get("/models/{model_id}")
def get_model_detail(model_id: str, db: Session = Depends(get_db)):
    m = db.query(ModelVersion).filter_by(id=model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return {
        "id": m.id,
        "model_name": m.model_name,
        "task_type": m.task_type,
        "algorithm": m.algorithm,
        "version": m.version,
        "dataset_name": m.dataset_name,
        "train_samples": m.train_samples,
        "val_samples": m.val_samples,
        "test_samples": m.test_samples,
        "evaluation_metrics": m.metrics_json,
        "baseline_comparison": m.baseline_metrics_json,
        "hyperparameters": m.hyperparameters_json,
        "is_active": m.is_active,
        "trained_at": m.trained_at.isoformat() if m.trained_at else None,
        "limitations": m.limitations_notes
    }


@router.get("/models/{model_id}/metrics")
def get_model_metrics(model_id: str, db: Session = Depends(get_db)):
    m = db.query(ModelVersion).filter_by(id=model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return {
        "model_id": m.id,
        "algorithm": m.algorithm,
        "evaluation_metrics": m.metrics_json,
        "baseline_comparison": m.baseline_metrics_json
    }


@router.post("/models/{model_id}/predict")
def predict_model(model_id: str, payload: ShotPredictionPayload):
    return predict_shot_xg(
        x=payload.x,
        y=payload.y,
        technique=payload.technique,
        body_part=payload.body_part,
        play_pattern=payload.play_pattern,
        under_pressure=payload.under_pressure
    )


# -------------------------------------------------------------
# Fan Arena Games & Scoring
# -------------------------------------------------------------
class FanPredictionPayload(BaseModel):
    selected_option_id: str
    user_id: Optional[str] = "USR_DEMO_01"


@router.get("/fan-games")
def get_fan_games_endpoint(db: Session = Depends(get_db)):
    return get_all_fan_games(db)


@router.get("/fan-games/{game_id}")
def get_fan_game(game_id: str, db: Session = Depends(get_db)):
    g = db.query(FanGame).filter_by(id=game_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    return {
        "game_id": g.id,
        "game_type": g.game_type,
        "match_id": g.match_id,
        "title_en": g.title_en,
        "title_ar": g.title_ar,
        "description_en": g.description_en,
        "description_ar": g.description_ar,
        "options": g.options_json,
        "points_reward": g.points_reward,
        "status": g.status,
        "is_resolved": g.is_resolved,
        "correct_option_id": g.correct_option_id if g.is_resolved else None
    }


@router.post("/fan-games/{game_id}/predictions")
def submit_game_prediction(
    game_id: str,
    payload: FanPredictionPayload,
    db: Session = Depends(get_db)
):
    try:
        return submit_fan_prediction(
            game_id=game_id,
            selected_option_id=payload.selected_option_id,
            user_id=payload.user_id or "USR_DEMO_01",
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/fan-games/{game_id}/leaderboard")
def get_fan_game_leaderboard(game_id: str, db: Session = Depends(get_db)):
    return get_leaderboard_from_db(db)


@router.get("/fan-games/{game_id}/results")
def get_fan_game_results(game_id: str, db: Session = Depends(get_db)):
    g = db.query(FanGame).filter_by(id=game_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Game not found")
    return {
        "game_id": g.id,
        "is_resolved": g.is_resolved,
        "correct_option_id": g.correct_option_id,
        "status": g.status
    }


# -------------------------------------------------------------
# Audit Log
# -------------------------------------------------------------
@router.get("/audit-log")
def get_audit_log(limit: int = 50, db: Session = Depends(get_db)):
    audits = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": a.id,
            "incident_id": a.incident_id,
            "action_type": a.action_type,
            "previous_status": a.previous_status,
            "new_status": a.new_status,
            "actor_name": a.actor_name,
            "details": a.details,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None
        }
        for a in audits
    ]
