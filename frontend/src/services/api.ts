import {
  Match, MatchEvent, Incident, ActivePredictionGame, FanUserProfile,
  LeaderboardEntry, MatchAnalytics, MultiAgentWorkflowExecution
} from '../types/football';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  async getMatchState(): Promise<{ match: Match; visible_events_count: number; total_events_count: number }> {
    const res = await fetch(`${API_BASE}/match`);
    if (!res.ok) throw new Error('Failed to fetch match state');
    return res.json();
  },

  async startMatch(): Promise<void> {
    await fetch(`${API_BASE}/match/start`, { method: 'POST' });
  },

  async pauseMatch(): Promise<void> {
    await fetch(`${API_BASE}/match/pause`, { method: 'POST' });
  },

  async resetMatch(): Promise<void> {
    await fetch(`${API_BASE}/match/reset`, { method: 'POST' });
  },

  async seekMinute(minute: number, second = 0): Promise<void> {
    await fetch(`${API_BASE}/match/seek`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minute, second })
    });
  },

  async advanceSeconds(seconds: number): Promise<void> {
    await fetch(`${API_BASE}/match/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds })
    });
  },

  async getEvents(): Promise<MatchEvent[]> {
    const res = await fetch(`${API_BASE}/match/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getAnalytics(): Promise<MatchAnalytics> {
    const res = await fetch(`${API_BASE}/match/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getIncidents(matchId?: string): Promise<Incident[]> {
    const url = matchId ? `${API_BASE}/referee/incidents?match_id=${encodeURIComponent(matchId)}` : `${API_BASE}/referee/incidents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(incidentId: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/referee/incident/${incidentId}`);
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async recordDecision(payload: {
    incident_id: string;
    official_ruling: string;
    official_ruling_ar: string;
    disciplinary_action: string;
    restart_play: string;
    rationale: string;
    rationale_ar: string;
    recorded_by?: string;
  }): Promise<Incident> {
    const res = await fetch(`${API_BASE}/referee/record-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record decision');
    return res.json();
  },

  async generateExplanation(incidentId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/referee/generate-explanation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: incidentId })
    });
    if (!res.ok) throw new Error('Failed to generate explanation');
    return res.json();
  },

  async getAuditLog(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/referee/audit-log`);
    if (!res.ok) throw new Error('Failed to fetch audit log');
    return res.json();
  },

  async getPredictionGames(): Promise<ActivePredictionGame[]> {
    const res = await fetch(`${API_BASE}/fan/games`);
    if (!res.ok) throw new Error('Failed to fetch games');
    return res.json();
  },

  async submitPrediction(gameId: string, selectedOptionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/fan/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game_id: gameId, selected_option_id: selectedOptionId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
  },

  async getFanProfile(): Promise<FanUserProfile> {
    const res = await fetch(`${API_BASE}/fan/profile`);
    if (!res.ok) throw new Error('Failed to fetch fan profile');
    return res.json();
  },

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const res = await fetch(`${API_BASE}/fan/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
  },

  async getProviderStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/agents/status`);
    if (!res.ok) throw new Error('Failed to fetch agent status');
    return res.json();
  },

  async executeMultiAgentPipeline(incidentId?: string): Promise<MultiAgentWorkflowExecution> {
    const url = incidentId
      ? `${API_BASE}/agents/execute-pipeline?incident_id=${incidentId}`
      : `${API_BASE}/agents/execute-pipeline`;
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to execute pipeline');
    return res.json();
  },

  // -------------------------------------------------------------
  // Data & Model Transparency Platform APIs
  // -------------------------------------------------------------
  async getSystemStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getMethodology(): Promise<any> {
    const res = await fetch(`${API_BASE}/system/methodology`);
    if (!res.ok) throw new Error('Failed to fetch methodology');
    return res.json();
  },

  async getDataSources(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/data-sources`);
    if (!res.ok) throw new Error('Failed to fetch data sources');
    return res.json();
  },

  async getDatasets(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error('Failed to fetch datasets');
    return res.json();
  },

  async getMatchesList(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/matches`);
    if (!res.ok) throw new Error('Failed to fetch matches');
    return res.json();
  },

  async getMatchDetail(matchId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${matchId}`);
    if (!res.ok) throw new Error('Failed to fetch match detail');
    return res.json();
  },

  async getMatchEventsFromDb(matchId: string, limit = 100): Promise<any[]> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/events?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch match events');
    return res.json();
  },

  async getModels(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
  },

  async getModelDetail(modelId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/models/${modelId}`);
    if (!res.ok) throw new Error('Failed to fetch model details');
    return res.json();
  },

  async predictShotXg(modelId: string, payload: {
    x: number;
    y: number;
    technique?: string;
    body_part?: string;
    play_pattern?: string;
    under_pressure?: boolean;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/models/${modelId}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Inference request failed');
    return res.json();
  },

  async searchRules(q: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/knowledge/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Rule search failed');
    return res.json();
  },

  async getKnowledgeDocuments(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/knowledge/documents`);
    if (!res.ok) throw new Error('Failed to fetch knowledge documents');
    return res.json();
  },

  async getAllFanGames(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/fan-games`);
    if (!res.ok) throw new Error('Failed to fetch fan games');
    return res.json();
  },

  async submitFanGamePrediction(gameId: string, selectedOptionId: string, userId = 'USR_DEMO_01'): Promise<any> {
    const res = await fetch(`${API_BASE}/fan-games/${gameId}/predictions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected_option_id: selectedOptionId, user_id: userId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Prediction submission failed');
    }
    return res.json();
  },

  // -------------------------------------------------------------
  // Video-Based Referee Analysis APIs
  // -------------------------------------------------------------
  async uploadVideoClip(formData: FormData): Promise<any> {
    const res = await fetch(`${API_BASE}/video-analysis/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Video upload failed');
    }
    return res.json();
  },

  async runVideoAnalysis(analysisId: string, payload: {
    incident_timestamp?: number;
    incident_type?: string;
    user_description?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/video-analysis/${analysisId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Analysis processing failed');
    }
    return res.json();
  },

  async getVideoAnalysis(analysisId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/video-analysis/${analysisId}`);
    if (!res.ok) throw new Error('Failed to retrieve video analysis');
    return res.json();
  },

  async getSampleVideo(): Promise<any> {
    const res = await fetch(`${API_BASE}/video-analysis/sample`);
    if (!res.ok) throw new Error('Failed to retrieve sample video');
    return res.json();
  },

  async recordVideoDecision(analysisId: string, payload: {
    official_ruling: string;
    disciplinary_action?: string;
    restart_play?: string;
    rationale: string;
    reviewed_by?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/video-analysis/${analysisId}/record-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record human decision');
    return res.json();
  },

  async deleteVideoAnalysis(analysisId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/video-analysis/${analysisId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete analysis');
    return res.json();
  },

  async getMatchStatistics(matchId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/statistics`);
    if (!res.ok) throw new Error('Failed to fetch match statistics');
    return res.json();
  },

  // -----------------------------------------------------------
  // Live Referee Assistant & Match Monitoring API
  // -----------------------------------------------------------
  async createLiveSession(data: {
    title: string;
    match_id?: string;
    source_type: string;
    source_url?: string;
    video_analysis_id?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create live session');
    return res.json();
  },

  async getLiveSessions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/live-sessions`);
    if (!res.ok) throw new Error('Failed to list live sessions');
    return res.json();
  },

  async getLiveSession(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch live session');
    return res.json();
  },

  async checkLiveSource(sessionId: string, url: string): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/source-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('Source check failed');
    return res.json();
  },

  async startLiveSession(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start session');
    return res.json();
  },

  async pauseLiveSession(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to pause session');
    return res.json();
  },

  async stopLiveSession(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop session');
    return res.json();
  },

  async tickLiveSession(sessionId: string, advanceSeconds = 15.0): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/tick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advance_seconds: advanceSeconds })
    });
    if (!res.ok) throw new Error('Tick failed');
    return res.json();
  },

  async injectLiveManualEvent(sessionId: string, eventData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    if (!res.ok) throw new Error('Failed to inject live event');
    return res.json();
  },

  async recordLiveDecision(sessionId: string, payload: {
    incident_id: string;
    official_ruling: string;
    official_ruling_ar?: string;
    disciplinary_action?: string;
    restart_play?: string;
    rationale: string;
    recorded_by?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/record-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to record live decision');
    return res.json();
  },

  async getLiveSessionReport(sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/live-sessions/${sessionId}/report`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to generate report');
    return res.json();
  },

  async getCapabilityMatrix(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/live-sessions/capability-matrix`);
    if (!res.ok) throw new Error('Failed to fetch capability matrix');
    return res.json();
  }
};
