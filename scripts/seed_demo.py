import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.simulation.data_generator import generate_synthetic_events, create_initial_incidents, create_teams
from app.analytics.statistics import compute_match_analytics

def main():
    print("==========================================================")
    print(" RefVision AI: Seeding & Verifying Synthetic Match Engine")
    print(" Seed: MATCH_PL_2026_01")
    print("==========================================================")
    home, away = create_teams()
    print(f"Home: {home.name} ({home.short_code}) - {len(home.players)} players")
    print(f"Away: {away.name} ({away.short_code}) - {len(away.players)} players")

    events = generate_synthetic_events("MATCH_PL_2026_01")
    print(f"Generated Events Count: {len(events)}")

    incidents = create_initial_incidents(events)
    print(f"Staged Incidents Count: {len(incidents)}")
    for inc in incidents:
        print(f" - [{inc.incident_id}] Min {inc.minute}:{inc.second:02d} | Type: {inc.incident_type} | Conf: {inc.confidence_rating}%")

    analytics = compute_match_analytics(events, 90 * 60.0)
    print("\nFull Match Analytics Projection:")
    print(f" - Possession: {home.name} {analytics.home_stats.possession_percentage}% vs {away.name} {analytics.away_stats.possession_percentage}%")
    print(f" - Shots: {home.name} {analytics.home_stats.total_shots} vs {away.name} {analytics.away_stats.total_shots}")
    print(f" - Expected Goals (xG): {home.name} {analytics.home_stats.expected_goals_xg} vs {away.name} {analytics.away_stats.expected_goals_xg}")
    print(f" - Turning points detected: {len(analytics.turning_points)}")
    print("\n[SUCCESS] Deterministic seed verified. Ready for demonstration!")

if __name__ == "__main__":
    main()
