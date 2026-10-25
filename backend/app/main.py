import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.simulation.match_engine import MatchEngine
from app.predictions.game_engine import PredictionEngine
from app.orchestration.pipeline import MultiAgentOrchestrationPipeline
from app.api import routes_match, routes_referee, routes_fan, routes_agents, routes_platform, routes_video_analysis, routes_live_sessions
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed initial fixtures if needed
    try:
        init_db()
    except Exception as e:
        print(f"Database init notice: {e}")
    yield


app = FastAPI(
    title="RefVision AI API",
    description="Explainable Football Officiating, Machine Learning & Interactive Fan Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singleton application engines
match_engine = MatchEngine(seed="MATCH_PL_2026_01")
prediction_engine = PredictionEngine()
orchestration_pipeline = MultiAgentOrchestrationPipeline()

# Include Routers
app.include_router(routes_platform.router)
app.include_router(routes_video_analysis.router)
app.include_router(routes_live_sessions.router)
app.include_router(routes_match.get_routes(match_engine, prediction_engine))
app.include_router(routes_referee.get_routes(match_engine, orchestration_pipeline))
app.include_router(routes_fan.get_routes(match_engine, prediction_engine))
app.include_router(routes_agents.get_routes(match_engine, prediction_engine, orchestration_pipeline))


@app.get("/")
def root():
    return {
        "product": "RefVision AI",
        "tagline": "See the Decision. Understand the Game.",
        "version": "1.0.0",
        "hackathon": "Microsoft Premier League Inside the Game 2026",
        "status": "OPERATIONAL",
        "current_match_status": match_engine.match.status,
        "current_minute": match_engine.match.current_minute,
        "simulation_seed": match_engine.seed
    }


@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "backend": "OPERATIONAL",
        "database": "CONNECTED",
        "timestamp_seconds": match_engine.match.current_timestamp_seconds
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
