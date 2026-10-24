from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentMessage(BaseModel):
    agent_name: str
    role: str
    timestamp_seconds: float
    status: str  # SUCCESS, FALLBACK, WARNING, RETRY
    summary: str
    summary_ar: str
    data_payload: Dict[str, Any] = Field(default_factory=dict)
    provenance_event_ids: List[str] = Field(default_factory=list)

class QualityGateResult(BaseModel):
    is_approved: bool
    confidence_score: float
    violations: List[str] = Field(default_factory=list)
    fact_check_passed: bool
    non_authoritative_disclaimer_present: bool
    evidence_links_valid: bool
    supervisor_notes: str
    supervisor_notes_ar: str

class MultiAgentWorkflowExecution(BaseModel):
    workflow_id: str
    incident_id: Optional[str] = None
    timestamp_seconds: float
    agent_outputs: Dict[str, AgentMessage] = Field(default_factory=dict)
    quality_gate: QualityGateResult
    execution_time_ms: float
    provider_used: str  # "Microsoft Foundry (Simulated/Agent Framework)" or "Local Deterministic Fallback"
