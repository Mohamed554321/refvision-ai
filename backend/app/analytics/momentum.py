from typing import List
from app.schemas.events import MatchEvent, EventType
from app.schemas.analytics import MomentumDataPoint

def calculate_tactical_momentum(events: List[MatchEvent], current_seconds: float) -> List[MomentumDataPoint]:
    """
    Computes deterministic tactical momentum (-100 to +100) across 5-minute rolling slices.
    Positive values indicates Apex Vanguard (Home) momentum.
    Negative values indicate Crown Meridian (Away) momentum.

    Formula weights:
    - Shots: +/- 25
    - Goals: +/- 45
    - Corner / Box Entry: +/- 15
    - Completed Pass in attacking third: +/- 4
    - Fouls committed: -/+ 8
    Decays smoothly by 0.85 per minute outside active phase.
    """
    points: List[MomentumDataPoint] = []
    max_minute = int(current_seconds // 60)

    rolling_score = 0.0

    for m in range(0, max_minute + 1):
        # Window of events for minute m
        minute_events = [e for e in events if e.minute == m]
        delta = 0.0
        trigger = None

        for e in minute_events:
            factor = 1.0 if e.team_id == "APX" else -1.0
            if e.event_type == EventType.GOAL:
                delta += 45.0 * factor
                trigger = f"Goal ({e.team_id})"
            elif e.event_type == EventType.SHOT:
                delta += 22.0 * factor
                trigger = f"Shot ({e.team_id})"
            elif e.event_type == EventType.CORNER:
                delta += 14.0 * factor
            elif e.event_type == EventType.FOUL:
                delta -= 8.0 * factor  # committing foul hurts momentum
            elif e.event_type == EventType.TACKLE and e.event_attributes.get("success"):
                delta += 10.0 * factor
            elif e.event_type == EventType.PASS:
                delta += 2.5 * factor

        # Decay previous momentum + add delta
        rolling_score = (rolling_score * 0.75) + delta
        # Bound between -100 and +100
        bounded_score = max(-95.0, min(95.0, rolling_score))

        home_val = round(max(0.0, bounded_score), 1)
        away_val = round(max(0.0, -bounded_score), 1)
        dominant = "APX" if bounded_score >= 0 else "CRN"

        points.append(MomentumDataPoint(
            minute=m,
            second=0,
            timestamp_seconds=float(m * 60),
            home_momentum=home_val,
            away_momentum=away_val,
            trigger_event=trigger,
            dominant_team_id=dominant
        ))

    return points
