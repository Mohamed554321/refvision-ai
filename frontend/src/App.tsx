import React, { useState, useEffect, useCallback } from 'react';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { Navbar } from './components/Navbar';
import { MatchHeader } from './components/MatchHeader';
import { HomePage } from './pages/HomePage';
import { LiveMatchPage } from './pages/LiveMatchPage';
import { RefereeIntelligencePage } from './pages/RefereeIntelligencePage';
import { VideoAnalysisPage } from './pages/VideoAnalysisPage';
import { DecisionExplainerPage } from './pages/DecisionExplainerPage';
import { FanArenaPage } from './pages/FanArenaPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PostMatchReportPage } from './pages/PostMatchReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransparencyPage } from './pages/TransparencyPage';
import { api } from './services/api';
import {
  Match, MatchEvent, Incident, ActivePredictionGame,
  FanUserProfile, LeaderboardEntry, MatchAnalytics
} from './types/football';

// Default initial fallback state
const DEFAULT_MATCH: Match = {
  match_id: 'MATCH_PL_2026_01',
  home_team: {
    team_id: 'APX',
    name: 'Apex Vanguard FC',
    name_ar: 'أبيكس فانغارد',
    short_code: 'APX',
    primary_color: '#00FF87',
    secondary_color: '#0B132B',
    players: []
  },
  away_team: {
    team_id: 'CRN',
    name: 'Crown Meridian FC',
    name_ar: 'كراون ميريديان',
    short_code: 'CRN',
    primary_color: '#3A86FF',
    secondary_color: '#FFFFFF',
    players: []
  },
  home_score: 1,
  away_score: 1,
  current_minute: 68,
  current_second: 0,
  current_timestamp_seconds: 68 * 60,
  status: 'LIVE',
  simulation_seed: 'MATCH_PL_2026_01',
  stadium_name: 'Apex Arena',
  stadium_name_ar: 'أرينا أبيكس',
  referee_name: 'Marcus Sterling',
  referee_name_ar: 'ماركوس ستيرلينغ',
  var_official_name: 'David Alpert',
  var_official_name_ar: 'ديفيد ألبرت'
};

const DEFAULT_PROFILE: FanUserProfile = {
  user_id: 'USR_DEMO_01',
  username: 'Alex_PremierFan',
  favorite_team_id: 'APX',
  points: 140,
  streak_count: 2,
  predictions_count: 3,
  accuracy_rate: 66.7,
  badges: [
    {
      badge_id: 'BDG_FIRST_CORRECT',
      name: 'Sharp Eye',
      name_ar: 'العين الثاقبة',
      description: 'Successfully predicted your first live match event.',
      description_ar: 'نجحت في توقع أول حدث مباشر في المباراة.',
      icon_name: 'Target',
      is_unlocked: true,
      unlocked_at: '2026-10-24T22:15:00Z'
    },
    {
      badge_id: 'BDG_STREAK_2',
      name: 'On A Roll',
      name_ar: 'سلسلة انتصارات',
      description: 'Maintained a 2-prediction winning streak.',
      description_ar: 'حافظت على سلسلة توقعات ناجحة لمرتين متتاليتين.',
      icon_name: 'Zap',
      is_unlocked: true,
      unlocked_at: '2026-10-24T22:45:00Z'
    },
    {
      badge_id: 'BDG_VAR_GURU',
      name: 'VAR Whisperer',
      name_ar: 'خبير الـ VAR',
      description: 'Correctly predicted a complex officiating review outcome.',
      description_ar: 'توقعت بنجاح نتيجة مراجعة تحكيمية معقدة بتقنية الفيديو.',
      icon_name: 'Award',
      is_unlocked: false
    }
  ],
  prediction_history: []
};

const RefVisionAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [match, setMatch] = useState<Match>(DEFAULT_MATCH);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [analytics, setAnalytics] = useState<MatchAnalytics | undefined>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [predictionGames, setPredictionGames] = useState<ActivePredictionGame[]>([]);
  const [fanProfile, setFanProfile] = useState<FanUserProfile>(DEFAULT_PROFILE);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('INC_68_PEN_CHECK');

  // Fetch all state from API
  const refreshState = useCallback(async () => {
    try {
      const matchData = await api.getMatchState();
      setMatch(matchData.match);

      const [evs, an, incs, games, prof, lb] = await Promise.all([
        api.getEvents(),
        api.getAnalytics(),
        api.getIncidents(),
        api.getPredictionGames(),
        api.getFanProfile(),
        api.getLeaderboard()
      ]);

      setEvents(evs);
      setAnalytics(an);
      setIncidents(incs);
      setPredictionGames(games);
      setFanProfile(prof);
      setLeaderboard(lb);
    } catch (e) {
      // Backend not yet reachable, keep offline demo fixtures
    }
  }, []);

  // Poll state every 3 seconds if LIVE
  useEffect(() => {
    refreshState();
    const interval = setInterval(() => {
      if (match.status === 'LIVE') {
        refreshState();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [match.status, refreshState]);

  // Handlers
  const handlePlay = async () => {
    try {
      await api.startMatch();
      await refreshState();
    } catch {
      setMatch(prev => ({ ...prev, status: 'LIVE' }));
    }
  };

  const handlePause = async () => {
    try {
      await api.pauseMatch();
      await refreshState();
    } catch {
      setMatch(prev => ({ ...prev, status: 'PAUSED' }));
    }
  };

  const handleReset = async () => {
    try {
      await api.resetMatch();
      await refreshState();
    } catch {
      setMatch(prev => ({ ...prev, current_minute: 0, current_second: 0, home_score: 0, away_score: 0 }));
    }
  };

  const handleAdvance = async (seconds: number) => {
    try {
      await api.advanceSeconds(seconds);
      await refreshState();
    } catch {
      setMatch(prev => ({
        ...prev,
        current_minute: prev.current_minute + 1,
        current_timestamp_seconds: prev.current_timestamp_seconds + seconds
      }));
    }
  };

  const handleSeek = async (minute: number) => {
    try {
      await api.seekMinute(minute);
      await refreshState();
    } catch {
      setMatch(prev => ({
        ...prev,
        current_minute: minute,
        current_second: 0,
        current_timestamp_seconds: minute * 60
      }));
    }
  };

  const handleRecordDecision = async (payload: any) => {
    await api.recordDecision(payload);
    await refreshState();
  };

  const handleGenerateExplanation = async (incidentId: string) => {
    await api.generateExplanation(incidentId);
    await refreshState();
  };

  const handleSubmitPrediction = async (gameId: string, optionId: string) => {
    await api.submitPrediction(gameId, optionId);
    await refreshState();
  };

  const hasActiveReview = incidents.some(i => i.review_status === 'FLAGGED' || i.review_status === 'UNDER_VAR_INSPECTION');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070b16', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userPoints={fanProfile.points}
        hasActiveReview={hasActiveReview}
      />

      <MatchHeader
        match={match}
        onPlay={handlePlay}
        onPause={handlePause}
        onReset={handleReset}
        onAdvance={handleAdvance}
        onSeek={handleSeek}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'home' && (
          <HomePage
            onNavigate={setActiveTab}
            onSeek={handleSeek}
          />
        )}

        {activeTab === 'match' && (
          <LiveMatchPage
            match={match}
            events={events}
            analytics={analytics}
            onNavigateToReferee={(incId) => {
              if (incId) setSelectedIncidentId(incId);
              setActiveTab('referee');
            }}
            onNavigateToExplainer={(incId) => {
              if (incId) setSelectedIncidentId(incId);
              setActiveTab('explainer');
            }}
            onSeekMinute={handleSeek}
            onPlay={handlePlay}
            onPause={handlePause}
            onReset={handleReset}
            onAdvance={handleAdvance}
          />
        )}

        {activeTab === 'referee' && (
          <RefereeIntelligencePage
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
            onRecordDecision={handleRecordDecision}
            onGenerateExplanation={handleGenerateExplanation}
            onNavigateToExplainer={(incId) => {
              setSelectedIncidentId(incId);
              setActiveTab('explainer');
            }}
          />
        )}

        {activeTab === 'video-analysis' && (
          <VideoAnalysisPage />
        )}

        {activeTab === 'explainer' && (
          <DecisionExplainerPage
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
          />
        )}

        {activeTab === 'fan' && (
          <FanArenaPage
            games={predictionGames}
            profile={fanProfile}
            leaderboard={leaderboard}
            currentSeconds={match.current_timestamp_seconds}
            onSubmitPrediction={handleSubmitPrediction}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            analytics={analytics}
            currentMinute={match.current_minute}
          />
        )}

        {activeTab === 'transparency' && (
          <TransparencyPage />
        )}

        {activeTab === 'report' && (
          <PostMatchReportPage
            match={match}
            incidents={incidents}
            profile={fanProfile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#050811',
        borderTop: '1px solid #1e293b',
        padding: '20px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span style={{ fontWeight: 700, color: '#FFFFFF' }}>RefVision AI</span> • Microsoft Premier League Hackathon 2026 Project
          </div>
          <div>
            Built with React, TypeScript, FastAPI, & Microsoft Agent Framework Architecture • Zero-Cost Local Execution ($0)
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <RefVisionAppContent />
    </LanguageProvider>
  );
};

export default App;
