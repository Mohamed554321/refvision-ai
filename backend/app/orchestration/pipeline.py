import time
from typing import List, Dict, Optional, Any
from app.schemas.events import MatchEvent
from app.schemas.incidents import Incident, StructuredExplanation
from app.schemas.predictions import ActivePredictionGame, FanUserProfile
from app.schemas.agents import AgentMessage, MultiAgentWorkflowExecution
from app.agents.match_event_analyst import MatchEventAnalystAgent
from app.agents.match_intelligence_analyst import MatchIntelligenceAnalystAgent
from app.agents.officiating_evidence_analyst import OfficiatingEvidenceAnalystAgent
from app.agents.evidence_angle_assistant import EvidenceAngleAssistantAgent
from app.agents.decision_explanation_agent import DecisionExplanationAgent
from app.agents.fan_experience_agent import FanExperienceAgent
from app.agents.supervisor_agent import SupervisorAgent
from app.orchestration.microsoft_agent_provider import MicrosoftAgentProvider

class MultiAgentOrchestrationPipeline:
    def __init__(self):
        self.provider = MicrosoftAgentProvider()
        self.agent_1 = MatchEventAnalystAgent()
        self.agent_2 = MatchIntelligenceAnalystAgent()
        self.agent_3 = OfficiatingEvidenceAnalystAgent()
        self.agent_4 = EvidenceAngleAssistantAgent()
        self.agent_5 = DecisionExplanationAgent()
        self.agent_6 = FanExperienceAgent()
        self.agent_7 = SupervisorAgent()

    def execute_workflow(
        self,
        events: List[MatchEvent],
        active_incident: Optional[Incident],
        games: List[ActivePredictionGame],
        user_profile: FanUserProfile,
        current_seconds: float
    ) -> MultiAgentWorkflowExecution:
        start_time = time.perf_counter()
        agent_outputs: Dict[str, AgentMessage] = {}

        # 1. Match Event Analyst
        msg_1 = self.agent_1.run(events, current_seconds)
        agent_outputs[msg_1.agent_name] = msg_1

        # 2. Match Intelligence Analyst
        msg_2 = self.agent_2.run(events, current_seconds)
        agent_outputs[msg_2.agent_name] = msg_2

        # 3. Officiating Evidence Analyst
        msg_3 = self.agent_3.run(active_incident, current_seconds)
        agent_outputs[msg_3.agent_name] = msg_3

        # 4. Evidence & Angle Assistant
        msg_4 = self.agent_4.run(active_incident, current_seconds)
        agent_outputs[msg_4.agent_name] = msg_4

        # 5. Decision Explanation Agent
        explanation, msg_5 = self.agent_5.run(active_incident, current_seconds)
        agent_outputs[msg_5.agent_name] = msg_5

        # 6. Fan Experience Agent
        msg_6 = self.agent_6.run(games, user_profile, current_seconds)
        agent_outputs[msg_6.agent_name] = msg_6

        # 7. Supervisor & Quality Gate
        gate_result = self.agent_7.run(agent_outputs, current_seconds)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        provider_info = self.provider.get_provider_status()

        return MultiAgentWorkflowExecution(
            workflow_id=f"WF_EXEC_{int(current_seconds)}_{int(time.time())}",
            incident_id=active_incident.incident_id if active_incident else None,
            timestamp_seconds=current_seconds,
            agent_outputs=agent_outputs,
            quality_gate=gate_result,
            execution_time_ms=round(elapsed_ms, 2),
            provider_used=provider_info["provider_name"]
        )
