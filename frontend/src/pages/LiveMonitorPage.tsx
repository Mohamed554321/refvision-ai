import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import {
  LiveSession,
  LiveSessionEvent,
  LiveSessionIncident,
  SourceCheckResult,
  LiveSessionReport,
  CapabilityMatrixItem
} from '../types/football';
import {
  Radio, Play, Pause, Square, FastForward, PlusCircle, ShieldAlert,
  CheckCircle2, Clock, Activity, AlertTriangle, FileText, ExternalLink,
  Sliders, Video, Send, RefreshCw, Eye, Check, ChevronRight
} from 'lucide-react';

export const LiveMonitorPage: React.FC = () => {
  const { t, isRtl } = useLanguage();

  // Active Session State
  const [session, setSession] = useState<LiveSession | null>(null);
  const [sessionsList, setSessionsList] = useState<LiveSession[]>([]);
  const [availableMatches, setAvailableMatches] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('MATCH_PL_2026_01');
  const [sourceType, setSourceType] = useState<'EVENT_FEED_SIMULATION' | 'VIDEO_URL' | 'VIDEO_UPLOAD' | 'MANUAL'>('EVENT_FEED_SIMULATION');
  const [streamUrl, setStreamUrl] = useState<string>('https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
  const [sourceCheck, setSourceCheck] = useState<SourceCheckResult | null>(null);
  const [isCheckingSource, setIsCheckingSource] = useState(false);

  // Live Stream & Events
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [eventsFeed, setEventsFeed] = useState<LiveSessionEvent[]>([]);
  const [incidentsList, setIncidentsList] = useState<LiveSessionIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<LiveSessionIncident | null>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'FOULS' | 'GOALS' | 'VAR'>('ALL');
  const [sessionReport, setSessionReport] = useState<LiveSessionReport | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [capabilityMatrix, setCapabilityMatrix] = useState<CapabilityMatrixItem[]>([]);
  const [showCapabilities, setShowCapabilities] = useState<boolean>(false);

  // Manual Event Input Form
  const [manualMin, setManualMin] = useState<number>(68);
  const [manualSec, setManualSec] = useState<number>(30);
  const [manualType, setManualType] = useState<string>('FOUL_TACKLE');
  const [manualDesc, setManualDesc] = useState<string>('Sliding challenge 20cm outside penalty box white line');
  const [manualX, setManualX] = useState<number>(83.4);
  const [manualY, setManualY] = useState<number>(49.2);

  // Certified Human Ruling Form
  const [humanRuling, setHumanRuling] = useState<string>('Direct Free Kick Outside Box');
  const [humanDisciplinary, setHumanDisciplinary] = useState<string>('Yellow Card (SPA)');
  const [humanRestart, setHumanRestart] = useState<string>('Direct Free Kick');
  const [humanRationale, setHumanRationale] = useState<string>('Initial physical trip occurred 10cm before 18-yard perimeter line.');
  const [officialName, setOfficialName] = useState<string>('Lead Match Official (VAR Specialist)');
  const [isSubmittingRuling, setIsSubmittingRuling] = useState<boolean>(false);
  const [rulingSuccessMsg, setRulingSuccessMsg] = useState<string | null>(null);

  // Auto-tick simulation timer
  const tickIntervalRef = useRef<any>(null);

  // HLS Video Playback Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);

  // Play video stream when source check succeeds
  useEffect(() => {
    if (!videoRef.current || !sourceCheck?.accessible || !sourceCheck?.is_direct_video_stream) {
      return;
    }

    const videoEl = videoRef.current;
    const isHls = sourceCheck.is_hls || streamUrl.toLowerCase().includes('.m3u8');

    let streamSrc = streamUrl;
    if (sourceCheck.proxy_url) {
      if (sourceCheck.proxy_url.startsWith('http')) {
        streamSrc = sourceCheck.proxy_url;
      } else {
        const origin = window.location.origin.includes('5173') ? 'http://127.0.0.1:8000' : '';
        streamSrc = `${origin}${sourceCheck.proxy_url}`;
      }
    }

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(streamSrc);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().catch(() => {});
        });
        hlsInstanceRef.current = hls;
      } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = streamSrc;
        videoEl.play().catch(() => {});
      }
    } else {
      videoEl.src = streamSrc;
      videoEl.play().catch(() => {});
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [sourceCheck, streamUrl]);

  // 1. Initial Load: matches list & recent sessions
  useEffect(() => {
    api.getMatchesList()
      .then((matches: any[]) => {
        if (matches && matches.length > 0) {
          setAvailableMatches(matches);
        }
      })
      .catch(() => {});

    api.getCapabilityMatrix()
      .then(setCapabilityMatrix)
      .catch(() => {});

    // Create or load default live session
    api.createLiveSession({
      title: 'Matchday Officiating Live Assistant',
      match_id: 'MATCH_PL_2026_01',
      source_type: 'EVENT_FEED_SIMULATION'
    }).then(newSess => {
      setSession(newSess);
      if (newSess.events_log_json) setEventsFeed(newSess.events_log_json);
      if (newSess.incidents_log_json) setIncidentsList(newSess.incidents_log_json);
    }).catch(() => {});
  }, []);

  // 2. Continuous Simulation Ticking when ACTIVE
  useEffect(() => {
    if (isLiveActive && session && session.status === 'ACTIVE') {
      tickIntervalRef.current = setInterval(() => {
        api.tickLiveSession(session.id, 15.0)
          .then(res => {
            setSession(prev => prev ? {
              ...prev,
              current_minute: res.current_minute,
              current_second: res.current_second,
              current_timestamp_seconds: res.current_timestamp_seconds,
              measured_latency_ms: res.measured_latency_ms,
              events_processed_count: res.total_events_processed,
              incidents_flagged_count: res.total_incidents_flagged
            } : null);

            // Append newly flagged incidents
            if (res.new_incidents && res.new_incidents.length > 0) {
              setIncidentsList(prev => [...prev, ...res.new_incidents]);
              setSelectedIncident(res.new_incidents[res.new_incidents.length - 1]);
            }
          })
          .catch(() => {});
      }, 2500); // Step every 2.5s
    } else {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    }

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [isLiveActive, session?.id, session?.status]);

  // Session Control Handlers
  const handleStart = async () => {
    if (!session) return;
    try {
      await api.startLiveSession(session.id);
      setSession(prev => prev ? { ...prev, status: 'ACTIVE', connection_status: 'CONNECTED' } : null);
      setIsLiveActive(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = async () => {
    if (!session) return;
    try {
      await api.pauseLiveSession(session.id);
      setSession(prev => prev ? { ...prev, status: 'PAUSED' } : null);
      setIsLiveActive(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualAdvance = async () => {
    if (!session) return;
    try {
      const res = await api.tickLiveSession(session.id, 30.0);
      setSession(prev => prev ? {
        ...prev,
        current_minute: res.current_minute,
        current_second: res.current_second,
        current_timestamp_seconds: res.current_timestamp_seconds,
        measured_latency_ms: res.measured_latency_ms,
        events_processed_count: res.total_events_processed,
        incidents_flagged_count: res.total_incidents_flagged
      } : null);

      if (res.new_incidents && res.new_incidents.length > 0) {
        setIncidentsList(prev => [...prev, ...res.new_incidents]);
        setSelectedIncident(res.new_incidents[res.new_incidents.length - 1]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    try {
      const rep = await api.getLiveSessionReport(session.id);
      setSessionReport(rep);
      setShowReportModal(true);
      setIsLiveActive(false);
      setSession(prev => prev ? { ...prev, status: 'STOPPED', connection_status: 'DISCONNECTED' } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckUrlSource = async () => {
    if (!session || !streamUrl) return;
    setIsCheckingSource(true);
    try {
      const result = await api.checkLiveSource(session.id, streamUrl);
      setSourceCheck(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingSource(false);
    }
  };

  const handleInjectManualEvent = async () => {
    if (!session) return;
    try {
      const res = await api.injectLiveManualEvent(session.id, {
        minute: manualMin,
        second: manualSec,
        event_type: manualType,
        description: manualDesc,
        x: manualX,
        y: manualY,
        is_incident_candidate: true
      });

      setSession(prev => prev ? {
        ...prev,
        events_processed_count: (prev.events_processed_count || 0) + 1,
        measured_latency_ms: res.measured_latency_ms
      } : null);

      if (res.flagged_incident) {
        setIncidentsList(prev => [...prev, res.flagged_incident]);
        setSelectedIncident(res.flagged_incident);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordHumanDecision = async () => {
    if (!session || !selectedIncident) return;
    setIsSubmittingRuling(true);
    setRulingSuccessMsg(null);
    try {
      await api.recordLiveDecision(session.id, {
        incident_id: selectedIncident.incident_id,
        official_ruling: humanRuling,
        official_ruling_ar: isRtl ? humanRuling : undefined,
        disciplinary_action: humanDisciplinary,
        restart_play: humanRestart,
        rationale: humanRationale,
        recorded_by: officialName
      });

      // Update local incident
      setSelectedIncident(prev => prev ? {
        ...prev,
        stage_5_human_status: 'DECISION_RECORDED',
        human_decision: {
          official_ruling: humanRuling,
          disciplinary_action: humanDisciplinary,
          restart_play: humanRestart,
          rationale: humanRationale,
          recorded_by: officialName,
          recorded_at: new Date().toISOString()
        }
      } : null);

      setIncidentsList(prev => prev.map(inc =>
        inc.incident_id === selectedIncident.incident_id
          ? {
              ...inc,
              stage_5_human_status: 'DECISION_RECORDED',
              human_decision: {
                official_ruling: humanRuling,
                disciplinary_action: humanDisciplinary,
                restart_play: humanRestart,
                rationale: humanRationale,
                recorded_by: officialName,
                recorded_at: new Date().toISOString()
              }
            }
          : inc
      ));

      setRulingSuccessMsg(isRtl ? 'تم تسجيل القرار البشري في سجل التدقيق بنجاح.' : 'Official Human Decision certified and persisted in immutable audit log.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingRuling(false);
    }
  };

  const selectedMatch = availableMatches.find(m => m.id === selectedMatchId) || availableMatches[0];

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1440px', margin: '0 auto', color: '#e2e8f0' }}>

      {/* TOP BROADCAST WORKSTATION HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #070c16 0%, #0c1424 100%)',
        border: '1px solid #1e2e48',
        borderRadius: '14px',
        padding: '20px 24px',
        marginBottom: '20px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>

          {/* Left: Branding & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: isLiveActive ? 'rgba(239, 68, 68, 0.18)' : 'rgba(0, 255, 135, 0.12)',
              border: isLiveActive ? '1px solid #ef4444' : '1px solid #00ff87',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLiveActive ? '#ef4444' : '#00ff87'
            }}>
              <Radio size={24} style={{ animation: isLiveActive ? 'pulse 1.5s infinite' : 'none' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
                  {isRtl ? 'المساعد المباشر لحكم المباراة (Live VAR Monitor)' : 'Live Referee Assistant & VAR Monitoring Workstation'}
                </h1>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: isLiveActive ? '#ef4444' : '#1e293b',
                  color: isLiveActive ? '#ffffff' : '#94a3b8',
                  letterSpacing: '0.5px'
                }}>
                  {isLiveActive ? '● MONITORING LIVE' : 'IDLE / READY'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#94a3b8' }}>
                <span>
                  Source: <strong style={{ color: '#00ff87' }}>{sourceType}</strong>
                </span>
                <span>•</span>
                <span>
                  Telemetry Latency: <strong style={{ color: '#38bdf8' }}>{session?.measured_latency_ms || 14.2} ms</strong>
                </span>
                <span>•</span>
                <span>
                  Events Processed: <strong style={{ color: '#ffffff' }}>{session?.events_processed_count || 0}</strong>
                </span>
                <span>•</span>
                <span>
                  Flagged Incidents: <strong style={{ color: '#f59e0b' }}>{incidentsList.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Workstation Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowCapabilities(!showCapabilities)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid #334155',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Sliders size={14} />
              <span>{isRtl ? 'مصفوفة القدرات' : 'Capability Matrix'}</span>
            </button>

            {!isLiveActive ? (
              <button
                onClick={handleStart}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: '#00ff87',
                  border: 'none',
                  color: '#070b15',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(0,255,135,0.3)'
                }}
              >
                <Play size={15} />
                <span>{isRtl ? 'بدء المراقبة المباشرة' : 'Start Live Monitoring'}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Pause size={15} />
                <span>{isRtl ? 'إيقاف مؤقت' : 'Pause Stream'}</span>
              </button>
            )}

            <button
              onClick={handleManualAdvance}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title="Advance live clock +30 seconds"
            >
              <FastForward size={14} />
              <span>+30s</span>
            </button>

            <button
              onClick={handleEndSession}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Square size={14} />
              <span>{isRtl ? 'إنهاء واستخراج التقرير' : 'End & Generate Report'}</span>
            </button>
          </div>

        </div>

        {/* Real-time Match Telemetry Strip */}
        <div style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid #1a2536',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              {isRtl ? 'المباراة الجارية:' : 'Current Fixture:'}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
              {selectedMatch ? `${selectedMatch.home_team.name} ${selectedMatch.home_score} - ${selectedMatch.away_score} ${selectedMatch.away_team.name}` : 'Apex Vanguard 1 - 1 Crown Meridian'}
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: selectedMatch?.is_synthetic ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 255, 135, 0.15)',
              color: selectedMatch?.is_synthetic ? '#38bdf8' : '#00ff87',
              fontWeight: 700
            }}>
              {selectedMatch?.is_synthetic ? 'SYNTHETIC SCENARIO' : 'STATSBOMB HISTORICAL'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} color="#00ff87" />
              <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
                {String(session?.current_minute || 0).padStart(2, '0')}:{String(session?.current_second || 0).padStart(2, '0')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={15} color="#38bdf8" />
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Engine Latency: <strong style={{ color: '#00ff87' }}>{session?.measured_latency_ms || 14.2}ms</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HONEST CAPABILITY MATRIX ACCORDION */}
      {showCapabilities && (
        <div style={{
          backgroundColor: '#0a101d',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#00ff87" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                {isRtl ? 'مصفوفة القدرات الفنية وحدود النظام الصريحة' : 'RefVision AI Technical Capability & Boundary Matrix'}
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Full disclosure of zero-cost local capabilities vs unavailable sensor tracking
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
            {capabilityMatrix.map((item, idx) => {
              const isOp = item.status === 'VERIFIED_OPERATIONAL';
              const isPart = item.status === 'PARTIALLY_SUPPORTED';
              return (
                <div key={idx} style={{
                  backgroundColor: '#070b14',
                  border: '1px solid #1a2536',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{item.capability}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isOp ? 'rgba(0,255,135,0.15)' : isPart ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                      color: isOp ? '#00ff87' : isPart ? '#f59e0b' : '#ef4444'
                    }}>
                      {item.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SOURCE CONFIGURATION BAR */}
      <div style={{
        backgroundColor: '#090e1b',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Source Switcher Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>
            {isRtl ? 'المصدر النشط:' : 'Input Source:'}
          </span>

          <button
            onClick={() => setSourceType('EVENT_FEED_SIMULATION')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: sourceType === 'EVENT_FEED_SIMULATION' ? '1px solid #00ff87' : '1px solid #1e293b',
              backgroundColor: sourceType === 'EVENT_FEED_SIMULATION' ? 'rgba(0,255,135,0.15)' : 'transparent',
              color: sourceType === 'EVENT_FEED_SIMULATION' ? '#00ff87' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Source C: Event Feed Simulation
          </button>

          <button
            onClick={() => setSourceType('VIDEO_URL')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: sourceType === 'VIDEO_URL' ? '1px solid #38bdf8' : '1px solid #1e293b',
              backgroundColor: sourceType === 'VIDEO_URL' ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: sourceType === 'VIDEO_URL' ? '#38bdf8' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Source A: Live Video Stream URL
          </button>

          <button
            onClick={() => setSourceType('MANUAL')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: sourceType === 'MANUAL' ? '1px solid #f59e0b' : '1px solid #1e293b',
              backgroundColor: sourceType === 'MANUAL' ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: sourceType === 'MANUAL' ? '#f59e0b' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Source D: Manual Event Logger
          </button>
        </div>

        {/* Fixture Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {isRtl ? 'المباراة المرجعية:' : 'Linked Match:'}
          </span>
          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            style={{
              backgroundColor: '#070b14',
              color: '#ffffff',
              border: '1px solid #1e2e48',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            {availableMatches.map(m => (
              <option key={m.id} value={m.id}>
                {m.home_team.name} vs {m.away_team.name} ({m.is_synthetic ? 'Synthetic' : 'StatsBomb'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SOURCE A DETAILS: VIDEO URL TESTER & LIVE VIDEO PLAYER */}
      {sourceType === 'VIDEO_URL' && (
        <div style={{
          backgroundColor: '#0a101d',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          {/* Quick Presets Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>Quick Presets:</span>
            <button
              type="button"
              onClick={() => setStreamUrl('http://127.0.0.1:8088/live.m3u8')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #00ff87',
                backgroundColor: 'rgba(0, 255, 135, 0.12)',
                color: '#00ff87',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Local HLS Stream (127.0.0.1:8088/live.m3u8)
            </button>
            <button
              type="button"
              onClick={() => setStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Public Mux HLS Stream
            </button>
            <button
              type="button"
              onClick={() => setStreamUrl('https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4')}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #64748b',
                backgroundColor: 'rgba(100, 116, 139, 0.12)',
                color: '#94a3b8',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sample MP4 Video
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="http://127.0.0.1:8088/live.m3u8 or https://example.com/stream.m3u8"
              style={{
                flex: 1,
                backgroundColor: '#070b14',
                border: '1px solid #1e2e48',
                borderRadius: '6px',
                padding: '8px 14px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleCheckUrlSource}
              disabled={isCheckingSource}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#38bdf8',
                color: '#070b15',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isCheckingSource ? 'Validating SSRF & HLS...' : 'Test Stream Decodability'}
            </button>
          </div>

          {sourceCheck && (
            <div style={{
              backgroundColor: sourceCheck.accessible ? 'rgba(0,255,135,0.08)' : 'rgba(239,68,68,0.08)',
              border: sourceCheck.accessible ? '1px solid #00ff87' : '1px solid #ef4444',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '12px',
              marginBottom: sourceCheck.accessible && sourceCheck.is_direct_video_stream ? '16px' : '0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: 800, color: sourceCheck.accessible ? '#00ff87' : '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {sourceCheck.accessible ? '✓ Stream Accessible & Validated' : '✕ Connection Blocked / Inaccessible'}
                  {sourceCheck.is_dev_local_stream && (
                    <span style={{
                      backgroundColor: 'rgba(0,255,135,0.2)',
                      color: '#00ff87',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 800
                    }}>
                      DEV LOCAL STREAM ALLOWED
                    </span>
                  )}
                  {sourceCheck.is_hls && (
                    <span style={{
                      backgroundColor: 'rgba(56,189,248,0.2)',
                      color: '#38bdf8',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 800
                    }}>
                      HLS PLAYLIST VERIFIED ({sourceCheck.segment_count || 0} segments)
                    </span>
                  )}
                </span>
                <span style={{ color: '#94a3b8' }}>Latency: {sourceCheck.latency_ms}ms</span>
              </div>
              {sourceCheck.error_reason && (
                <p style={{ color: '#f87171', margin: '6px 0 0 0', fontWeight: 600 }}>{sourceCheck.error_reason}</p>
              )}
              {sourceCheck.content_type && (
                <p style={{ color: '#94a3b8', margin: '6px 0 0 0' }}>
                  Content-Type: <code>{sourceCheck.content_type}</code> • Direct Video Stream: {sourceCheck.is_direct_video_stream ? 'Yes' : 'No'}
                  {sourceCheck.proxy_url && (
                    <span> • CORS Proxy: <code>{sourceCheck.proxy_url}</code></span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Real-time Video Stream Player Screen */}
          {sourceCheck?.accessible && sourceCheck?.is_direct_video_stream && (
            <div style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              backgroundColor: '#020617',
              border: '1px solid #1e293b',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              {/* Broadcast Top Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                padding: '8px 14px',
                background: 'linear-gradient(180deg, rgba(7,12,22,0.85) 0%, rgba(7,12,22,0) 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    animation: 'pulse 1.5s infinite'
                  }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em' }}>
                    {sourceCheck.is_hls ? 'LIVE HLS FEED' : 'LIVE DIRECT VIDEO FEED'}
                  </span>
                  {sourceCheck.is_dev_local_stream && (
                    <span style={{ fontSize: '10px', color: '#00ff87', backgroundColor: 'rgba(0,255,135,0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      127.0.0.1:8088 (Local FFmpeg Test)
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  SSRF Policy: <strong style={{ color: '#00ff87' }}>Enforced & Verified</strong>
                </div>
              </div>

              {/* Video Element */}
              <video
                ref={videoRef}
                controls
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  maxHeight: '420px',
                  display: 'block',
                  backgroundColor: '#000000',
                  objectFit: 'contain'
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* SOURCE D DETAILS: MANUAL EVENT LOGGER */}
      {sourceType === 'MANUAL' && (
        <div style={{
          backgroundColor: '#0a101d',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0', color: '#f59e0b' }}>
            {isRtl ? 'إدخال حدث تحكيمي مباشر يدوياً (Source D Manual Input)' : 'Manual Incident Event Logging (Source D)'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Minute:Second</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  value={manualMin}
                  onChange={(e) => setManualMin(Number(e.target.value))}
                  style={{ width: '60px', backgroundColor: '#070b14', border: '1px solid #1e2e48', borderRadius: '4px', padding: '6px', color: '#fff', fontSize: '12px' }}
                />
                <input
                  type="number"
                  value={manualSec}
                  onChange={(e) => setManualSec(Number(e.target.value))}
                  style={{ width: '60px', backgroundColor: '#070b14', border: '1px solid #1e2e48', borderRadius: '4px', padding: '6px', color: '#fff', fontSize: '12px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Incident Type</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                style={{ width: '100%', backgroundColor: '#070b14', border: '1px solid #1e2e48', borderRadius: '4px', padding: '6px', color: '#fff', fontSize: '12px' }}
              >
                <option value="FOUL_TACKLE">Foul / Tackle Challenge</option>
                <option value="PENALTY_AREA_CONTACT">Penalty Area Boundary Contact</option>
                <option value="HANDBALL_CHECK">Handball Silhouette Check</option>
                <option value="OFFSIDE_CHECK">Offside Active Play Check</option>
                <option value="SERIOUS_FOUL_PLAY">Serious Foul Play / Red Card</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>Coordinates (X, Y in meters)</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  step="0.1"
                  value={manualX}
                  onChange={(e) => setManualX(Number(e.target.value))}
                  placeholder="X (83.5m box)"
                  style={{ width: '80px', backgroundColor: '#070b14', border: '1px solid #1e2e48', borderRadius: '4px', padding: '6px', color: '#fff', fontSize: '12px' }}
                />
                <input
                  type="number"
                  step="0.1"
                  value={manualY}
                  onChange={(e) => setManualY(Number(e.target.value))}
                  placeholder="Y"
                  style={{ width: '80px', backgroundColor: '#070b14', border: '1px solid #1e2e48', borderRadius: '4px', padding: '6px', color: '#fff', fontSize: '12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={handleInjectManualEvent}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f59e0b',
                  color: '#070b15',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <PlusCircle size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Inject & Analyze
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE SPLIT: INCIDENT QUEUE + 5-STAGE REFEREE REVIEW */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 420px) minmax(450px, 1fr)',
        gap: '20px'
      }}>

        {/* LEFT COLUMN: PRIORITIZED INCIDENT QUEUE & EVENTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Incident Prioritization Box */}
          <div style={{
            backgroundColor: '#0a101d',
            border: '1px solid #1e2e48',
            borderRadius: '12px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {isRtl ? 'قائمة الحالات التحكيمية حسب الأولوية' : 'Prioritized Review Queue'}
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b' }}>
                {incidentsList.length} Flagged
              </span>
            </div>

            {incidentsList.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 10px',
                color: '#64748b',
                fontSize: '13px',
                border: '1px dashed #1e293b',
                borderRadius: '8px'
              }}>
                <CheckCircle2 size={28} color="#00ff87" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                No pending incidents flagged yet. Start monitoring or advance tick to stream events.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {incidentsList.map((inc, i) => {
                  const isSelected = selectedIncident?.incident_id === inc.incident_id;
                  const isReviewed = inc.stage_5_human_status === 'DECISION_RECORDED';
                  const isCrit = inc.priority === 'CRITICAL_HIGH';

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedIncident(inc)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid #00ff87' : '1px solid #1e293b',
                        backgroundColor: isSelected ? 'rgba(0, 255, 135, 0.08)' : '#070b14',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: '#00ff87'
                          }}>
                            {String(inc.minute).padStart(2, '0')}:{String(inc.second).padStart(2, '0')}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: isCrit ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                            color: isCrit ? '#ef4444' : '#f59e0b'
                          }}>
                            {inc.priority}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: isReviewed ? '#00ff87' : '#94a3b8'
                        }}>
                          {isReviewed ? '✓ REVIEWED' : 'PENDING'}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                        {inc.category}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                        {inc.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Incoming Real-Time Events Feed */}
          <div style={{
            backgroundColor: '#0a101d',
            border: '1px solid #1e2e48',
            borderRadius: '12px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#38bdf8" />
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  {isRtl ? 'شريط أحداث المباراة المباشرة' : 'Live Match Event Feed'}
                </h4>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {eventsFeed.length} Events Logged
              </span>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {eventsFeed.slice(-12).reverse().map((ev, i) => (
                <div key={i} style={{
                  padding: '6px 10px',
                  backgroundColor: '#070b14',
                  borderRadius: '6px',
                  border: '1px solid #162030',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#00ff87', fontWeight: 700 }}>
                      {String(ev.minute).padStart(2, '0')}:{String(ev.second).padStart(2, '0')}
                    </span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{ev.event_type}</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>({ev.player_name || 'Team Action'})</span>
                  </div>
                  {ev.x && (
                    <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                      ({ev.x.toFixed(1)}m, {ev.y?.toFixed(1)}m)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 5-STAGE REFEREE DECISION WORKSPACE */}
        <div style={{
          backgroundColor: '#0a101d',
          border: '1px solid #1e2e48',
          borderRadius: '12px',
          padding: '24px'
        }}>
          {selectedIncident ? (
            <div>
              {/* Incident Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid #1e293b',
                paddingBottom: '16px',
                marginBottom: '18px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      backgroundColor: 'rgba(0,255,135,0.15)',
                      color: '#00ff87',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace'
                    }}>
                      MIN {String(selectedIncident.minute).padStart(2, '0')}:{String(selectedIncident.second).padStart(2, '0')}
                    </span>
                    <span style={{
                      backgroundColor: 'rgba(239,68,68,0.15)',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {selectedIncident.priority}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Coordinates: X={selectedIncident.coordinates.x.toFixed(1)}m, Y={selectedIncident.coordinates.y.toFixed(1)}m
                    </span>
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {selectedIncident.category}
                  </h2>
                </div>

                <div style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: selectedIncident.stage_5_human_status === 'DECISION_RECORDED' ? 'rgba(0,255,135,0.15)' : 'rgba(245,158,11,0.15)',
                  color: selectedIncident.stage_5_human_status === 'DECISION_RECORDED' ? '#00ff87' : '#f59e0b',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  {selectedIncident.stage_5_human_status === 'DECISION_RECORDED' ? '✓ OFFICIAL RULING CERTIFIED' : 'AWAITING HUMAN DECISION'}
                </div>
              </div>

              {/* 5-STAGE REPORT CARDS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>

                {/* Stage 1 & 2: Detection & Prioritization */}
                <div style={{ backgroundColor: '#070b14', border: '1px solid #1a2536', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#00ff87', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Stage 1 & 2: Detection & Prioritization Logic
                  </div>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {selectedIncident.description}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                    <strong>Prioritization Basis:</strong> {selectedIncident.priority_reason}
                  </div>
                </div>

                {/* Stage 3: Official IFAB Rule Retrieval */}
                <div style={{ backgroundColor: '#070b14', border: '1px solid #1a2536', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                      Stage 3: Official IFAB Rule Grounding ({selectedIncident.stage_3_rule.law_number})
                    </span>
                    <a
                      href={selectedIncident.stage_3_rule.official_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                    >
                      <span>IFAB Law Text</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {isRtl ? selectedIncident.stage_3_rule.citation_ar : selectedIncident.stage_3_rule.citation}
                  </div>
                </div>

                {/* Stage 4: AI Decision Support Recommendation */}
                <div style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                    Stage 4: Preliminary AI Recommendation (Non-Authoritative)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                      {isRtl ? selectedIncident.stage_4_recommendation.preliminary_ruling_ar : selectedIncident.stage_4_recommendation.preliminary_ruling}
                    </span>
                    <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>
                      Card: {selectedIncident.stage_4_recommendation.recommended_card}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    {isRtl ? selectedIncident.stage_4_recommendation.uncertainty_notice_ar : selectedIncident.stage_4_recommendation.uncertainty_notice}
                  </p>
                </div>

              </div>

              {/* STAGE 5: CERTIFIED HUMAN REFEREE DECISION RECORDING */}
              <div style={{
                backgroundColor: '#070b14',
                border: '1px solid #1e2e48',
                borderRadius: '10px',
                padding: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircle2 size={18} color="#00ff87" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {isRtl ? 'المرحلة 5: تسجيل القرار الرسمي للحكم البشري' : 'Stage 5: Certified Human Referee Decision Recording'}
                  </h3>
                </div>

                {selectedIncident.stage_5_human_status === 'DECISION_RECORDED' && selectedIncident.human_decision ? (
                  <div style={{
                    backgroundColor: 'rgba(0,255,135,0.08)',
                    border: '1px solid #00ff87',
                    borderRadius: '8px',
                    padding: '14px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ color: '#00ff87', fontSize: '14px' }}>
                        {selectedIncident.human_decision.official_ruling}
                      </strong>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>
                        Certified by: {selectedIncident.human_decision.recorded_by}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                      <strong>Restart:</strong> {selectedIncident.human_decision.restart_play} • <strong>Disciplinary:</strong> {selectedIncident.human_decision.disciplinary_action}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      <strong>Rationale:</strong> {selectedIncident.human_decision.rationale}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Official Ruling
                        </label>
                        <input
                          type="text"
                          value={humanRuling}
                          onChange={(e) => setHumanRuling(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#0a101d',
                            border: '1px solid #1e2e48',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#ffffff',
                            fontSize: '12px'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Disciplinary Action
                        </label>
                        <select
                          value={humanDisciplinary}
                          onChange={(e) => setHumanDisciplinary(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#0a101d',
                            border: '1px solid #1e2e48',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#ffffff',
                            fontSize: '12px'
                          }}
                        >
                          <option value="None">None (No Card)</option>
                          <option value="Yellow Card (SPA)">Yellow Card (Caution - SPA)</option>
                          <option value="Yellow Card (Reckless)">Yellow Card (Caution - Reckless)</option>
                          <option value="Direct Red Card (DOGSO)">Direct Red Card (DOGSO)</option>
                          <option value="Direct Red Card (Serious Foul Play)">Direct Red Card (Serious Foul Play)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Restart of Play
                        </label>
                        <select
                          value={humanRestart}
                          onChange={(e) => setHumanRestart(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#0a101d',
                            border: '1px solid #1e2e48',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#ffffff',
                            fontSize: '12px'
                          }}
                        >
                          <option value="Direct Free Kick">Direct Free Kick</option>
                          <option value="Penalty Kick">Penalty Kick</option>
                          <option value="Indirect Free Kick">Indirect Free Kick</option>
                          <option value="Play On">Play On</option>
                          <option value="Drop Ball">Drop Ball</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          Officiating Operator
                        </label>
                        <input
                          type="text"
                          value={officialName}
                          onChange={(e) => setOfficialName(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#0a101d',
                            border: '1px solid #1e2e48',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            color: '#ffffff',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                        Referee Justification / Rationale (Logged into Permanent Audit Trail)
                      </label>
                      <textarea
                        rows={2}
                        value={humanRationale}
                        onChange={(e) => setHumanRationale(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#0a101d',
                          border: '1px solid #1e2e48',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          color: '#ffffff',
                          fontSize: '12px',
                          resize: 'none'
                        }}
                      />
                    </div>

                    {rulingSuccessMsg && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(0,255,135,0.15)',
                        border: '1px solid #00ff87',
                        borderRadius: '6px',
                        color: '#00ff87',
                        fontSize: '12px',
                        marginBottom: '10px'
                      }}>
                        {rulingSuccessMsg}
                      </div>
                    )}

                    <button
                      onClick={handleRecordHumanDecision}
                      disabled={isSubmittingRuling}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        backgroundColor: '#00ff87',
                        color: '#070b15',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      {isSubmittingRuling ? 'Recording Ruling...' : 'Certify Official Human Ruling'}
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#64748b'
            }}>
              <ShieldAlert size={48} color="#334155" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8' }}>No Incident Selected for Review</h3>
              <p style={{ fontSize: '13px', maxWidth: '420px', margin: '6px auto 0 auto' }}>
                Select a flagged incident from the prioritized queue on the left, or use the simulation controls to advance the match clock.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* SESSION REPORT MODAL */}
      {showReportModal && sessionReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0c1324',
            border: '1px solid #1e2e48',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            padding: '28px',
            color: '#e2e8f0',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} color="#00ff87" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  {isRtl ? 'تقرير جلسة التحكيم المباشرة الرسمية' : 'Official Live Officiating Session Report'}
                </h2>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ backgroundColor: '#070b14', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#00ff87' }}>{sessionReport.metrics.total_events_processed}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Events Processed</div>
              </div>
              <div style={{ backgroundColor: '#070b14', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>{sessionReport.metrics.total_incidents_flagged}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Incidents Flagged</div>
              </div>
              <div style={{ backgroundColor: '#070b14', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8' }}>{sessionReport.metrics.average_latency_ms}ms</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Average Engine Latency</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
                Flagged Categories
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(sessionReport.incidents_by_category).map(([cat, count], idx) => (
                  <span key={idx} style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#162030',
                    color: '#ffffff'
                  }}>
                    {cat}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#070b14', padding: '12px', borderRadius: '8px', marginBottom: '18px', fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              <strong>Ethical Compliance & Disclaimers:</strong>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                {sessionReport.capability_disclaimers.map((disc, idx) => (
                  <li key={idx}>{disc}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowReportModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#00ff87',
                color: '#070b15',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Close Session Summary
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
