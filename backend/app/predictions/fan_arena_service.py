from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import FanGame, FanPrediction, UserProfile


def get_all_fan_games(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        games = db.query(FanGame).all()
        return [
            {
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
                "correct_option_id": g.correct_option_id if g.is_resolved else None,
                "deadline_minute": g.deadline_minute
            }
            for g in games
        ]
    finally:
        if close_db:
            db.close()


def submit_fan_prediction(
    game_id: str,
    selected_option_id: str,
    user_id: str = "USR_DEMO_01",
    db: Optional[Session] = None
) -> Dict[str, Any]:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        game = db.query(FanGame).filter_by(id=game_id).first()
        if not game:
            raise ValueError(f"Game {game_id} does not exist.")

        if game.status == "LOCKED":
            raise ValueError("Prediction window is locked for this challenge.")

        user = db.query(UserProfile).filter_by(id=user_id).first()
        if not user:
            user = UserProfile(id=user_id, username="Alex_PremierFan", points=140, streak_count=2)
            db.add(user)
            db.commit()

        # Check existing submission
        pred = db.query(FanPrediction).filter_by(game_id=game_id, user_id=user_id).first()
        if not pred:
            pred = FanPrediction(
                id=f"PRED_{game_id}_{user_id}",
                game_id=game_id,
                user_id=user_id,
                selected_option_id=selected_option_id,
                status="OPEN"
            )
            db.add(pred)
        else:
            pred.selected_option_id = selected_option_id

        # Server-side evaluation for instant quiz games (e.g. SPOT_THE_RULE, TOUCHLINE_TACTICIAN)
        is_won = False
        points_earned = 0
        if game.game_type in ["SPOT_THE_RULE", "TOUCHLINE_TACTICIAN"]:
            is_won = (selected_option_id == game.correct_option_id)
            pred.status = "RESOLVED_WON" if is_won else "RESOLVED_LOST"
            if is_won:
                points_earned = game.points_reward
                pred.points_awarded = points_earned
                user.points += points_earned
                user.streak_count += 1
                user.predictions_count += 1
            else:
                user.streak_count = 0
                user.predictions_count += 1

        db.commit()

        return {
            "prediction_id": pred.id,
            "game_id": game_id,
            "user_id": user_id,
            "selected_option_id": selected_option_id,
            "status": pred.status,
            "points_earned": points_earned,
            "user_current_points": user.points,
            "current_streak": user.streak_count,
            "server_evaluation": "RESOLVED_INSTANT" if game.game_type in ["SPOT_THE_RULE", "TOUCHLINE_TACTICIAN"] else "REGISTERED_PENDING_MATCH_EVENT"
        }
    finally:
        if close_db:
            db.close()


def get_leaderboard_from_db(db: Optional[Session] = None) -> List[Dict[str, Any]]:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        users = db.query(UserProfile).order_by(UserProfile.points.desc()).all()
        # Seeded demo leaderboard entries with clear provenance labels
        base_leaderboard = [
            {"rank": 1, "username": "Tariq_Tactics", "points": 420, "streak": 5, "is_user": False},
            {"rank": 2, "username": "Nadia_VAR_Pro", "points": 380, "streak": 4, "is_user": False},
            {"rank": 3, "username": "Alex_PremierFan", "points": users[0].points if users else 140, "streak": users[0].streak_count if users else 2, "is_user": True},
            {"rank": 4, "username": "Liam_Anchor9", "points": 120, "streak": 1, "is_user": False},
            {"rank": 5, "username": "Youssef_PitchView", "points": 95, "streak": 0, "is_user": False}
        ]
        base_leaderboard.sort(key=lambda x: x["points"], reverse=True)
        for i, entry in enumerate(base_leaderboard):
            entry["rank"] = i + 1
        return base_leaderboard
    finally:
        if close_db:
            db.close()
