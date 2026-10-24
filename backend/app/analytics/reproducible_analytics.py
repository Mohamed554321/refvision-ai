from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import Match, MatchEvent, Team


def compute_match_analytics_from_db(match_id: str, db: Optional[Session] = None) -> Dict[str, Any]:
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        match = db.query(Match).filter_by(id=match_id).first()
        if not match:
            return {"error": f"Match {match_id} not found"}

        events = db.query(MatchEvent).filter_by(match_id=match_id).all()
        home_team_id = match.home_team_id
        away_team_id = match.away_team_id

        home_stats = {
            "team_id": home_team_id,
            "team_name": match.home_team.name if match.home_team else "Home",
            "goals": match.home_score,
            "shots": 0,
            "shots_on_target": 0,
            "passes_total": 0,
            "passes_completed": 0,
            "pass_accuracy_percentage": 0.0,
            "fouls_committed": 0,
            "yellow_cards": 0,
            "red_cards": 0,
            "xg_total": 0.0
        }

        away_stats = {
            "team_id": away_team_id,
            "team_name": match.away_team.name if match.away_team else "Away",
            "goals": match.away_score,
            "shots": 0,
            "shots_on_target": 0,
            "passes_total": 0,
            "passes_completed": 0,
            "pass_accuracy_percentage": 0.0,
            "fouls_committed": 0,
            "yellow_cards": 0,
            "red_cards": 0,
            "xg_total": 0.0
        }

        shot_map = []
        timeline = []

        for ev in events:
            is_home = (ev.team_id == home_team_id)
            stats = home_stats if is_home else away_stats

            ev_type_lower = ev.event_type.lower()
            if "shot" in ev_type_lower:
                stats["shots"] += 1
                outcome = ev.outcome or ""
                if outcome.lower() in ["goal", "saved", "post", "saved to post"]:
                    stats["shots_on_target"] += 1

                xg_val = 0.0
                if ev.metadata_json and "statsbomb_xg" in ev.metadata_json and ev.metadata_json["statsbomb_xg"]:
                    xg_val = float(ev.metadata_json["statsbomb_xg"])
                    stats["xg_total"] += xg_val

                if ev.x is not None and ev.y is not None:
                    shot_map.append({
                        "event_id": ev.id,
                        "minute": ev.minute,
                        "second": ev.second,
                        "team_id": ev.team_id,
                        "player_name": ev.player_name,
                        "x": ev.x,
                        "y": ev.y,
                        "end_x": ev.end_x,
                        "end_y": ev.end_y,
                        "outcome": ev.outcome or "Shot",
                        "xg": round(xg_val, 3) if xg_val > 0 else 0.12
                    })

            elif "pass" in ev_type_lower:
                stats["passes_total"] += 1
                if not ev.outcome or ev.outcome.lower() not in ["incomplete", "out", "pass offside"]:
                    stats["passes_completed"] += 1

            elif "foul" in ev_type_lower:
                stats["fouls_committed"] += 1

            elif "card" in ev_type_lower or "yellow" in ev_type_lower:
                stats["yellow_cards"] += 1

            if ev_type_lower in ["goal", "card", "penalty", "var", "foul", "yellow_card"]:
                timeline.append({
                    "minute": ev.minute,
                    "event_type": ev.event_type,
                    "player_name": ev.player_name,
                    "team_id": ev.team_id,
                    "description": ev.description or f"{ev.event_type} at {ev.minute}'"
                })

        # Calculate pass accuracy
        if home_stats["passes_total"] > 0:
            home_stats["pass_accuracy_percentage"] = round(
                (home_stats["passes_completed"] / home_stats["passes_total"]) * 100.0, 1
            )
        if away_stats["passes_total"] > 0:
            away_stats["pass_accuracy_percentage"] = round(
                (away_stats["passes_completed"] / away_stats["passes_total"]) * 100.0, 1
            )

        home_stats["xg_total"] = round(home_stats["xg_total"], 2)
        away_stats["xg_total"] = round(away_stats["xg_total"], 2)

        # Possession estimation based on pass share
        total_passes = home_stats["passes_total"] + away_stats["passes_total"]
        if total_passes > 0:
            home_possession = round((home_stats["passes_total"] / total_passes) * 100.0, 1)
            away_possession = round(100.0 - home_possession, 1)
        else:
            home_possession = 50.0
            away_possession = 50.0

        home_stats["possession_percentage"] = home_possession
        away_stats["possession_percentage"] = away_possession

        return {
            "match_id": match_id,
            "status": match.status,
            "home_stats": home_stats,
            "away_stats": away_stats,
            "total_events_analyzed": len(events),
            "shot_map": shot_map,
            "timeline": sorted(timeline, key=lambda x: x["minute"]),
            "is_synthetic": match.is_synthetic,
            "provenance": match.provenance_source
        }
    finally:
        if close_db:
            db.close()
