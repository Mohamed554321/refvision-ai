from typing import List, Dict, Optional, Any
import copy
from app.schemas.events import Match, MatchStatus, MatchEvent, EventType
from app.schemas.incidents import Incident, IncidentReviewStatus, RecordedDecision, StructuredExplanation, AuditEvent
from app.simulation.data_generator import create_teams, generate_synthetic_events, create_initial_incidents

class MatchEngine:
    def __init__(self, seed: str = "MATCH_PL_2026_01"):
        self.seed = seed
        self.home_team, self.away_team = create_teams()
        self.all_events = generate_synthetic_events(seed)
        self.raw_incidents = create_initial_incidents(self.all_events)
        self.incidents: Dict[str, Incident] = {inc.incident_id: copy.deepcopy(inc) for inc in self.raw_incidents}
        self.audit_log: List[AuditEvent] = []

        self.match = Match(
            match_id=seed,
            home_team=self.home_team,
            away_team=self.away_team,
            home_score=0,
            away_score=0,
            current_minute=0,
            current_second=0,
            current_timestamp_seconds=0.0,
            status=MatchStatus.SCHEDULED,
            simulation_seed=seed
        )

        # Log system initialization
        self.record_audit_event(
            incident_id="SYSTEM",
            action="INITIALIZE_MATCH_ENGINE",
            actor_type="SYSTEM",
            description=f"Match engine initialized with seed {seed}. {len(self.all_events)} events staged."
        )

    def record_audit_event(self, incident_id: str, action: str, actor_type: str, description: str, payload: Optional[Dict[str, Any]] = None):
        event = AuditEvent(
            audit_id=f"AUD_{len(self.audit_log) + 1:05d}",
            incident_id=incident_id,
            timestamp_seconds=self.match.current_timestamp_seconds,
            action=action,
            actor_type=actor_type,
            description=description,
            payload_snapshot=payload or {}
        )
        self.audit_log.append(event)
        return event

    def start_match(self):
        self.match.status = MatchStatus.LIVE
        self.record_audit_event("SYSTEM", "START_SIMULATION", "USER", "Live simulation commenced.")

    def pause_match(self):
        self.match.status = MatchStatus.PAUSED

    def reset_match(self):
        self.__init__(seed=self.seed)

    def seek_to_minute(self, minute: int, second: int = 0):
        target_seconds = float(minute * 60 + second)
        max_seconds = float(self.all_events[-1].timestamp_seconds) if self.all_events else 90 * 60.0
        target_seconds = max(0.0, min(target_seconds, max_seconds))

        self.match.current_timestamp_seconds = target_seconds
        self.match.current_minute = int(target_seconds // 60)
        self.match.current_second = int(target_seconds % 60)

        if self.match.current_minute >= 90:
            self.match.status = MatchStatus.FULL_TIME
        elif self.match.status == MatchStatus.SCHEDULED:
            self.match.status = MatchStatus.LIVE

        self._recalculate_live_state()

    def advance_seconds(self, delta_seconds: float = 15.0):
        self.seek_to_minute(
            minute=int((self.match.current_timestamp_seconds + delta_seconds) // 60),
            second=int((self.match.current_timestamp_seconds + delta_seconds) % 60)
        )

    def _recalculate_live_state(self):
        """Recalculates score, player stats, and active incidents based on current timestamp."""
        home_goals = 0
        away_goals = 0

        # Reset player counters
        for p in self.home_team.players + self.away_team.players:
            p.touches = 0
            p.shots = 0
            p.shots_on_target = 0
            p.passes_attempted = 0
            p.passes_completed = 0
            p.fouls_committed = 0
            p.yellow_cards = 0
            p.red_cards = 0

        active_events = [e for e in self.all_events if e.timestamp_seconds <= self.match.current_timestamp_seconds]

        # Player dictionary lookup
        player_map = {p.player_id: p for p in self.home_team.players + self.away_team.players}

        for ev in active_events:
            p = player_map.get(ev.player_id) if ev.player_id else None
            if ev.event_type == EventType.GOAL:
                if ev.team_id == self.home_team.team_id:
                    home_goals += 1
                else:
                    away_goals += 1
            if p:
                p.touches += 1
                if ev.event_type == EventType.PASS:
                    p.passes_attempted += 1
                    p.passes_completed += 1
                elif ev.event_type in [EventType.SHOT, EventType.GOAL]:
                    p.shots += 1
                    p.shots_on_target += 1
                elif ev.event_type == EventType.FOUL:
                    p.fouls_committed += 1
                elif ev.event_type == EventType.YELLOW_CARD:
                    p.yellow_cards += 1
                elif ev.event_type == EventType.RED_CARD:
                    p.red_cards += 1

        self.match.home_score = home_goals
        self.match.away_score = away_goals

    def get_visible_events(self) -> List[MatchEvent]:
        return [e for e in self.all_events if e.timestamp_seconds <= self.match.current_timestamp_seconds]

    def get_visible_incidents(self) -> List[Incident]:
        return [
            inc for inc in self.incidents.values()
            if inc.timestamp_seconds <= self.match.current_timestamp_seconds + 30.0
        ]

    def record_referee_decision(
        self,
        incident_id: str,
        official_ruling: str,
        official_ruling_ar: str,
        disciplinary_action: str,
        restart_play: str,
        rationale: str,
        rationale_ar: str,
        recorded_by: str = "Marcus Sterling"
    ) -> Incident:
        if incident_id not in self.incidents:
            raise ValueError(f"Incident {incident_id} not found.")

        incident = self.incidents[incident_id]
        decision = RecordedDecision(
            decision_id=f"DEC_{incident_id}",
            incident_id=incident_id,
            recorded_by=recorded_by,
            role="On-Field Referee",
            timestamp_recorded_seconds=self.match.current_timestamp_seconds,
            official_ruling=official_ruling,
            official_ruling_ar=official_ruling_ar,
            disciplinary_action=disciplinary_action,
            restart_play=restart_play,
            rationale=rationale,
            rationale_ar=rationale_ar
        )
        incident.recorded_decision = decision
        incident.review_status = IncidentReviewStatus.DECISION_RECORDED

        self.record_audit_event(
            incident_id=incident_id,
            action="RECORD_HUMAN_DECISION",
            actor_type="HUMAN_REFEREE",
            description=f"Referee {recorded_by} recorded ruling: {official_ruling} ({restart_play}, {disciplinary_action}).",
            payload={
                "ruling": official_ruling,
                "restart_play": restart_play,
                "disciplinary": disciplinary_action,
                "rationale": rationale
            }
        )

        return incident

    def attach_explanation(self, incident_id: str, explanation: StructuredExplanation):
        if incident_id in self.incidents:
            self.incidents[incident_id].structured_explanation = explanation
            self.incidents[incident_id].review_status = IncidentReviewStatus.EXPLANATION_PUBLISHED
            self.record_audit_event(
                incident_id=incident_id,
                action="PUBLISH_EXPLANATION",
                actor_type="EXPLANATION_AGENT",
                description=f"Public decision explainer published for {incident_id}."
            )
