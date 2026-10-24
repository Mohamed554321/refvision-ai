import pytest
from app.simulation.match_engine import MatchEngine
from app.simulation.data_generator import generate_synthetic_events, create_teams
from app.schemas.events import EventType, MatchStatus

def test_deterministic_seed_reproducibility():
    events_1 = generate_synthetic_events("MATCH_PL_2026_01")
    events_2 = generate_synthetic_events("MATCH_PL_2026_01")
    assert len(events_1) == len(events_2)
    for e1, e2 in zip(events_1, events_2):
        assert e1.event_id == e2.event_id
        assert e1.timestamp_seconds == e2.timestamp_seconds
        assert e1.event_type == e2.event_type

def test_chronological_ordering():
    events = generate_synthetic_events("MATCH_PL_2026_01")
    assert len(events) >= 50
    for i in range(len(events) - 1):
        assert events[i].timestamp_seconds <= events[i + 1].timestamp_seconds

def test_match_engine_state_recalculation():
    engine = MatchEngine(seed="MATCH_PL_2026_01")
    assert engine.match.current_minute == 0
    assert engine.match.home_score == 0
    assert engine.match.away_score == 0

    # Advance to minute 30 (after Apex goal at 28:14)
    engine.seek_to_minute(30)
    assert engine.match.current_minute == 30
    assert engine.match.home_score == 1
    assert engine.match.away_score == 0

    # Advance to minute 60 (after Crown goal at 56:42)
    engine.seek_to_minute(60)
    assert engine.match.current_minute == 60
    assert engine.match.home_score == 1
    assert engine.match.away_score == 1
