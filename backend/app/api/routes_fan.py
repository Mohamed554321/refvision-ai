from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/fan", tags=["fan"])

class PredictionSubmitRequest(BaseModel):
    game_id: str
    selected_option_id: str

def get_routes(engine, prediction_engine):
    @router.get("/games")
    def get_prediction_games():
        prediction_engine.resolve_games_against_events(engine.get_visible_events(), engine.match.current_timestamp_seconds)
        return list(prediction_engine.games.values())

    @router.post("/predict")
    def submit_prediction(req: PredictionSubmitRequest):
        try:
            sub = prediction_engine.submit_prediction(
                game_id=req.game_id,
                selected_option_id=req.selected_option_id,
                current_seconds=engine.match.current_timestamp_seconds
            )
            return {"status": "SUCCESS", "submission": sub, "profile": prediction_engine.user_profile}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.get("/profile")
    def get_profile():
        prediction_engine.resolve_games_against_events(engine.get_visible_events(), engine.match.current_timestamp_seconds)
        return prediction_engine.user_profile

    @router.get("/leaderboard")
    def get_leaderboard():
        prediction_engine.resolve_games_against_events(engine.get_visible_events(), engine.match.current_timestamp_seconds)
        return prediction_engine.get_leaderboard()

    return router
