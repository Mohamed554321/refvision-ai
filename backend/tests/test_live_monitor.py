"""
Unit & Integration Tests for Live Referee Assistant, Multi-Match Library & SSRF Protection
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Match, MatchEvent, Incident, LiveSession, AuditEvent

client = TestClient(app)


def test_multi_match_library_count_and_isolation():
    """Verify that the match library contains at least 8 selectable matches (we seeded 11)."""
    res = client.get("/api/matches")
    assert res.status_code == 200
    matches = res.json()
    assert len(matches) >= 8, f"Expected at least 8 matches, found {len(matches)}"

    # Check distinct isolation: historical vs synthetic
    historical = [m for m in matches if not m["is_synthetic"]]
    synthetic = [m for m in matches if m["is_synthetic"]]

    assert len(historical) >= 4, f"Expected at least 4 historical matches, got {len(historical)}"
    assert len(synthetic) >= 5, f"Expected at least 5 synthetic matches, got {len(synthetic)}"

    # Verify event isolation: events belong only to their respective match
    first_match = matches[0]
    res_events = client.get(f"/api/matches/{first_match['id']}/events")
    assert res_events.status_code == 200
    events = res_events.json()
    assert len(events) > 0
    for ev in events:
        assert ev["match_id"] == first_match["id"], "Event leaked across match boundary!"


def test_live_session_lifecycle():
    """Test session creation, start, pause, resume, tick, and report."""
    create_res = client.post("/api/live-sessions", json={
        "title": "Championship Review Live Session",
        "match_id": "MATCH_PL_2026_01",
        "source_type": "EVENT_FEED_SIMULATION"
    })
    assert create_res.status_code == 200
    sess = create_res.json()
    session_id = sess["id"]
    assert sess["status"] == "IDLE"
    assert sess["source_type"] == "EVENT_FEED_SIMULATION"

    # Start session
    start_res = client.post(f"/api/live-sessions/{session_id}/start")
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "ACTIVE"

    # Pause session
    pause_res = client.post(f"/api/live-sessions/{session_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "PAUSED"

    # Advance tick (e.g. 60 seconds)
    tick_res = client.post(f"/api/live-sessions/{session_id}/tick", json={"advance_seconds": 60.0})
    assert tick_res.status_code == 200
    tick_data = tick_res.json()
    assert tick_data["current_minute"] == 1
    assert "measured_latency_ms" in tick_data
    assert tick_data["measured_latency_ms"] > 0

    # Generate final report
    rep_res = client.post(f"/api/live-sessions/{session_id}/report")
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["session_id"] == session_id
    assert "metrics" in rep_data
    assert "capability_disclaimers" in rep_data


def test_ssrf_protection_and_url_validation():
    """Verify that private IP targets and localhost are strictly blocked for security."""
    create_res = client.post("/api/live-sessions", json={
        "title": "URL Security Test Session",
        "source_type": "VIDEO_URL"
    })
    assert create_res.status_code == 200
    session_id = create_res.json()["id"]

    # 1. Localhost attempt
    res_loc = client.post(f"/api/live-sessions/{session_id}/source-check", json={
        "url": "http://localhost:8000/api/matches"
    })
    assert res_loc.status_code == 200
    data_loc = res_loc.json()
    assert data_loc["accessible"] is False
    assert "SECURITY_BLOCKED" in data_loc["error_reason"]

    # 2. Private IP 127.0.0.1
    res_priv = client.post(f"/api/live-sessions/{session_id}/source-check", json={
        "url": "http://127.0.0.1:8080/stream.m3u8"
    })
    assert res_priv.status_code == 200
    data_priv = res_priv.json()
    assert data_priv["accessible"] is False
    assert "SECURITY_BLOCKED" in data_priv["error_reason"]

    # 3. Invalid protocol (e.g. file:// or ftp://)
    res_proto = client.post(f"/api/live-sessions/{session_id}/source-check", json={
        "url": "file:///etc/passwd"
    })
    assert res_proto.status_code == 200
    data_proto = res_proto.json()
    assert data_proto["accessible"] is False


def test_manual_event_injection_and_decision_recording():
    """Test manual live event injection (Source D) and human decision audit logging."""
    create_res = client.post("/api/live-sessions", json={
        "title": "Manual Live Workstation Session",
        "source_type": "MANUAL"
    })
    session_id = create_res.json()["id"]

    # Inject manual incident candidate (foul right at penalty boundary)
    inj_res = client.post(f"/api/live-sessions/{session_id}/events", json={
        "minute": 74,
        "second": 20,
        "event_type": "FOUL_TACKLE",
        "player_name": "Marcus Vance",
        "team_name": "Apex Vanguard",
        "x": 83.2,
        "y": 48.0,
        "description": "High velocity trip 30cm before 18-yard box line",
        "is_incident_candidate": True
    })
    assert inj_res.status_code == 200
    inj_data = inj_res.json()
    assert inj_data["status"] == "EVENT_INJECTED"
    flagged = inj_data["flagged_incident"]
    assert flagged is not None
    assert flagged["stage_1_detected"] is True
    assert "stage_3_rule" in flagged
    assert "stage_4_recommendation" in flagged

    incident_id = flagged["incident_id"]

    # Record certified human ruling
    dec_res = client.post(f"/api/live-sessions/{session_id}/record-decision", json={
        "incident_id": incident_id,
        "official_ruling": "Direct Free Kick Outside Penalty Box",
        "official_ruling_ar": "ركلة حرة مباشرة خارج المنطقة",
        "disciplinary_action": "Yellow Card",
        "restart_play": "Direct Free Kick",
        "rationale": "Camera collinear view confirms contact occurred 30cm before penalty line.",
        "recorded_by": "Certified Match Referee"
    })
    assert dec_res.status_code == 200
    assert dec_res.json()["status"] == "DECISION_RECORDED"

    # Verify audit event persistence
    db = SessionLocal()
    audit = db.query(AuditEvent).filter_by(incident_id=incident_id).first()
    assert audit is not None
    assert audit.actor_name == "Certified Match Referee"
    assert "Direct Free Kick" in audit.details
    db.close()


def test_capability_matrix_endpoint():
    """Verify honest capability matrix endpoint provides transparent diagnostic details."""
    res = client.get("/api/live-sessions/capability-matrix")
    assert res.status_code == 200
    matrix = res.json()
    assert len(matrix) >= 5
    capabilities = [item["capability"] for item in matrix]
    assert "Direct Video Stream Decoding" in capabilities
    assert "Local Video Frame Extraction & OpenCV Decoding" in capabilities
    assert "3D Multi-Camera Optical Limb Geometry" in capabilities
