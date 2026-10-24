import pytest
from app.predictions.game_engine import PredictionEngine
from app.simulation.match_engine import MatchEngine
from app.schemas.predictions import PredictionStatus

def test_prediction_lifecycle_and_deadline():
    pe = PredictionEngine()
    game_id = "GAME_01_NEXT_TOUCH"

    # Valid submission before lock deadline (14:30)
    sub = pe.submit_prediction(game_id, "OPT_APX_04", current_seconds=14 * 60 + 30)
    assert sub.status == PredictionStatus.OPEN
    assert sub.selected_option_id == "OPT_APX_04"

    # Submission after lock deadline (16:00) must raise ValueError
    with pytest.raises(ValueError, match="Prediction window is closed"):
        pe.submit_prediction(game_id, "OPT_APX_10", current_seconds=16 * 60)

def test_prediction_resolution_and_scoring():
    engine = MatchEngine(seed="MATCH_PL_2026_01")
    pe = PredictionEngine()

    # User predicts Kieran Vance for Game 1 at minute 14
    pe.submit_prediction("GAME_01_NEXT_TOUCH", "OPT_APX_04", current_seconds=14 * 60.0)

    # Advance match to minute 18
    engine.seek_to_minute(18)
    pe.resolve_games_against_events(engine.get_visible_events(), engine.match.current_timestamp_seconds)

    game = pe.games["GAME_01_NEXT_TOUCH"]
    assert game.is_resolved is True
    assert game.correct_option_id == "OPT_APX_04"

    user_sub = pe.submissions[f"SUB_GAME_01_NEXT_TOUCH_{pe.user_profile.user_id}"]
    assert user_sub.status == PredictionStatus.RESOLVED_WON
    assert user_sub.points_awarded > 0
    assert pe.user_profile.points > 140
