import React, { useState } from 'react';
import { Incident, CameraEvidence } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';
import { Pitch2D } from '../components/Pitch2D';
import {
  Shield, Video, CheckCircle, AlertTriangle, Scale, Eye,
  Clock, FileText, Send, UserCheck, Layers, ChevronRight
} from 'lucide-react';

interface RefereeIntelligencePageProps {
  incidents: Incident[];
  selectedIncidentId?: string;
  onSelectIncident: (id: string) => void;
  onRecordDecision: (payload: {
    incident_id: string;
    official_ruling: string;
    official_ruling_ar: string;
    disciplinary_action: string;
    restart_play: string;
    rationale: string;
    rationale_ar: string;
    recorded_by?: string;
  }) => Promise<void>;
  onGenerateExplanation: (incidentId: string) => Promise<void>;
  onNavigateToExplainer: (incidentId: string) => void;
}

export const RefereeIntelligencePage: React.FC<RefereeIntelligencePageProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onRecordDecision,
  onGenerateExplanation,
  onNavigateToExplainer
}) => {
  const { t, isRtl } = useLanguage();

  const activeIncident = incidents.find(i => (i.incident_id === selectedIncidentId) || ((i as any).id === selectedIncidentId)) || incidents[0];
  const [selectedCameraId, setSelectedCameraId] = useState<string>(() => {
    return activeIncident?.evidence_items?.find(e => e.is_recommended)?.camera_id || 'CAM_18YD_LEFT';
  });

  // Decision Form State
  const [ruling, setRuling] = useState(activeIncident?.recorded_decision?.official_ruling || (activeIncident as any)?.human_ruling || 'Direct Free Kick Outside Box');
  const [disciplinary, setDisciplinary] = useState(activeIncident?.recorded_decision?.disciplinary_action || (activeIncident as any)?.disciplinary_action || 'Yellow Card (SPA)');
  const [restart, setRestart] = useState(activeIncident?.recorded_decision?.restart_play || (activeIncident as any)?.restart_play || 'Direct Free Kick');
  const [rationale, setRationale] = useState(
    activeIncident?.recorded_decision?.rationale ||
    (activeIncident as any)?.rationale ||
    'Review confirmed primary physical contact initiated at X=83.6m (10cm outside penalty box demarcation line). Challenge stopped a promising attack with no legitimate ball contact.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!activeIncident) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
        No incidents available to inspect. Use the match controls to advance the game clock to minute 68'.
      </div>
    );
  }

  const selectedEvidence = activeIncident.evidence_items.find(e => e.camera_id === selectedCameraId) || activeIncident.evidence_items[0];

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const incId = activeIncident.incident_id || (activeIncident as any).id;
      await onRecordDecision({
        incident_id: incId,
        official_ruling: ruling,
        official_ruling_ar: ruling === 'Direct Free Kick Outside Box' ? 'ركلة حرة مباشرة خارج المنطقة' : ruling,
        disciplinary_action: disciplinary,
        restart_play: restart,
        rationale: rationale,
        rationale_ar: 'أكدت المراجعة أن الالتحام البدني الأولي بدأ عند س=83.6م (10 سم خارج خط منطقة الجزاء). التدخل أوقف هجمة واعدة دون لمس الكرة.',
        recorded_by: 'Marcus Sterling'
      });
      setFeedbackMsg(isRtl ? 'تم تسجيل واعتماد قرار الحكم الرسمي بنجاح!' : 'Official human referee decision successfully recorded!');
    } catch (err: any) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateExplainer = async () => {
    setIsSubmitting(true);
    try {
      const incId = activeIncident.incident_id || (activeIncident as any).id;
      await onGenerateExplanation(incId);
      setFeedbackMsg(isRtl ? 'تم توليد الشرح العلني ونشره في مركز القرارات!' : 'Public explainer generated and published!');
      onNavigateToExplainer(incId);
    } catch (err: any) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: 'rgba(0, 255, 135, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={18} color="#00FF87" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            {t.refTitle}
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 42px' }}>
          {t.refSubtitle}
        </p>
      </div>

      {feedbackMsg && (
        <div style={{
          backgroundColor: feedbackMsg.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 255, 135, 0.2)',
          border: `1px solid ${feedbackMsg.includes('Error') ? '#ef4444' : '#00FF87'}`,
          borderRadius: '8px',
          padding: '10px 16px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#FFFFFF'
        }}>
          {feedbackMsg}
        </div>
      )}

      {/* Main Grid: Incident Selector + Evidence Inspector + Decision Recording Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {/* Left Column: Incidents Queue & Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Incident Queue */}
          <div style={{
            backgroundColor: '#0c1324',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 14px 0' }}>
              {t.incidentQueue} ({incidents.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incidents.map((inc) => {
                const isSelected = inc.incident_id === activeIncident.incident_id;
                const isRecorded = !!inc.recorded_decision;

                return (
                  <div
                    key={inc.incident_id}
                    onClick={() => {
                      onSelectIncident(inc.incident_id);
                      if (inc.evidence_items.length > 0) {
                        const rec = inc.evidence_items.find(e => e.is_recommended) || inc.evidence_items[0];
                        setSelectedCameraId(rec.camera_id);
                      }
                    }}
                    style={{
                      backgroundColor: isSelected ? 'rgba(0, 255, 135, 0.1)' : '#070b16',
                      border: isSelected ? '1px solid #00FF87' : '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                        {inc.minute}:{String(inc.second).padStart(2, '0')}' • {inc.incident_type.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        backgroundColor: isRecorded ? 'rgba(0, 255, 135, 0.2)' : 'rgba(255, 0, 85, 0.2)',
                        color: isRecorded ? '#00FF87' : '#ff4d8d',
                        border: `1px solid ${isRecorded ? '#00FF87' : '#ff0055'}`
                      }}>
                        {inc.review_status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                      {isRtl ? inc.initial_flag_reason_ar : inc.initial_flag_reason}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Assessment Details */}
          <div style={{
            backgroundColor: '#0c1324',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                {t.incidentDetails}
              </h2>
              <span style={{
                fontSize: '11px',
                color: '#00FF87',
                backgroundColor: 'rgba(0, 255, 135, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(0, 255, 135, 0.3)'
              }}>
                {t.confidenceMetric}: {activeIncident.confidence_rating}%
              </span>
            </div>

            <div style={{
              backgroundColor: '#070b16',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '14px',
              fontSize: '13px',
              color: '#cbd5e1',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
                {isRtl ? 'التقييم الأولي للذكاء الاصطناعي:' : 'Preliminary AI Assessment:'}
              </div>
              {isRtl ? activeIncident.preliminary_assessment_ar : activeIncident.preliminary_assessment}
            </div>

            {/* Uncertainty Notice Box */}
            <div style={{
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#fef08a',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <AlertTriangle size={14} color="#eab308" />
                <span>{t.uncertaintyNotice}</span>
              </div>
              <div>
                {isRtl ? activeIncident.confidence_rationale_ar : activeIncident.confidence_rationale}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Multi-Camera Evidence Inspector & Pitch Coordinate Alignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#0c1324',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={16} color="#00FF87" />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                  {isRtl ? 'مستعرض أدلة الكاميرات المتعددة' : 'Multi-Camera Synchronized Viewer'}
                </h2>
              </div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                [Simulated Viewport]
              </span>
            </div>

            {/* Camera Switcher Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {activeIncident.evidence_items.map((cam) => {
                const isSelected = cam.camera_id === selectedCameraId;
                return (
                  <button
                    key={cam.camera_id}
                    onClick={() => setSelectedCameraId(cam.camera_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: isSelected ? '#1e293b' : '#070b16',
                      color: isSelected ? '#00FF87' : '#94a3b8',
                      border: isSelected ? '1px solid #00FF87' : '1px solid #334155',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{isRtl ? cam.camera_name_ar : cam.camera_name}</span>
                    {cam.is_recommended && (
                      <span style={{
                        fontSize: '9px',
                        backgroundColor: '#00FF87',
                        color: '#0A0E1A',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        fontWeight: 800
                      }}>
                        TOP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Simulated Camera View Canvas Area */}
            <div style={{
              width: '100%',
              height: '240px',
              backgroundColor: '#050811',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '12px'
            }}>
              {/* Camera Header Overlay */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>
                  REC • 60 FPS • {selectedEvidence?.camera_id} • SYNC: +0.0ms
                </span>

                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(0, 255, 135, 0.2)',
                  color: '#00FF87',
                  border: '1px solid #00FF87',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 600
                }}>
                  {t.collinearView} ({selectedEvidence?.visibility_score}% Sharpness)
                </span>
              </div>

              {/* Graphic Visual Representation of the Camera View */}
              <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                <div style={{
                  display: 'inline-block',
                  border: '2px dashed #00FF87',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 255, 135, 0.05)'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', marginBottom: '4px' }}>
                    {isRtl ? selectedEvidence?.key_observation_ar : selectedEvidence?.key_observation}
                  </div>
                  <div style={{ fontSize: '11px', color: '#ff4d8d', fontWeight: 600 }}>
                    18-Yard Demarcation Line: X=83.50m | Contact Impact: X=83.60m
                  </div>
                </div>
              </div>

              {/* Bottom Camera Metadata */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#94a3b8',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '4px 8px',
                borderRadius: '4px'
              }}>
                <span>Coverage: {isRtl ? selectedEvidence?.field_coverage_ar : selectedEvidence?.field_coverage}</span>
                <span>Occlusion: {selectedEvidence?.occlusion_level}</span>
              </div>
            </div>

            {/* Limitation description */}
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
              * {isRtl ? selectedEvidence?.limitations_ar : selectedEvidence?.limitations}
            </div>
          </div>

          {/* Spatial Pitch Geometry */}
          <div style={{
            backgroundColor: '#0c1324',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '20px'
          }}>
            <Pitch2D
              ballCoordinates={{ x: activeIncident.coordinates.x, y: activeIncident.coordinates.y }}
              highlightBoxBoundary={true}
            />
          </div>
        </div>

        {/* Right Column: Record Human Referee Decision & Generate Explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#0c1324',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <UserCheck size={18} color="#00FF87" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                {t.refereeDecisionFormTitle}
              </h2>
            </div>

            <form onSubmit={handleDecisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Official Ruling */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  {t.fieldRuling}
                </label>
                <select
                  value={ruling}
                  onChange={(e) => setRuling(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070b16',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                >
                  <option value="Direct Free Kick Outside Box">Direct Free Kick Outside Box (ركلة حرة مباشرة خارج المنطقة)</option>
                  <option value="Penalty Kick Awarded">Penalty Kick Awarded (احتساب ركلة جزاء)</option>
                  <option value="No Infraction / Play On">No Infraction / Play On (لا مخالفة / استمرار اللعب)</option>
                </select>
              </div>

              {/* Disciplinary Action */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  {t.fieldDisciplinary}
                </label>
                <select
                  value={disciplinary}
                  onChange={(e) => setDisciplinary(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070b16',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                >
                  <option value="Yellow Card (SPA)">Yellow Card for Stopping Promising Attack (#5 Devon Cole)</option>
                  <option value="Red Card (DOGSO)">Red Card for DOGSO</option>
                  <option value="None">None</option>
                </select>
              </div>

              {/* Restart */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  {t.fieldRestart}
                </label>
                <select
                  value={restart}
                  onChange={(e) => setRestart(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070b16',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                >
                  <option value="Direct Free Kick">Direct Free Kick at X=83.6m</option>
                  <option value="Penalty Kick">Penalty Kick</option>
                  <option value="Dropped Ball">Dropped Ball</option>
                </select>
              </div>

              {/* Rationale */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  {t.fieldRationale}
                </label>
                <textarea
                  rows={4}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#070b16',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Submit Decision */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#00FF87',
                  color: '#070b15',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                <CheckCircle size={16} />
                <span>{t.submitDecisionBtn}</span>
              </button>
            </form>

            <div style={{ borderTop: '1px solid #1e293b', marginTop: '18px', paddingTop: '18px' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                {isRtl ? 'بعد اعتماد القرار البشري، قم بنشر الشرح الشفاف للجماهير:' : 'Once human decision is recorded, publish the verified explanation:'}
              </div>

              <button
                onClick={handleGenerateExplainer}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  backgroundColor: '#111c35',
                  color: '#38bdf8',
                  border: '1px solid #233876',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                <FileText size={16} />
                <span>{t.btnPublishExplainer}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
