import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import {
  Shield, Eye, Flame, Activity, CheckCircle2, ChevronRight, Cpu,
  Video, Scale, Play, Award, Calendar, Database, AlertTriangle
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
  onSeek: (minute: number) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSeek }) => {
  const { t, isRtl } = useLanguage();
  const [matches, setMatches] = useState<any[]>([]);
  const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [mList, status] = await Promise.all([
          api.getMatchesList().catch(() => []),
          api.getSystemStatus().catch(() => null)
        ]);
        if (mList && mList.length > 0) setMatches(mList);
        if (status) setSystemStats(status);

        // Fetch recent incidents
        const incs = await api.getIncidents().catch(() => []);
        if (incs && incs.length > 0) setRecentIncidents(incs.slice(0, 3));
      } catch (e) {
        console.error('Failed to load home page data:', e);
      }
    }
    loadHomeData();
  }, []);

  return (
    <div style={{ padding: '32px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Hero Banner with Broadcast Styling */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 27, 46, 0.95) 0%, rgba(6, 11, 20, 0.98) 100%)',
        border: '1px solid #1e2e45',
        borderRadius: '16px',
        padding: '48px 40px',
        marginBottom: '36px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ maxWidth: '880px', position: 'relative', zIndex: 2 }}>
          {/* Tagline Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(0, 255, 135, 0.1)',
            border: '1px solid rgba(0, 255, 135, 0.3)',
            borderRadius: '20px',
            padding: '4px 14px',
            fontSize: '12px',
            color: '#00FF87',
            fontWeight: 700,
            marginBottom: '18px'
          }}>
            <Cpu size={14} />
            <span>Microsoft Premier League "Inside the Game" Hackathon 2026</span>
          </div>

          <h1 style={{
            fontSize: '44px',
            fontWeight: 900,
            lineHeight: 1.15,
            color: '#FFFFFF',
            margin: '0 0 16px 0',
            letterSpacing: '-1px'
          }}>
            {t.brandName}: <span style={{ color: '#00FF87' }}>{t.tagline}</span>
          </h1>

          <p style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#94a3b8',
            margin: '0 0 28px 0',
            maxWidth: '780px'
          }}>
            {isRtl
              ? 'منصة ذكاء اصطناعي متكاملة تجمع بين دعم قرارات التحكيم، واستخراج الأدلة المكانية من مقاطع الفيديو، وشروحات قرارات الـ VAR الموثقة بقوانين الإيفاب، وألعاب توقعات المشجعين التفاعلية. الحكم البشري يحتفظ دائماً بالصلاحية الرسمية والنهائية.'
              : 'The comprehensive football intelligence platform combining video-based VAR decision-support, real match event analytics, IFAB law retrieval, and fan engagement challenges. Human referees retain final, exclusive legal authority.'}
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onNavigate('match')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#00FF87',
                color: '#050a14',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 28px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 255, 135, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Eye size={18} />
              <span>{isRtl ? 'فتح مركز المباراة التفاعلي' : 'Open Match Centre'}</span>
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => onNavigate('video-analysis')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                padding: '14px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Video size={18} />
              <span>{isRtl ? 'تحليل مقطع فيديو تحكيمي' : 'Analyze a Video Clip'}</span>
            </button>

            <button
              onClick={() => {
                onSeek(68);
                onNavigate('referee');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#162235',
                color: '#e2e8f0',
                border: '1px solid #253954',
                borderRadius: '8px',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Shield size={18} color="#00FF87" />
              <span>{isRtl ? 'غرفة التحكيم (68\' VAR)' : 'VAR Workspace (Anchor Demo)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* REAL MATCH SELECTION & DATASET CARDS */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {isRtl ? 'المباريات المتاحة في قاعدة البيانات' : 'Available Match Workspaces (Real Data vs Synthetic Demo)'}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
              {isRtl
                ? 'فصل واضح وشفاف بين سيناريو المحاكاة التوضيحي والمباريات التاريخية الحقيقية'
                : 'Clear separation between synthetic hackathon simulation and verified historical open data'}
            </p>
          </div>
          <button
            onClick={() => onNavigate('transparency')}
            style={{
              backgroundColor: '#162235',
              border: '1px solid #253954',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Database size={13} />
            <span>Data Transparency</span>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          {/* Card 1: Synthetic Demo Match */}
          <div style={{
            backgroundColor: '#0c121d',
            border: '1px solid #1e2e45',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  backgroundColor: 'rgba(0, 255, 135, 0.15)',
                  border: '1px solid #00FF87',
                  color: '#00FF87',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  ★ SYNTHETIC HACKATHON DEMO
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Premier League Simulation</span>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                Apex Vanguard FC vs Crown Meridian FC
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Live deterministic simulation featuring 18 scripted anchors, dynamic momentum flow, and the anchor Minute 68 VAR penalty review.
              </p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#cbd5e1', marginBottom: '16px' }}>
                <div>Status: <strong style={{ color: '#00FF87' }}>LIVE / SCRUBBABLE</strong></div>
                <div>Events: <strong style={{ color: '#FFFFFF' }}>460+ Events</strong></div>
                <div>Incidents: <strong style={{ color: '#ff0055' }}>1 Key VAR Check</strong></div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('match')}
              style={{
                width: '100%',
                backgroundColor: '#162b20',
                border: '1px solid #00FF87',
                color: '#00FF87',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{isRtl ? 'استعراض في مركز المباراة' : 'Open in Match Centre'}</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Card 2: Historical StatsBomb Match */}
          <div style={{
            backgroundColor: '#0c121d',
            border: '1px solid #1e2e45',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid #38bdf8',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  HISTORICAL MATCH (StatsBomb Open Data)
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>World Cup 2022 Final</span>
              </div>

              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0' }}>
                Argentina (3) vs France (3) [AET]
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Real event stream from StatsBomb open data (Match #3869685). Full 4,400+ coordinates, lineups, shot outcomes, and the 22nd minute penalty foul.
              </p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#cbd5e1', marginBottom: '16px' }}>
                <div>Date: <strong style={{ color: '#FFFFFF' }}>2022-12-18</strong></div>
                <div>Events: <strong style={{ color: '#FFFFFF' }}>4,465 Events</strong></div>
                <div>Players: <strong style={{ color: '#38bdf8' }}>50 Lineup Players</strong></div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('match')}
              style={{
                width: '100%',
                backgroundColor: '#111d2e',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{isRtl ? 'فحص بيانات المباراة التاريخية' : 'Inspect Historical Match Data'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 CORE CAPABILITIES WORKSPACES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Capability 1: Match Centre */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 255, 135, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Eye size={22} color="#00FF87" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Interactive Tactical Match Centre
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Scalable SVG football pitch with coordinate normalization, chronological timeline scrubbing, and calculated stats directly derived from event logs.
            </p>
          </div>
          <button
            onClick={() => onNavigate('match')}
            style={{
              marginTop: '16px',
              backgroundColor: '#162235',
              border: '1px solid #253954',
              color: '#00FF87',
              borderRadius: '6px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Open Match Centre</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Capability 2: Video Analysis (NEW) */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Video size={22} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Video Referee Analysis (OpenCV)
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Upload match clips for local frame extraction, motion dynamics, IFAB rule citations, and human official decision recording with zero external API costs.
            </p>
          </div>
          <button
            onClick={() => onNavigate('video-analysis')}
            style={{
              marginTop: '16px',
              backgroundColor: '#162235',
              border: '1px solid #253954',
              color: '#38bdf8',
              borderRadius: '6px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Upload & Analyze Video</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Capability 3: Decision Explainer */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Scale size={22} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Why Was This Decision Made?
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              Evidence-first explanations across Fan Mode, Analyst Mode, and Broadcast Mode, grounded in IFAB rules with explicit uncertainty reporting.
            </p>
          </div>
          <button
            onClick={() => onNavigate('explainer')}
            style={{
              marginTop: '16px',
              backgroundColor: '#162235',
              border: '1px solid #253954',
              color: '#f59e0b',
              borderRadius: '6px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Inspect Decision Explainer</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Capability 4: Fan Arena */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 215, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Flame size={22} color="#FFD700" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px 0' }}>
              Fan Arena & Prediction Games
            </h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#94a3b8', margin: 0 }}>
              5 authentic football prediction games (Next Touch, First Card, Spot the Rule, Match Minute, Tactician) resolved strictly against verified events.
            </p>
          </div>
          <button
            onClick={() => onNavigate('fan')}
            style={{
              marginTop: '16px',
              backgroundColor: '#162235',
              border: '1px solid #253954',
              color: '#FFD700',
              borderRadius: '6px',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Enter Fan Arena</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* RESPONSIBLE AI & REFEREE AUTHORITY COMMITMENT */}
      <div style={{
        backgroundColor: '#070b14',
        border: '1px solid #1e2e45',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <Shield size={24} color="#00FF87" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
            {isRtl ? 'ميثاق الذكاء الاصطناعي المسؤول وسلطة التحكيم الرسمية' : 'Responsible AI Architecture & Human Referee Primacy'}
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: '1.6' }}>
            {isRtl
              ? 'تلتزم منصة RefVision AI بالمعايير الأخلاقية الصارمة: الذكاء الاصطناعي يقدم بيانات استشارية مساعدة ومصادر قانونية موثقة من الإيفاب، ولا يدعي مطلقاً سلطة قانونية نهائية. يحتفظ الحكم البشري المعتمد بكامل الصلاحية الحصرية لاتخاذ القرارات.'
              : 'RefVision AI is engineered for decision-support and fan education. The system computes spatial telemetry, samples video frames, and retrieves applicable IFAB laws without ever claiming official authority to overturn match results. The on-field human referee remains the supreme authority in football.'}
          </p>
        </div>
      </div>
    </div>
  );
};
