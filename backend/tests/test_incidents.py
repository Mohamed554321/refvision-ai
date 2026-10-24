import pytest
from app.simulation.match_engine import MatchEngine
from app.incidents.engine import IncidentEngine
from app.schemas.incidents import IncidentReviewStatus

def test_incident_detection_and_ranking():
    engine = MatchEngine(seed="MATCH_PL_2026_01")
    incident = engine.incidents.get("INC_68_PEN_CHECK")
    assert incident is not None
    assert incident.minute == 67

    # Camera ranking
    ranked = IncidentEngine.rank_camera_angles(incident.evidence_items, incident.coordinates["x"], incident.coordinates["y"])
    assert len(ranked) >= 2
    assert ranked[0].is_recommended is True
    assert "18-Yard" in ranked[0].camera_name

def test_human_decision_recording():
    engine = MatchEngine(seed="MATCH_PL_2026_01")
    engine.seek_to_minute(68)
    updated = engine.record_referee_decision(
        incident_id="INC_68_PEN_CHECK",
        official_ruling="Direct Free Kick Awarded Outside Box",
        official_ruling_ar="ركلة حرة مباشرة خارج المنطقة",
        disciplinary_action="Yellow Card #5 Devon Cole",
        restart_play="Direct Free Kick",
        rationale="Clear trip initiated 10cm prior to penalty box line.",
        rationale_ar="عرقلة واضحة بدأت قبل خط منطقة الجزاء بـ 10 سم.",
        recorded_by="Marcus Sterling"
    )

    assert updated.review_status == IncidentReviewStatus.DECISION_RECORDED
    assert updated.recorded_decision is not None
    assert updated.recorded_decision.recorded_by == "Marcus Sterling"
    assert updated.recorded_decision.restart_play == "Direct Free Kick"
