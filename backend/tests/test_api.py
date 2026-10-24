import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "RefVision AI"
    assert data["status"] == "OPERATIONAL"

def test_api_match_lifecycle():
    # Seek to minute 20
    resp = client.post("/api/match/seek", json={"minute": 20, "second": 0})
    assert resp.status_code == 200
    assert resp.json()["current_minute"] == 20

    # Get events
    ev_resp = client.get("/api/match/events")
    assert ev_resp.status_code == 200
    assert len(ev_resp.json()) > 0

    # Get analytics
    an_resp = client.get("/api/match/analytics")
    assert an_resp.status_code == 200
    assert "possession_percentage" in an_resp.json()["home_stats"]

def test_api_referee_workflow():
    # Seek to incident at minute 68
    client.post("/api/match/seek", json={"minute": 68, "second": 0})

    # Get incidents
    inc_resp = client.get("/api/referee/incidents")
    assert inc_resp.status_code == 200
    incidents = inc_resp.json()
    assert len(incidents) >= 1

    target_id = incidents[0]["incident_id"]

    # Record referee decision
    dec_payload = {
        "incident_id": target_id,
        "official_ruling": "Direct Free Kick Outside Box",
        "official_ruling_ar": "ركلة حرة مباشرة خارج المنطقة",
        "disciplinary_action": "Yellow Card",
        "restart_play": "Direct Free Kick",
        "rationale": "Contact initiated 10cm before penalty line.",
        "rationale_ar": "التلامس بدأ قبل خط المنطقة بـ 10 سم.",
        "recorded_by": "Marcus Sterling"
    }
    rec_resp = client.post("/api/referee/record-decision", json=dec_payload)
    assert rec_resp.status_code == 200
    assert rec_resp.json()["review_status"] == "DECISION_RECORDED"

    # Generate public explanation
    exp_resp = client.post("/api/referee/generate-explanation", json={"incident_id": target_id})
    assert exp_resp.status_code == 200
    assert "structured_explanation" in exp_resp.json()

def test_api_fan_prediction():
    # Submit prediction
    pred_payload = {
        "game_id": "GAME_01_NEXT_TOUCH",
        "selected_option_id": "OPT_APX_04"
    }
    client.post("/api/match/seek", json={"minute": 14, "second": 0})
    resp = client.post("/api/fan/predict", json=pred_payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "SUCCESS"

    # Get profile
    prof_resp = client.get("/api/fan/profile")
    assert prof_resp.status_code == 200
    assert prof_resp.json()["user_id"] == "USR_DEMO_01"

def test_api_agents_pipeline():
    client.post("/api/match/seek", json={"minute": 68, "second": 0})
    resp = client.post("/api/agents/execute-pipeline")
    assert resp.status_code == 200
    data = resp.json()
    assert "quality_gate" in data
    assert data["quality_gate"]["is_approved"] is True
