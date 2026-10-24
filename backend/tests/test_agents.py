import pytest
from app.simulation.match_engine import MatchEngine
from app.predictions.game_engine import PredictionEngine
from app.orchestration.pipeline import MultiAgentOrchestrationPipeline

def test_multi_agent_pipeline_execution():
    engine = MatchEngine(seed="MATCH_PL_2026_01")
    pe = PredictionEngine()
    pipeline = MultiAgentOrchestrationPipeline()

    engine.seek_to_minute(68)
    incident = engine.incidents.get("INC_68_PEN_CHECK")

    execution = pipeline.execute_workflow(
        events=engine.all_events,
        active_incident=incident,
        games=list(pe.games.values()),
        user_profile=pe.user_profile,
        current_seconds=engine.match.current_timestamp_seconds
    )

    assert len(execution.agent_outputs) == 6  # Agents 1-6 produced outputs
    assert execution.quality_gate.is_approved is True
    assert execution.quality_gate.non_authoritative_disclaimer_present is True
    assert execution.quality_gate.fact_check_passed is True
    assert execution.quality_gate.confidence_score >= 90.0

def test_supervisor_flags_missing_uncertainty():
    from app.agents.supervisor_agent import SupervisorAgent
    from app.schemas.agents import AgentMessage

    supervisor = SupervisorAgent()
    mock_outputs = {
        "Agent 5: Decision Explanation Agent": AgentMessage(
            agent_name="Agent 5: Decision Explanation Agent",
            role="Explanation",
            timestamp_seconds=100.0,
            status="SUCCESS",
            summary="Claim without uncertainty",
            summary_ar="ادعاء بدون ذكر عدم اليقين",
            data_payload={"fan_headline": "Test"}  # Missing uncertainty field
        )
    }

    gate = supervisor.run(mock_outputs, current_seconds=100.0)
    assert gate.is_approved is False
    assert any("uncertainty" in v for v in gate.violations)
