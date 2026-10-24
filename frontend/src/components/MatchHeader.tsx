import React from 'react';
import { Match } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';
import { Play, Pause, RotateCcw, FastForward, Clock } from 'lucide-react';

interface MatchHeaderProps {
  match: Match;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdvance: (seconds: number) => void;
  onSeek: (minute: number) => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  match,
  onPlay,
  onPause,
  onReset,
  onAdvance,
  onSeek
}) => {
  const { t, isRtl } = useLanguage();

  const isLive = match.status === 'LIVE';

  return (
    <div style={{
      backgroundColor: '#0c1324',
      borderBottom: '1px solid #1e293b',
      padding: '16px 20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        {/* Teams and Score Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: '1 1 340px' }}>
          {/* Home Team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: isRtl ? 'left' : 'right' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                {isRtl ? match.home_team.name_ar : match.home_team.name}
              </div>
              <div style={{ fontSize: '11px', color: '#00FF87', fontWeight: 600 }}>HOME • {match.home_team.short_code}</div>
            </div>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: match.home_team.primary_color,
              border: '2px solid #FFFFFF'
            }} />
          </div>

          {/* Score Badge */}
          <div style={{
            backgroundColor: '#060a12',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '6px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '90px'
          }}>
            <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '2px', color: '#FFFFFF', lineHeight: 1 }}>
              {match.home_score} - {match.away_score}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isLive ? '#00FF87' : '#94a3b8'
              }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: isLive ? '#00FF87' : '#94a3b8' }}>
                {match.current_minute}:{String(match.current_second).padStart(2, '0')}'
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: match.away_team.primary_color,
              border: '2px solid #FFFFFF'
            }} />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                {isRtl ? match.away_team.name_ar : match.away_team.name}
              </div>
              <div style={{ fontSize: '11px', color: '#3A86FF', fontWeight: 600 }}>AWAY • {match.away_team.short_code}</div>
            </div>
          </div>
        </div>

        {/* Stadium & Referee Info */}
        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>{isRtl ? 'الملعب: ' : 'Venue: '}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{isRtl ? match.stadium_name_ar : match.stadium_name}</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>{isRtl ? 'الحكم الرئيسي: ' : 'Referee: '}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{isRtl ? match.referee_name_ar : match.referee_name}</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span style={{ color: '#94a3b8' }}>VAR: </span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{isRtl ? match.var_official_name_ar : match.var_official_name}</span>
          </div>
        </div>

        {/* Controls Engine */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#070b16',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '8px 12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isLive ? (
              <button
                onClick={onPause}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#e11d48',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '12px'
                }}
              >
                <Pause size={14} />
                <span>{t.btnPause}</span>
              </button>
            ) : (
              <button
                onClick={onPlay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#00FF87',
                  color: '#070b15',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px'
                }}
              >
                <Play size={14} />
                <span>{t.btnStart}</span>
              </button>
            )}

            <button
              onClick={() => onAdvance(15)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #334155',
                borderRadius: '5px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '12px'
              }}
            >
              <FastForward size={14} />
              <span>{t.btnStep15s}</span>
            </button>

            <button
              onClick={onReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: '5px',
                padding: '6px 8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title={t.btnReset}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Quick Jump Anchors */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Jump:</span>
            <button
              onClick={() => onSeek(0)}
              style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}
            >
              0'
            </button>
            <button
              onClick={() => onSeek(28)}
              style={{ background: '#1e293b', border: 'none', color: '#00FF87', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
            >
              28' ⚽
            </button>
            <button
              onClick={() => onSeek(56)}
              style={{ background: '#1e293b', border: 'none', color: '#3A86FF', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
            >
              56' ⚽
            </button>
            <button
              onClick={() => onSeek(68)}
              style={{ background: 'rgba(255, 0, 85, 0.25)', border: '1px solid #ff0055', color: '#ff4d8d', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', fontWeight: 700 }}
              title="Anchor Demo Incident (68' Penalty Review)"
            >
              68' VAR 🔥
            </button>
            <button
              onClick={() => onSeek(90)}
              style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}
            >
              90'
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
