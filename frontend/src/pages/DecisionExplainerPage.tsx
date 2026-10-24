import React, { useState, useEffect } from 'react';
import { Incident } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../services/api';
import {
  Scale, Users, LineChart, Tv, BookOpen, AlertCircle,
  CheckCircle, Shield, Award, HelpCircle, ChevronRight, Layers
} from 'lucide-react';

interface DecisionExplainerPageProps {
  incidents: Incident[];
  selectedIncidentId?: string;
  onSelectIncident: (id: string) => void;
}

export const DecisionExplainerPage: React.FC<DecisionExplainerPageProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident
}) => {
  const { t, isRtl } = useLanguage();
  const [mode, setMode] = useState<'FAN' | 'ANALYST' | 'REFEREE'>('FAN');
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Fallback default explanation for resilient offline demo
  const fallbackExplanation = {
    fan_mode: {
      headline: "Why was a Direct Free Kick awarded outside the box instead of a Penalty?",
      headline_ar: "لماذا تم احتساب ركلة حرة مباشرة خارج المنطقة بدلاً من ركلة جزاء؟",
      summary: (
        "While attacker Marcus Vance landed inside the penalty area, high-speed camera evidence proves " +
        "the initial trip by defender Devon Cole occurred 10 centimeters outside the 18-yard line. " +
        "Under IFAB football rules, a foul is awarded where contact begins, not where the player lands."
      ),
      summary_ar: (
        "على الرغم من سقوط المهاجم داخل منطقة الجزاء، أثبتت اللقطات أن عرقلة المدافع بدأت قبل خط منطقة الجزاء بـ 10 سنتيمترات. " +
        "تنص قوانين كرة القدم على احتساب المخالفة في المكان الذي بدأ فيه الاحتكاك، وليس حيث يسقط اللاعب."
      ),
      key_takeaway: "Foul occurred outside the box. Correct ruling: Direct Free Kick + Caution #5.",
      key_takeaway_ar: "المخالفة حدثت خارج المنطقة. القرار الصحيح: ركلة حرة مباشرة وإنذار للرقم 5."
    },
    analyst_mode: {
      incident_id: "INC_68_PEN_CHECK",
      metric_coordinates: { x: 83.6, y: 49.2 },
      measured_contact_point: "X=83.60, Y=49.20 (Point of initial challenge)",
      demarcation_boundary: "X=83.50 (Penalty box perimeter line)",
      delta_distance_cm: "+10.0 cm outside box",
      ifab_rule_citation: "IFAB Law 12.1: The location of initial physical contact dictates the restart location.",
      ifab_rule_citation_ar: "القانون 12.1 للإيفاب: نقطة بدء الاحتكاك البدني هي التي تحدد مكان استئناف اللعب.",
      dogso_vs_spa_assessment: "Assessed as SPA (Stopping a Promising Attack) rather than DOGSO due to covering defender positioning.",
      dogso_vs_spa_assessment_ar: "تم تقييمها كإيقاف هجمة واعدة (SPA) وليس فرصة محققة (DOGSO) لوجود مدافع مغطٍ.",
      recommended_camera: "EIGHTEEN_YARD_BOX_LEFT (Synchronized Collinear View)"
    },
    referee_mode: {
      official_law: "IFAB Law 12 (Fouls & Misconduct) & Law 14 (Penalty Kick)",
      infringement_type: "Careless / Reckless Trip",
      demarcation_rule: "Lines belong to the area they bound. Contact initiated before line = Direct Free Kick.",
      certified_official_ruling: "Direct Free Kick Outside Penalty Area",
      disciplinary_sanction: "Yellow Card (Caution) for SPA",
      match_restart: "Direct Free Kick",
      rationale: "Camera 18YD_LEFT collinear angle confirms initial trip contact occurred 10cm before 18-yard line."
    },
    uncertainty_statement: (
      "Assessment has an estimated ±3.2cm tolerance margin due to 60fps frame shutter interval. " +
      "RefVision AI provides advisory telemetry; the human match referee retains final official authority."
    ),
    uncertainty_statement_ar: (
      "التقييم يخضع لهامش خطأ تقديري قدره ±3.2 سم بسبب معدل التقاط 60 إطار في الثانية. " +
      "يقدم النظام بيانات استشارية مساعدة، ويحتفظ الحكم بكامل الصلاحية الرسمية للقرار."
    ),
    missing_evidence: [
      "Ultra-high-speed 120fps camera calibration was offline on East Stand.",
      "In-ball micro-sensor pressure telemetry unavailable for this match."
    ],
    missing_evidence_ar: [
      "كاميرا السرعة الفائقة 120 إطار/ثانية في المدرج الشرقي غير مفعلة.",
      "مستشعرات الضغط داخل الكرة غير متاحة في هذه المباراة."
    ],
    laws_referenced: [
      "IFAB Law 12: Fouls & Misconduct (Direct Free Kick vs Penalty Area Boundary)",
      "IFAB Law 14: The Penalty Kick (Area Demarcation Clause)",
      "IFAB VAR Protocol: Clear & Obvious Error Standard"
    ],
    laws_referenced_ar: [
      "القانون 12 للإيفاب: الأخطاء وسوء السلوك (الركلة الحرة مقابل حدود منطقة الجزاء)",
      "القانون 14 للإيفاب: ركلة الجزاء (بند حدود المنطقة)",
      "بروتوكول الـ VAR للإيفاب: معيار الخطأ الواضح والجلي"
    ],
    verification_status: "AI_ADVISORY_VERIFIED"
  };

  // Find or select active incident
  useEffect(() => {
    let inc = incidents.find(i => (i.incident_id || i.id) === selectedIncidentId);
    if (!inc && incidents.length > 0) {
      inc = incidents[0];
    }

    if (inc) {
      setActiveIncident(inc);
      // If structured explanation is missing, try generating it from API
      if (!inc.structured_explanation) {
        setIsGenerating(true);
        api.generateExplanation(inc.incident_id || inc.id || 'INC_68_PEN_CHECK')
          .then(res => {
            if (res?.structured_explanation) {
              setActiveIncident((prev: any) => ({ ...prev, structured_explanation: res.structured_explanation }));
            }
          })
          .catch(() => {})
          .finally(() => setIsGenerating(false));
      }
    }
  }, [selectedIncidentId, incidents]);

  const currentInc = activeIncident || incidents[0];
  const exp = currentInc?.structured_explanation || fallbackExplanation;
  const isRecorded = !!(currentInc?.recorded_decision || currentInc?.human_ruling);

  return (
    <div style={{ padding: '32px 20px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #091322 0%, #050b14 100%)',
        border: '1px solid #1e2e45',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Scale size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {isRtl ? 'مفسر قرارات الـ VAR: لماذا اتُخذ هذا القرار؟' : 'Why Was This Decision Made? (VAR Decision Explainer)'}
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              {isRtl
                ? 'شروحات واضحة ومستندة للأدلة المرئية وقوانين الإيفاب الرسمية، مع الفصل الصريح بين تقييم الذكاء الاصطناعي وقرار الحكم البشري.'
                : 'Evidence-first explanations grounded in official IFAB Laws of the Game, separating machine telemetry from certified referee rulings.'}
            </p>
          </div>
        </div>

        {/* 3 Presentation Modes Switcher */}
        <div style={{
          display: 'flex',
          gap: '6px',
          backgroundColor: '#070b14',
          padding: '4px',
          borderRadius: '8px',
          border: '1px solid #1e2e45'
        }}>
          <button
            onClick={() => setMode('FAN')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: mode === 'FAN' ? '1px solid #00FF87' : 'none',
              backgroundColor: mode === 'FAN' ? 'rgba(0, 255, 135, 0.15)' : 'transparent',
              color: mode === 'FAN' ? '#00FF87' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Users size={14} />
            <span>{isRtl ? 'وضع المشجع' : 'Fan Mode'}</span>
          </button>

          <button
            onClick={() => setMode('ANALYST')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: mode === 'ANALYST' ? '1px solid #38bdf8' : 'none',
              backgroundColor: mode === 'ANALYST' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: mode === 'ANALYST' ? '#38bdf8' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <LineChart size={14} />
            <span>{isRtl ? 'وضع المحلل' : 'Analyst Mode'}</span>
          </button>

          <button
            onClick={() => setMode('REFEREE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              border: mode === 'REFEREE' ? '1px solid #f59e0b' : 'none',
              backgroundColor: mode === 'REFEREE' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: mode === 'REFEREE' ? '#f59e0b' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Shield size={14} />
            <span>{isRtl ? 'وضع الحكم الرسمي' : 'Referee Mode'}</span>
          </button>
        </div>
      </div>

      {/* Incident Switcher Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0c121d',
        border: '1px solid #1e2e45',
        borderRadius: '10px',
        padding: '12px 18px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
            {isRtl ? 'الحالة المعروضة:' : 'Inspected Incident:'}
          </span>
          <select
            value={currentInc?.incident_id || currentInc?.id || 'INC_68_PEN_CHECK'}
            onChange={(e) => onSelectIncident(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#070b14',
              border: '1px solid #1e2e45',
              borderRadius: '6px',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            <option value="INC_68_PEN_CHECK">Minute 68' — Penalty Area Boundary Check (Marcus Vance vs Devon Cole)</option>
            <option value="INC_SB_3869685_22">Minute 22' — Penalty Contact Check (Di Maria vs Dembele - 2022 Final)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: isRecorded ? 'rgba(0, 255, 135, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: isRecorded ? '#00FF87' : '#f59e0b',
            border: `1px solid ${isRecorded ? '#00FF87' : '#f59e0b'}`
          }}>
            {isRecorded ? '✓ HUMAN DECISION RECORDED' : 'ADVISORY VAR REVIEW PENDING'}
          </span>
        </div>
      </div>

      {/* MODE 1: FAN MODE */}
      {mode === 'FAN' && (
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '14px',
          padding: '32px',
          marginBottom: '28px'
        }}>
          <div style={{ fontSize: '11px', color: '#00FF87', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {isRtl ? 'شرح مبسط بلغة واضحة للجماهير' : 'Plain-Language Fan Explanation'}
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 16px 0', lineHeight: 1.25 }}>
            {isRtl ? exp.fan_mode?.headline_ar || exp.fan_mode?.headline : exp.fan_mode?.headline}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#cbd5e1', margin: '0 0 24px 0' }}>
            {isRtl ? exp.fan_mode?.summary_ar || exp.fan_mode?.summary : exp.fan_mode?.summary}
          </p>

          <div style={{
            backgroundColor: 'rgba(0, 255, 135, 0.08)',
            border: '1px solid rgba(0, 255, 135, 0.3)',
            borderRadius: '10px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <CheckCircle size={24} color="#00FF87" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', color: '#00FF87', fontWeight: 800, textTransform: 'uppercase' }}>
                {isRtl ? 'الخلاصة المعتمدة للقرار' : 'Key Rule Takeaway'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                {isRtl ? exp.fan_mode?.key_takeaway_ar || exp.fan_mode?.key_takeaway : exp.fan_mode?.key_takeaway}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: ANALYST MODE */}
      {mode === 'ANALYST' && (
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '14px',
          padding: '32px',
          marginBottom: '28px'
        }}>
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {isRtl ? 'بيانات التتبع المكاني والمقاييس الهندسية' : 'Spatial Coordinate Tracking & Homography Telemetry'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 20px 0' }}>
            Spatial Demarcation & Physical Challenge Point
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Measured Initial Contact</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {exp.analyst_mode?.measured_contact_point || 'X=83.60, Y=49.20'}
              </div>
            </div>

            <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Demarcation Boundary Edge</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {exp.analyst_mode?.demarcation_boundary || 'X=83.50 (Penalty Box Perimeter Line)'}
              </div>
            </div>

            <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Delta Distance Relative to Box</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#00FF87', marginTop: '4px' }}>
                {exp.analyst_mode?.delta_distance_cm || '+10.0 cm Outside Box'}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
              Applicable Law Citation:
            </div>
            <div style={{ fontSize: '13px', color: '#FFFFFF', lineHeight: 1.5 }}>
              {isRtl ? exp.analyst_mode?.ifab_rule_citation_ar || exp.analyst_mode?.ifab_rule_citation : exp.analyst_mode?.ifab_rule_citation}
            </div>
          </div>

          <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
              DOGSO vs SPA Tactical Analysis:
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {isRtl ? exp.analyst_mode?.dogso_vs_spa_assessment_ar || exp.analyst_mode?.dogso_vs_spa_assessment : exp.analyst_mode?.dogso_vs_spa_assessment}
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: REFEREE MODE */}
      {mode === 'REFEREE' && (
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '14px',
          padding: '32px',
          marginBottom: '28px'
        }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            {isRtl ? 'وضع مراجعة الحكم الرسمي وقرار المباراة' : 'Certified Official Referee Ruling & Match Administration'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 20px 0' }}>
            Official Ruling & Match Record Details
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Certified Official Ruling</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#00FF87', marginTop: '4px' }}>
                {currentInc?.human_ruling || currentInc?.recorded_decision?.official_ruling || 'Direct Free Kick Outside Box'}
              </div>
            </div>

            <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Disciplinary Sanction</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#eab308', marginTop: '4px' }}>
                {currentInc?.disciplinary_action || currentInc?.recorded_decision?.disciplinary_action || 'Yellow Card (#5 - SPA)'}
              </div>
            </div>

            <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Match Restart</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {currentInc?.restart_play || currentInc?.recorded_decision?.restart_play || 'Direct Free Kick'}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#070b14', padding: '16px', borderRadius: '8px', border: '1px solid #1e2e45' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px' }}>
              Documented Referee Rationale & Law Determination:
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {currentInc?.rationale || currentInc?.recorded_decision?.rationale || (
                'Under IFAB Law 12.1 and Law 14 demarcation clause, physical challenge occurred 10cm before the line. Direct Free Kick awarded outside penalty area. Forward momentum does not convert foul to penalty.'
              )}
            </div>
            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
              Reviewed by: <strong style={{ color: '#F1F5F9' }}>{currentInc?.reviewed_by || currentInc?.recorded_decision?.recorded_by || 'Marcus Sterling (Official Referee)'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Grid: Applicable Laws & Known Limitations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '20px'
      }}>
        {/* Applicable Laws */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <BookOpen size={16} color="#00FF87" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {isRtl ? 'مواد قانون كرة القدم الرسمية (IFAB)' : 'Applicable IFAB Laws of the Game'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(isRtl ? exp.laws_referenced_ar : exp.laws_referenced)?.map((law: string, idx: number) => (
              <div key={idx} style={{
                backgroundColor: '#070b14',
                border: '1px solid #1e2e45',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ color: '#00FF87', fontWeight: 700 }}>•</span>
                <span>{law}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Known Limitations & Uncertainty Tolerances */}
        <div style={{
          backgroundColor: '#0c121d',
          border: '1px solid #1e2e45',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertCircle size={16} color="#eab308" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {isRtl ? 'حدود البيانات المعترف بها وهوامش عدم اليقين' : 'Known Telemetry Limitations & Uncertainty Margin'}
            </h3>
          </div>

          <div style={{
            fontSize: '12px',
            color: '#cbd5e1',
            lineHeight: 1.5,
            marginBottom: '14px',
            backgroundColor: '#070b14',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #1e2e45'
          }}>
            {isRtl ? exp.uncertainty_statement_ar : exp.uncertainty_statement}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {(isRtl ? exp.missing_evidence_ar : exp.missing_evidence)?.map((item: string, idx: number) => (
              <div key={idx} style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '6px' }}>
                <span style={{ color: '#eab308' }}>⚠</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
