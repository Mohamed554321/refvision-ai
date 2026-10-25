import React, { useState, useEffect } from 'react';
import { MultiAgentWorkflowExecution } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Settings, Cpu, ShieldCheck, CheckCircle2, Play, Globe, AlertCircle, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { t, language, setLanguage, isRtl } = useLanguage();
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [capabilityMatrix, setCapabilityMatrix] = useState<any[]>([]);
  const [execution, setExecution] = useState<MultiAgentWorkflowExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    api.getProviderStatus().then(setProviderStatus).catch(() => {});
    api.getCapabilityMatrix().then(setCapabilityMatrix).catch(() => {});
  }, []);

  const handleRunPipeline = async () => {
    setIsRunning(true);
    try {
      const res = await api.executeMultiAgentPipeline();
      setExecution(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '28px 20px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
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
            <Settings size={20} color="#00FF87" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            {t.settingsTitle}
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 44px' }}>
          {t.settingsSubtitle}
        </p>
      </div>

      {/* Grid: Provider Status + Language Switcher */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Microsoft Agent Framework & Foundry Status */}
        <div style={{
          backgroundColor: '#0c1324',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Cpu size={18} color="#00FF87" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Microsoft Foundry & Azure AI Agent Status
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Operational Mode:</span>
              <span style={{ color: '#00FF87', fontWeight: 700 }}>{providerStatus?.mode || 'LOCAL_DETERMINISTIC_SANDBOX ($0 Cost)'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Agent Framework:</span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{providerStatus?.framework_version || 'Microsoft.AgentFramework 2026.1'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Zero-Cost Guarantee:</span>
              <span style={{ color: '#00FF87', fontWeight: 700 }}>ACTIVE (100% Free / Local Execution)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Cloud Key Required:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>Optional (Runs fully self-contained)</span>
            </div>
          </div>
        </div>

        {/* Language & Accessibility Preferences */}
        <div style={{
          backgroundColor: '#0c1324',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Globe size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {t.switchLanguage}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: language === 'en' ? '2px solid #00FF87' : '1px solid #334155',
                backgroundColor: language === 'en' ? 'rgba(0, 255, 135, 0.15)' : '#070b16',
                color: language === 'en' ? '#00FF87' : '#94a3b8',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              English (LTR)
            </button>

            <button
              onClick={() => setLanguage('ar')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                border: language === 'ar' ? '2px solid #00FF87' : '1px solid #334155',
                backgroundColor: language === 'ar' ? 'rgba(0, 255, 135, 0.15)' : '#070b16',
                color: language === 'ar' ? '#00FF87' : '#94a3b8',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              العربية (RTL)
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
            {isRtl
              ? 'تغيير اللغة يحافظ بشكل كامل على إحصاءات المباراة والتوقعات الحالية دون إعادة تحميل الصفحة أو فقدان الحالة.'
              : 'Switching languages instantly adjusts layout direction (RTL/LTR) without resetting the match engine state.'}
          </div>
        </div>
      </div>

      {/* Multi-Agent Execution Trigger & Quality Gate Section */}
      <div style={{
        backgroundColor: '#0c1324',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px 0' }}>
              {isRtl ? 'تشغيل وتدقيق دورة الوكلاء السبعة' : '7-Agent Orchestration & Quality Gate Execution'}
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
              {isRtl
                ? 'تقوم دورة العمل بتشغيل الوكلاء السبعة بالتسلسل ثم تمرير المخرجات عبر بوابة جودة المشرف الرقابي.'
                : 'Executes Agents 1 through 6 and subjects all conclusions to Agent 7 (Supervisor Quality Gate).'}
            </p>
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#00FF87',
              color: '#070b15',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={16} className={isRunning ? 'spin' : ''} />
            <span>{isRunning ? 'Executing Agents...' : t.executeMultiAgentBtn}</span>
          </button>
        </div>

        {/* Quality Gate Status Box */}
        {execution && (
          <div style={{
            backgroundColor: execution.quality_gate.is_approved ? 'rgba(0, 255, 135, 0.08)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${execution.quality_gate.is_approved ? '#00FF87' : '#ef4444'}`,
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color={execution.quality_gate.is_approved ? '#00FF87' : '#ef4444'} />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                  {t.supervisorGateTitle}: {execution.quality_gate.is_approved ? 'APPROVED' : 'REJECTED'}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#00FF87' }}>
                Confidence: {execution.quality_gate.confidence_score}% • {execution.execution_time_ms}ms
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
              {isRtl ? execution.quality_gate.supervisor_notes_ar : execution.quality_gate.supervisor_notes}
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span>✓ Fact-Check Passed: {String(execution.quality_gate.fact_check_passed)}</span>
              <span>✓ Non-Authoritative Disclaimer: {String(execution.quality_gate.non_authoritative_disclaimer_present)}</span>
              <span>✓ Provenance Links Valid: {String(execution.quality_gate.evidence_links_valid)}</span>
            </div>
          </div>
        )}

        {/* 7 Agents Output Cards */}
        {execution && (
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '14px' }}>
              {t.agentOutputsTitle}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px' }}>
              {Object.entries(execution.agent_outputs).map(([name, output]) => (
                <div
                  key={name}
                  style={{
                    backgroundColor: '#070b16',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#00FF87' }}>
                      {name}
                    </div>
                    <span style={{
                      fontSize: '9px',
                      backgroundColor: 'rgba(0, 255, 135, 0.15)',
                      color: '#00FF87',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      {output.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>
                    Role: {output.role}
                  </div>

                  <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '8px' }}>
                    {isRtl ? output.summary_ar : output.summary}
                  </div>

                  {output.provenance_event_ids.length > 0 && (
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      Provenance Links: {output.provenance_event_ids.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Honest Capability & Limitation Matrix */}
      <div style={{
        backgroundColor: '#0c1324',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <ShieldCheck size={20} color="#00FF87" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            {isRtl ? 'مصفوفة القدرات الفنية وحدود النظام الشفافة' : 'RefVision Technical Capability & Sensor Boundary Matrix'}
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px 0', lineHeight: 1.5 }}>
          {isRtl
            ? 'تلتزم ريف فيجن بالشفافية الكاملة: نوضح بدقة ما هو مفعل ومؤكد محلياً بدون تكلفة ($0)، مقابل ما يتطلب تقنيات بث تلفزيوني متخصصة مثل التتبع ثلاثي الأبعاد بالأشعة أو مجسات الكرة المتصلة.'
            : 'RefVision AI strictly adheres to honest AI disclosure: we explicitly separate verified $0 local capabilities from proprietary broadcast features requiring calibrated 12-camera optical arrays or connected-ball IMUs.'}
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: isRtl ? 'right' : 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Capability</th>
                <th style={{ padding: '10px 12px' }}>Input Source</th>
                <th style={{ padding: '10px 12px' }}>Implementation Status</th>
                <th style={{ padding: '10px 12px' }}>Verified Description</th>
              </tr>
            </thead>
            <tbody>
              {capabilityMatrix.map((item, idx) => {
                const isOp = item.status === 'VERIFIED_OPERATIONAL';
                const isPart = item.status === 'PARTIALLY_SUPPORTED';
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #131d2e' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#ffffff' }}>{item.capability}</td>
                    <td style={{ padding: '12px', color: '#38bdf8', fontFamily: 'monospace', fontSize: '11px' }}>{item.source_type}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isOp ? 'rgba(0,255,135,0.15)' : isPart ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                        color: isOp ? '#00ff87' : isPart ? '#f59e0b' : '#ef4444'
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px', lineHeight: 1.4 }}>{item.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
