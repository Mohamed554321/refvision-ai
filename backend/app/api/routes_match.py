from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/match", tags=["match"])

class SeekRequest(BaseModel):
    minute: int
    second: int = 0

class AdvanceRequest(BaseModel):
    seconds: float = 15.0

# Dependencies will be injected or imported from global match engine instance
def get_routes(engine, prediction_engine):
    @router.get("")
    def get_match_state():
        return {
            "match": engine.match,
            "visible_events_count": len(engine.get_visible_events()),
            "total_events_count": len(engine.all_events)
        }

    @router.post("/start")
    def start_match():
        engine.start_match()
        return {"status": "LIVE", "current_minute": engine.match.current_minute}

    @router.post("/pause")
    def pause_match():
        engine.pause_match()
        return {"status": "PAUSED", "current_minute": engine.match.current_minute}

    @router.post("/reset")
    def reset_match():
        engine.reset_match()
        return {"status": "SCHEDULED", "current_minute": 0}

    @router.post("/seek")
    def seek_minute(req: SeekRequest):
        engine.seek_to_minute(req.minute, req.second)
        prediction_engine.resolve_games_against_events(engine.get_visible_events(), engine.match.current_timestamp_seconds)
        return {
            "current_minute": engine.match.current_minute,
            "current_second": engine.match.current_second,
            "current_seconds": engine.match.current_timestamp_seconds,
            "status": engine.match.status
        }

    @router.post("/advance")
    def advance_time(req: AdvanceRequest):
        engine.advance_seconds(req.seconds)
        prediction_engine.resolve_games_against_events(engine.get_visible_events(), engine.match.current_timestamp_seconds)
        return {
            "current_minute": engine.match.current_minute,
            "current_second": engine.match.current_second,
            "current_seconds": engine.match.current_timestamp_seconds,
            "status": engine.match.status
        }

    @router.get("/events")
    def get_events():
        return engine.get_visible_events()

    @router.get("/analytics")
    def get_analytics():
        from app.analytics.statistics import compute_match_analytics
        return compute_match_analytics(engine.all_events, engine.match.current_timestamp_seconds)

    return router
