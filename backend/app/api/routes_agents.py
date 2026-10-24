from fastapi import APIRouter
from typing import Dict, Any, Optional

router = APIRouter(prefix="/api/agents", tags=["agents"])

def get_routes(engine, prediction_engine, orchestration_pipeline):
    @router.get("/status")
    def get_provider_status():
        return orchestration_pipeline.provider.get_provider_status()

    @router.post("/execute-pipeline")
    def execute_pipeline(incident_id: Optional[str] = None):
        target_incident = None
        if incident_id and incident_id in engine.incidents:
            target_incident = engine.incidents[incident_id]
        else:
            visible_incidents = engine.get_visible_incidents()
            if visible_incidents:
                target_incident = visible_incidents[0]

        execution = orchestration_pipeline.execute_workflow(
            events=engine.all_events,
            active_incident=target_incident,
            games=list(prediction_engine.games.values()),
            user_profile=prediction_engine.user_profile,
            current_seconds=engine.match.current_timestamp_seconds
        )
        return execution

    return router
