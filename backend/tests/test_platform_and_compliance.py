import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import Match, Incident, AuditEvent, ModelVersion, FanPrediction

client = TestClient(app)


def test_platform_health_and_system_status():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"
    assert resp.json()["database"] == "CONNECTED"

    status_resp = client.get("/api/system/status")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["status"] == "OPERATIONAL"
    assert data["database_persistence"]["status"] == "CONNECTED"
    assert data["database_persistence"]["total_matches"] >= 1
    assert data["knowledge_base"]["indexed_rules"] >= 3
    assert data["ml_model_service"]["status"] == "READY"


def test_methodology_and_transparency():
    resp = client.get("/api/system/methodology")
    assert resp.status_code == 200
    data = resp.json()
    assert "data_provenance" in data
    assert any("StatsBomb" in p["source"] for p in data["data_provenance"])
    assert any("IFAB" in p["source"] for p in data["data_provenance"])
    assert len(data["ethical_ai_commitments"]) >= 3


def test_data_sources_and_datasets():
    src_resp = client.get("/api/data-sources")
    assert src_resp.status_code == 200
    sources = src_resp.json()
    assert len(sources) >= 2
    assert any("CC BY 4.0" in s["license"] for s in sources)

    ds_resp = client.get("/api/datasets")
    assert ds_resp.status_code == 200
    datasets = ds_resp.json()
    assert len(datasets) >= 1
    assert datasets[0]["records_count"] > 0


def test_match_and_events_retrieval():
    matches_resp = client.get("/api/matches")
    assert matches_resp.status_code == 200
    matches = matches_resp.json()
    assert len(matches) >= 1

    target_match_id = matches[0]["id"]
    m_resp = client.get(f"/api/matches/{target_match_id}")
    assert m_resp.status_code == 200
    assert m_resp.json()["id"] == target_match_id

    evs_resp = client.get(f"/api/matches/{target_match_id}/events?limit=50")
    assert evs_resp.status_code == 200
    events = evs_resp.json()
    assert len(events) > 0


def test_knowledge_base_search_and_citations():
    # Search for boundary rule
    search_resp = client.get("/api/knowledge/search?q=boundary")
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) >= 1
    top = results[0]
    assert "Law 12" in top["law_number"]
    assert "theifab.com" in top["official_source_url"]
    assert "line" in top["summary_en"].lower() or "boundary" in top["summary_en"].lower()

    # Search for VAR protocol
    var_resp = client.get("/api/knowledge/search?q=clear and obvious")
    assert var_resp.status_code == 200
    var_results = var_resp.json()
    assert len(var_results) >= 1
    assert any("VAR" in r["law_number"] for r in var_results)


def test_human_review_persistence_and_audit():
    # Get initial incident
    inc_resp = client.get("/api/incidents")
    assert inc_resp.status_code == 200
    incidents = inc_resp.json()
    assert len(incidents) >= 1
    inc_id = incidents[0]["id"]

    # Record review decision
    review_payload = {
        "official_ruling": "Direct Free Kick Outside Penalty Box",
        "official_ruling_ar": "ركلة حرة مباشرة خارج منطقة الجزاء",
        "disciplinary_action": "Yellow Card",
        "restart_play": "Direct Free Kick",
        "rationale": "Initial contact occurred 10cm before 18-yard boundary line.",
        "rationale_ar": "التلامس بدأ قبل خط الـ 18 ياردة بـ 10 سم.",
        "recorded_by": "Referee Marcus Sterling"
    }

    rec_resp = client.post(f"/api/incidents/{inc_id}/review", json=review_payload)
    assert rec_resp.status_code == 200
    assert rec_resp.json()["status"] == "SUCCESS"
    assert rec_resp.json()["review_status"] == "DECISION_RECORDED"

    # Verify incident details and audit trail persisted
    detail_resp = client.get(f"/api/incidents/{inc_id}")
    assert detail_resp.status_code == 200
    data = detail_resp.json()
    assert data["review_status"] == "DECISION_RECORDED"
    assert data["human_ruling"] == "Direct Free Kick Outside Penalty Box"
    assert len(data["audit_history"]) >= 1

    # Verify global audit log
    audit_resp = client.get("/api/audit-log")
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()) >= 1


def test_ml_model_metadata_and_inference():
    # Model List
    models_resp = client.get("/api/models")
    assert models_resp.status_code == 200
    models = models_resp.json()
    assert len(models) >= 1
    m = models[0]
    assert m["algorithm"].startswith("GradientBoosting")
    assert m["train_samples"] > 100
    assert "test_roc_auc" in m["evaluation_metrics"]

    # Inference Endpoint: Close shot
    pred1_resp = client.post(f"/api/models/{m['id']}/predict", json={
        "x": 115.0,
        "y": 40.0,
        "technique": "Normal",
        "body_part": "Right Foot",
        "play_pattern": "Regular Play",
        "under_pressure": False
    })
    assert pred1_resp.status_code == 200
    p1 = pred1_resp.json()
    assert p1["status"] == "MODEL_INFERENCE_SUCCESS"
    xg1 = p1["predicted_xg"]

    # Inference Endpoint: Far distance shot
    pred2_resp = client.post(f"/api/models/{m['id']}/predict", json={
        "x": 75.0,
        "y": 12.0,
        "technique": "Volley",
        "body_part": "Right Foot",
        "play_pattern": "Regular Play",
        "under_pressure": True
    })
    assert pred2_resp.status_code == 200
    p2 = pred2_resp.json()
    xg2 = p2["predicted_xg"]

    # The close central shot MUST have significantly higher xG than the contested 45m shot
    assert xg1 > xg2
    assert p1["input_features"]["calculated_distance_meters"] < p2["input_features"]["calculated_distance_meters"]


def test_fan_arena_games_and_scoring():
    games_resp = client.get("/api/fan-games")
    assert games_resp.status_code == 200
    games = games_resp.json()
    assert len(games) >= 5

    # Test Spot the Rule quiz submission
    rule_game = next((g for g in games if g["game_type"] == "SPOT_THE_RULE"), None)
    assert rule_game is not None

    sub_resp = client.post(f"/api/fan-games/{rule_game['game_id']}/predictions", json={
        "selected_option_id": "OPT_RULE_DFK",
        "user_id": "USR_DEMO_01"
    })
    assert sub_resp.status_code == 200
    data = sub_resp.json()
    assert data["status"] == "RESOLVED_WON"
    assert data["points_earned"] == rule_game["points_reward"]
    assert data["user_current_points"] > 140

    # Leaderboard
    lb_resp = client.get(f"/api/fan-games/{rule_game['game_id']}/leaderboard")
    assert lb_resp.status_code == 200
    leaderboard = lb_resp.json()
    assert len(leaderboard) >= 3
    assert any(entry["username"] == "Alex_PremierFan" for entry in leaderboard)


def test_database_persistence_across_reconnect():
    # Direct DB test proving state persists
    db = SessionLocal()
    try:
        # Check that previous incident update exists
        inc = db.query(Incident).filter_by(id="INC_68_PEN_CHECK").first()
        assert inc is not None
        assert inc.human_ruling is not None

        # Check model exists
        mv = db.query(ModelVersion).filter_by(id="MODEL_XG_GB_01").first()
        assert mv is not None
        assert mv.train_samples > 0

        # Check prediction exists
        pred = db.query(FanPrediction).filter(FanPrediction.user_id == "USR_DEMO_01").first()
        assert pred is not None
    finally:
        db.close()
