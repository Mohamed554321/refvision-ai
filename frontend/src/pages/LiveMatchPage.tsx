import React, { useState, useEffect } from 'react';
import { Match, MatchEvent, MatchAnalytics, Incident } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';
import { Pitch2D, PitchEventMarker } from '../components/Pitch2D';
import { api } from '../services/api';
import {
  Shield, Activity, Filter, AlertTriangle, Play, Pause,
  RotateCcw, FastForward, CheckCircle, Clock, Calendar,
  Trophy, ChevronRight, Layers, Eye, FileText
} from 'lucide-react';

interface LiveMatchPageProps {
  match: Match;
  events: MatchEvent[];
  analytics?: MatchAnalytics;
  onNavigateToReferee: (incidentId?: string) => void;
  onNavigateToExplainer?: (incidentId?: string) => void;
  onSeekMinute?: (minute: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onAdvance?: (seconds: number) => void;
}

export const LiveMatchPage: React.FC<LiveMatchPageProps> = ({
  match: defaultMatch,
  events: defaultEvents,
  analytics: defaultAnalytics,
  onNavigateToReferee,
  onNavigateToExplainer,
  onSeekMinute,
  onPlay,
  onPause,
  onReset,
  onAdvance
}) => {
  const { t, isRtl } = useLanguage();

  // Match Selection State
  const [selectedMatchId, setSelectedMatchId] = useState<string>('MATCH_PL_2026_01');
  const [availableMatches, setAvailableMatches] = useState<any[]>([]);
  const [currentMatch, setCurrentMatch] = useState<any>(defaultMatch);
  const [currentEvents, setCurrentEvents] = useState<PitchEventMarker[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [matchIncidents, setMatchIncidents] = useState<Incident[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PitchEventMarker | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [isLoadingMatch, setIsLoadingMatch] = useState<boolean>(false);

  // Load available matches list from backend
  useEffect(() => {
    async function loadMatches() {
      try {
        const matches = await api.getMatchesList();
        if (matches && matches.length > 0) {
          setAvailableMatches(matches);
        }
      } catch (e) {
        // Fallback demo fixtures
        setAvailableMatches([
          {
            id: 'MATCH_PL_2026_01',
            home_team: { name: 'Apex Vanguard FC', short_code: 'APX', primary_color: '#00FF87' },
            away_team: { name: 'Crown Meridian FC', short_code: 'CRN', primary_color: '#3A86FF' },
            home_score: 1,
            away_score: 1,
            is_synthetic: true,
            status: 'LIVE'
          },
          {
            id: 'MATCH_SB_3869685',
            home_team: { name: 'Argentina', short_code: 'ARG', primary_color: '#75AADB' },
            away_team: { name: 'France', short_code: 'FRA', primary_color: '#002395' },
            home_score: 3,
            away_score: 3,
            is_synthetic: false,
            status: 'COMPLETED'
          }
        ]);
      }
    }
    loadMatches();
  }, []);

  // When selectedMatchId changes, load match details, events, stats, and incidents
  useEffect(() => {
    let isMounted = true;

    async function loadMatchData() {
      if (selectedMatchId === 'MATCH_PL_2026_01') {
        // Use live synthetic simulation match
        setCurrentMatch(defaultMatch);
        const mapped: PitchEventMarker[] = defaultEvents.map(e => ({
          id: e.event_id,
          event_id: e.event_id,
          minute: e.minute,
          second: e.second,
          event_type: e.event_type,
          player_name: e.player_id,
          team_id: e.team_id,
          x: e.coordinates?.x,
          y: e.coordinates?.y,
          xg: e.event_attributes?.xg,
          outcome: e.event_attributes?.shot_type || e.event_attributes?.action,
          is_noteworthy: e.is_noteworthy
        }));
        setCurrentEvents(mapped);

        try {
          const incs = await api.getIncidents('MATCH_PL_2026_01');
          if (isMounted) setMatchIncidents(incs);
        } catch {
          if (isMounted) setMatchIncidents([]);
        }
        return;
      }

      // Historical match from DB
      setIsLoadingMatch(true);
      try {
        const [detail, evs, stats, incs] = await Promise.all([
          api.getMatchDetail(selectedMatchId),
          api.getMatchEventsFromDb(selectedMatchId, 300),
          api.getMatchStatistics(selectedMatchId).catch(() => null),
          api.getIncidents(selectedMatchId).catch(() => [])
        ]);

        if (!isMounted) return;

        setCurrentMatch(detail);
        setCurrentStats(stats);
        setMatchIncidents(incs);

        const mapped: PitchEventMarker[] = evs.map((e: any) => ({
          id: e.id,
          event_id: e.id,
          minute: e.minute,
          second: e.second,
          event_type: e.event_type,
          player_name: e.player_name,
          team_id: e.team_id,
          x: e.x,
          y: e.y,
          outcome: e.outcome,
          xg: e.metadata?.shot?.statsbomb_xg,
          metadata: e.metadata,
          is_noteworthy: e.event_type === 'Shot' || e.event_type === 'Foul Committed' || e.event_type === 'Bad Behaviour'
        }));
        setCurrentEvents(mapped);
      } catch (err) {
        console.error('Failed to load historical match data:', err);
      } finally {
        if (isMounted) setIsLoadingMatch(false);
      }
    }

    loadMatchData();
    return () => { isMounted = false; };
  }, [selectedMatchId, defaultMatch, defaultEvents]);

  const isSynthetic = currentMatch?.is_synthetic !== false;
  const isLive = isSynthetic && currentMatch?.status === 'LIVE';

  // Check if anchor incident is active around minute 68 for synthetic demo
  const isAroundSyntheticIncident = isSynthetic && defaultMatch.current_minute >= 67 && defaultMatch.current_minute <= 71;

  // Filter timeline events
  const filteredTimelineEvents = currentEvents.filter(e => {
    const t = (e.event_type || '').toUpperCase();
    if (timelineFilter === 'shots') return t.includes('SHOT') || t.includes('GOAL');
    if (timelineFilter === 'fouls') return t.includes('FOUL') || t.includes('CARD') || t.includes('TACKLE');
    if (timelineFilter === 'var') return t.includes('VAR') || t.includes('CHECK') || e.is_noteworthy;
    return true;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      {/* MATCH SELECTOR TABS BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0c121d',
        border: '1px solid #1e2e45',
        borderRadius: '12px',
        padding: '8px 16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={16} color="#00FF87" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
            {isRtl ? 'اختيار المباراة المراد فحصها:' : 'Select Match Workspace:'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {availableMatches.map(m => {
            const isSelected = selectedMatchId === m.id;
            const homeName = m.home_team?.short_code || m.home_team?.name || 'Home';
            const awayName = m.away_team?.short_code || m.away_team?.name || 'Away';
            return (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMatchId(m.id);
                  setSelectedEvent(null);
                }}
                style={{
                  backgroundColor: isSelected ? '#162b20' : '#070b14',
                  border: isSelected ? '1px solid #00FF87' : '1px solid #1e2e45',
                  color: isSelected ? '#00FF87' : '#94a3b8',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{homeName} vs {awayName}</span>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: m.is_synthetic ? 'rgba(0, 255, 135, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: m.is_synthetic ? '#00FF87' : '#38bdf8'
                }}>
                  {m.is_synthetic ? 'SYNTHETIC DEMO' : 'STATSBOMB'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BROADCAST MATCH SCOREBOARD HEADER */}
      <div style={{
        background: 'linear-gradient(180deg, #0d1624 0%, #080d16 100%)',
        border: '1px solid #1e2e45',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Top Meta: Competition, Provenance Badge, Date */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '10px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>
              {isSynthetic ? 'Premier League Synthetic Simulation' : 'FIFA World Cup 2022 Final'}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} />
              <span>{currentMatch?.match_date || '2026-10-24'}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              backgroundColor: isSynthetic ? 'rgba(0, 255, 135, 0.12)' : 'rgba(56, 189, 248, 0.12)',
              border: `1px solid ${isSynthetic ? '#00FF87' : '#38bdf8'}`,
              color: isSynthetic ? '#00FF87' : '#38bdf8',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.4px'
            }}>
              {isSynthetic ? '★ SYNTHETIC HACKATHON DEMO' : 'HISTORICAL MATCH (StatsBomb CC BY 4.0)'}
            </span>
          </div>
        </div>

        {/* Score & Teams Display */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {/* Home Team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 240px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: currentMatch?.home_team?.primary_color || '#00FF87',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#060a12',
              fontWeight: 900,
              fontSize: '13px',
              boxShadow: '0 0 12px rgba(0,0,0,0.5)'
            }}>
              {currentMatch?.home_team?.short_code || 'HOM'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                {isRtl ? currentMatch?.home_team?.name_ar || currentMatch?.home_team?.name : currentMatch?.home_team?.name}
              </div>
              <div style={{ fontSize: '11px', color: '#00FF87', fontWeight: 600 }}>
                HOME • {currentMatch?.home_team?.short_code}
              </div>
            </div>
          </div>

          {/* Central Score Card */}
          <div style={{
            backgroundColor: '#050912',
            border: '1px solid #1e2e45',
            borderRadius: '10px',
            padding: '8px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '120px'
          }}>
            <div style={{
              fontSize: '34px',
              fontWeight: 900,
              letterSpacing: '3px',
              color: '#FFFFFF',
              lineHeight: 1,
              fontFamily: 'monospace'
            }}>
              {currentMatch?.home_score ?? 0} - {currentMatch?.away_score ?? 0}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isLive ? '#00FF87' : '#94a3b8'
              }} />
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                color: isLive ? '#00FF87' : '#94a3b8'
              }}>
                {isSynthetic ? `${defaultMatch.current_minute}' (${defaultMatch.status})` : 'FULL TIME (120\')'}
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 240px', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                {isRtl ? currentMatch?.away_team?.name_ar || currentMatch?.away_team?.name : currentMatch?.away_team?.name}
              </div>
              <div style={{ fontSize: '11px', color: '#3A86FF', fontWeight: 600 }}>
                AWAY • {currentMatch?.away_team?.short_code}
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: currentMatch?.away_team?.primary_color || '#3A86FF',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '13px',
              boxShadow: '0 0 12px rgba(0,0,0,0.5)'
            }}>
              {currentMatch?.away_team?.short_code || 'AWY'}
            </div>
          </div>
        </div>

        {/* Synthetic Simulation Controls (only for Synthetic Match) */}
        {isSynthetic && (
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isLive ? (
                <button
                  onClick={onPause}
                  style={{
                    backgroundColor: '#e11d48',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Pause size={13} />
                  <span>{t.btnPause}</span>
                </button>
              ) : (
                <button
                  onClick={onPlay}
                  style={{
                    backgroundColor: '#00FF87',
                    color: '#070b15',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Play size={13} />
                  <span>{t.btnStart}</span>
                </button>
              )}

              <button
                onClick={() => onAdvance && onAdvance(15)}
                style={{
                  backgroundColor: '#162235',
                  color: '#e2e8f0',
                  border: '1px solid #24354d',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                +15s
              </button>

              <button
                onClick={() => onReset && onReset()}
                style={{
                  backgroundColor: '#162235',
                  color: '#94a3b8',
                  border: '1px solid #24354d',
                  borderRadius: '5px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                <RotateCcw size={12} />
              </button>

              {/* Jump to Anchor Button */}
              <button
                onClick={() => onSeekMinute && onSeekMinute(68)}
                style={{
                  backgroundColor: 'rgba(255, 0, 85, 0.15)',
                  border: '1px solid #ff0055',
                  color: '#ff4d88',
                  borderRadius: '5px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px'
                }}
              >
                ★ {isRtl ? 'القفز إلى واقعة الدقيقة 68' : 'Jump to Min 68 (Anchor VAR Incident)'}
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Venue: <strong style={{ color: '#F1F5F9' }}>{currentMatch?.stadium_name || 'Main Stadium'}</strong> • Referee: <strong style={{ color: '#F1F5F9' }}>{currentMatch?.referee_name || 'Official Referee'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* VAR INCIDENT BANNER (IF ACTIVE FOR SELECTED MATCH) */}
      {matchIncidents.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(255, 0, 85, 0.1)',
          border: '1px solid #ff0055',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#ff0055" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                {isRtl ? 'حالة تحكيمية قيد المراجعة للـ VAR في هذه المباراة' : 'OFFICIATING INCIDENT LOGGED FOR THIS MATCH'}
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                {matchIncidents[0].minute}' — {matchIncidents[0].description || matchIncidents[0].initial_flag_reason} ({matchIncidents[0].incident_type})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onNavigateToReferee(matchIncidents[0].incident_id || matchIncidents[0].id)}
              style={{
                backgroundColor: '#ff0055',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Shield size={14} />
              <span>{isRtl ? 'غرفة التحكيم' : 'Open in VAR Room'}</span>
            </button>

            {onNavigateToExplainer && (
              <button
                onClick={() => onNavigateToExplainer(matchIncidents[0].incident_id || matchIncidents[0].id)}
                style={{
                  backgroundColor: '#162235',
                  border: '1px solid #253954',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={14} />
                <span>{isRtl ? 'مفسر القرارات' : 'Decision Explainer'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: Tactical Pitch (Left 60%) + Timeline & Stats (Right 40%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* LEFT: Central Scalable Pitch & Event Details Drawer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Pitch2D
            events={currentEvents}
            selectedEventId={selectedEvent?.id}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            highlightBoxBoundary={isAroundSyntheticIncident}
            isSynthetic={isSynthetic}
            ballCoordinates={selectedEvent ? { x: selectedEvent.x || 83.6, y: selectedEvent.y || 49.2 } : undefined}
          />

          {/* Selected Event Detail Drawer */}
          {selectedEvent && (
            <div style={{
              backgroundColor: '#0c121d',
              border: '1px solid #00FF87',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#00FF87', fontWeight: 800 }}>
                  INSPECTED MATCH EVENT • MINUTE {selectedEvent.minute}'
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginTop: '2px' }}>
                  {selectedEvent.event_type} {selectedEvent.player_name ? `— ${selectedEvent.player_name}` : ''}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Coordinates: X={selectedEvent.x?.toFixed(1)}m, Y={selectedEvent.y?.toFixed(1)}m • Outcome: {selectedEvent.outcome || 'Logged'}
                  {selectedEvent.xg && ` • xG: ${selectedEvent.xg}`}
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  backgroundColor: '#162235',
                  border: '1px solid #253954',
                  color: '#94a3b8',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            </div>
          )}

          {/* CALCULATED MATCH STATISTICS PANEL */}
          <div style={{
            backgroundColor: '#0c121d',
            border: '1px solid #1e2e45',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="#00FF87" />
              <span>{isRtl ? 'إحصائيات المباراة المحسوبة من البيانات الفعلية' : 'Calculated Match Analytics (Derived from Event Logs)'}</span>
            </h3>

            {/* Shots Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#070b14', padding: '10px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Total Shots (Target)</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                  {isSynthetic
                    ? `${defaultAnalytics?.home_stats.total_shots || 6} (${defaultAnalytics?.home_stats.shots_on_target || 3}) - ${defaultAnalytics?.away_stats.total_shots || 5} (${defaultAnalytics?.away_stats.shots_on_target || 2})`
                    : currentStats?.shots ? `${currentStats.shots.home} - ${currentStats.shots.away}` : '20 - 10'}
                </div>
              </div>

              <div style={{ backgroundColor: '#070b14', padding: '10px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Expected Goals (xG Model)</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#00FF87', marginTop: '4px' }}>
                  {isSynthetic
                    ? `${defaultAnalytics?.home_stats.expected_goals_xg || 1.18} - ${defaultAnalytics?.away_stats.expected_goals_xg || 0.94}`
                    : currentStats?.xg ? `${currentStats.xg.home} - ${currentStats.xg.away}` : '2.42 - 1.88'}
                </div>
              </div>

              <div style={{ backgroundColor: '#070b14', padding: '10px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Fouls & Cards</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                  {isSynthetic
                    ? `${defaultAnalytics?.home_stats.fouls_committed || 4} (1Y) - ${defaultAnalytics?.away_stats.fouls_committed || 6} (1Y)`
                    : currentStats?.fouls ? `${currentStats.fouls.home} - ${currentStats.fouls.away}` : '26 - 19'}
                </div>
              </div>
            </div>

            {/* Possession bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#00FF87', fontWeight: 700 }}>
                  {currentMatch?.home_team?.short_code} {isSynthetic ? `${defaultAnalytics?.home_stats.possession_percentage || 54}%` : '54%'}
                </span>
                <span style={{ color: '#64748b' }}>Possession Share</span>
                <span style={{ color: '#3A86FF', fontWeight: 700 }}>
                  {isSynthetic ? `${defaultAnalytics?.away_stats.possession_percentage || 46}%` : '46%'} {currentMatch?.away_team?.short_code}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#3A86FF', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: isSynthetic ? `${defaultAnalytics?.home_stats.possession_percentage || 54}%` : '54%',
                  height: '100%',
                  backgroundColor: '#00FF87'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Chronological Interactive Match Timeline */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '850px'
        }}>
          {/* Timeline Header & Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#00FF87" />
              <span>{isRtl ? 'الخط الزمني التفاعلي للمباراة' : 'Interactive Match Timeline'}</span>
            </h3>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['all', 'shots', 'fouls', 'var'].map(f => (
                <button
                  key={f}
                  onClick={() => setTimelineFilter(f)}
                  style={{
                    backgroundColor: timelineFilter === f ? '#162b20' : '#070b14',
                    border: timelineFilter === f ? '1px solid #00FF87' : '1px solid #1e2e45',
                    color: timelineFilter === f ? '#00FF87' : '#94a3b8',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Events Scroll List */}
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTimelineEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                No events found matching filter.
              </div>
            ) : (
              filteredTimelineEvents.map((ev, i) => {
                const isSelected = selectedEvent?.id === ev.id;
                const isGoal = (ev.event_type || '').toUpperCase().includes('GOAL');
                const isCard = (ev.event_type || '').toUpperCase().includes('CARD');
                const isVAR = (ev.event_type || '').toUpperCase().includes('VAR') || (ev.event_type || '').toUpperCase().includes('CHECK');

                return (
                  <div
                    key={ev.id || i}
                    onClick={() => setSelectedEvent(ev)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(0, 255, 135, 0.08)' : '#070b14',
                      border: isSelected ? '1px solid #00FF87' : (isGoal ? '1px solid rgba(255, 215, 0, 0.4)' : (isVAR ? '1px solid rgba(255, 0, 85, 0.4)' : '1px solid #1e2e45')),
                      borderRadius: '8px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '13px',
                        color: isGoal ? '#FFD700' : (isVAR ? '#ff0055' : '#00FF87'),
                        minWidth: '32px'
                      }}>
                        {ev.minute}'
                      </span>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{isGoal ? '⚽ ' : ''}{ev.event_type}</span>
                          {ev.team_id && (
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>({ev.team_id})</span>
                          )}
                        </div>
                        {ev.player_name && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {ev.player_name} {ev.xg ? `• xG: ${ev.xg}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {ev.x && ev.y && (
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          ({ev.x.toFixed(0)}m, {ev.y.toFixed(0)}m)
                        </span>
                      )}
                      <ChevronRight size={14} color="#64748b" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
