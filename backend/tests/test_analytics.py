import pytest
from app.simulation.match_engine import MatchEngine
from app.analytics.statistics import compute_match_analytics
from app.analytics.momentum import calculate_tactical_momentum

def test_possession_and_stats():
    engine = MatchEngine(seed="MATCH_PL_2026_01")
    engine.seek_to_minute(70)
    analytics = compute_match_analytics(engine.all_events, engine.match.current_timestamp_seconds)

    assert analytics.home_stats.possession_percentage + analytics.away_stats.possession_percentage == 100.0
    assert analytics.home_stats.total_shots >= 1
    assert analytics.away_stats.total_shots >= 1
    assert len(analytics.turning_points) >= 2

def test_tactical_momentum_bounds():
    engine = MatchEngine(seed="MATCH_PL_2026_01")
    engine.seek_to_minute(80)
    momentum_series = calculate_tactical_momentum(engine.get_visible_events(), engine.match.current_timestamp_seconds)

    assert len(momentum_series) > 0
    for pt in momentum_series:
        assert 0.0 <= pt.home_momentum <= 100.0
        assert 0.0 <= pt.away_momentum <= 100.0
        assert pt.dominant_team_id in ["APX", "CRN"]
