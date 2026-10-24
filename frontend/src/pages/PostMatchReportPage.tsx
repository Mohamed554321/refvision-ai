import React, { useEffect, useState } from 'react';
import { Match, Incident, FanUserProfile } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { FileText, Shield, CheckCircle, Clock, Trophy, Award } from 'lucide-react';

interface PostMatchReportPageProps {
  match: Match;
  incidents: Incident[];
  profile: FanUserProfile;
}

export const PostMatchReportPage: React.FC<PostMatchReportPageProps> = ({
  match,
  incidents,
  profile
}) => {
  const { t, isRtl } = useLanguage();
  const [auditLog, setAuditLog] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLog().then(setAuditLog).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '28px 20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            backgroundColor: 'rgba(0, 255, 135, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} color="#00FF87" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            {t.reportTitle}
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 44px' }}>
          {t.reportSubtitle}
        </p>
      </div>

      {/* Final Match Score Summary Banner */}
      <div style={{
        backgroundColor: '#0c1324',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '28px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '12px', color: '#00FF87', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
          {isRtl ? 'تقرير نتيجة المباراة الرسمية' : 'OFFICIAL MATCH REPORT'}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            {isRtl ? match.home_team.name_ar : match.home_team.name}
          </div>

          <div style={{
            backgroundColor: '#070b16',
            border: '2px solid #00FF87',
            borderRadius: '10px',
            padding: '8px 24px',
            fontSize: '32px',
            fontWeight: 900,
            color: '#FFFFFF'
          }}>
            {match.home_score} - {match.away_score}
          </div>

          <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>
            {isRtl ? match.away_team.name_ar : match.away_team.name}
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
          {isRtl ? match.stadium_name_ar : match.stadium_name} • Referee: {isRtl ? match.referee_name_ar : match.referee_name} • VAR: {isRtl ? match.var_official_name_ar : match.var_official_name}
        </div>
      </div>

      {/* Incidents Reviewed Recap */}
      <div style={{
        backgroundColor: '#0c1324',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Shield size={18} color="#00FF87" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            {isRtl ? 'سجل الحالات التحكيمية المراجعة في المباراة' : 'Officiating Incidents Review Summary'} ({incidents.length})
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {incidents.map((inc) => (
            <div
              key={inc.incident_id}
              style={{
                backgroundColor: '#070b16',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '14px 18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#00FF87' }}>
                    {inc.minute}:{String(inc.second).padStart(2, '0')}'
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                    {inc.incident_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(0, 255, 135, 0.15)',
                  color: '#00FF87',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}>
                  {inc.review_status}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#FFFFFF' }}>Ruling: </span>
                <span>{inc.recorded_decision?.official_ruling || 'Pending human referee ruling'}</span>
              </div>

              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {inc.recorded_decision?.rationale || inc.preliminary_assessment}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public Decision Audit Trail */}
      <div style={{
        backgroundColor: '#0c1324',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock size={18} color="#38bdf8" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
            {t.auditLogTitle} ({auditLog.length})
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {auditLog.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Audit events are being logged in real time.</div>
          ) : (
            auditLog.map((aud) => (
              <div
                key={aud.audit_id}
                style={{
                  backgroundColor: '#070b16',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {aud.audit_id}
                  </span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{aud.action}</span>
                  <span style={{ color: '#94a3b8' }}>({aud.actor_type})</span>
                  <span style={{ color: '#cbd5e1' }}>— {aud.description}</span>
                </div>

                <span style={{ color: '#64748b', fontSize: '11px' }}>
                  {Math.floor(aud.timestamp_seconds / 60)}:{String(Math.floor(aud.timestamp_seconds % 60)).padStart(2, '0')}'
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
