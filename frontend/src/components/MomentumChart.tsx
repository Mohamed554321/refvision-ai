import React from 'react';
import { MomentumDataPoint } from '../types/football';
import { useLanguage } from '../i18n/LanguageContext';

interface MomentumChartProps {
  series: MomentumDataPoint[];
  currentMinute: number;
}

export const MomentumChart: React.FC<MomentumChartProps> = ({ series, currentMinute }) => {
  const { isRtl } = useLanguage();

  if (!series || series.length === 0) {
    return <div style={{ color: '#94a3b8', padding: '16px' }}>No momentum data available yet.</div>;
  }

  const width = 800;
  const height = 180;
  const padding = 30;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  const midY = height / 2;

  // Map points to SVG coordinates
  // X: minute (0 to 90) -> (minute / 90) * graphWidth + padding
  // Y: home_momentum (+ve -> midY - ...), away_momentum (+ve -> midY + ...)
  const maxMinute = 90;

  const points = series.map((pt) => {
    const x = padding + (pt.minute / maxMinute) * graphWidth;
    let net = 0;
    if (pt.dominant_team_id === 'APX') {
      net = pt.home_momentum;
    } else {
      net = -pt.away_momentum;
    }
    // Net is between -100 and +100
    const y = midY - (net / 100) * (graphHeight / 2);
    return { x, y, net, pt };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`;
  }, '');

  // Area fill above midY (Apex)
  const homeAreaD = points.reduce((acc, curr, idx) => {
    const clampedY = Math.min(curr.y, midY);
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${clampedY}`;
  }, '') + ` L ${points[points.length - 1].x} ${midY} L ${points[0].x} ${midY} Z`;

  // Current scrub line
  const currentX = padding + (Math.min(currentMinute, 90) / maxMinute) * graphWidth;

  return (
    <div style={{
      backgroundColor: '#0a0f1d',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #1e293b'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00FF87' }} />
            <span style={{ fontSize: '12px', color: '#00FF87', fontWeight: 600 }}>Apex Vanguard (+100)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3A86FF' }} />
            <span style={{ fontSize: '12px', color: '#3A86FF', fontWeight: 600 }}>Crown Meridian (-100)</span>
          </div>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          {isRtl ? 'محسوب بخوارزمية التدفق الحتمي (أهداف، تسديدات، ركنيات، التحامات)' : 'Computed via Event Flow Weightings'}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {/* Baseline grid lines */}
        <line x1={padding} y1={midY} x2={width - padding} y2={midY} stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeWidth="0.8" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1e293b" strokeWidth="0.8" />

        {/* Half-time line (45 min) */}
        <line x1={padding + (45 / maxMinute) * graphWidth} y1={padding} x2={padding + (45 / maxMinute) * graphWidth} y2={height - padding} stroke="#475569" strokeWidth="1" strokeDasharray="4,4" />
        <text x={padding + (45 / maxMinute) * graphWidth} y={height - 10} fill="#64748b" fontSize="10" textAnchor="middle">HT (45')</text>

        {/* Momentum line */}
        <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

        {/* Points with key events */}
        {points.map((p, i) => {
          if (p.pt.trigger_event) {
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill={p.net >= 0 ? '#00FF87' : '#3A86FF'} stroke="#FFFFFF" strokeWidth="1" />
                <text x={p.x} y={p.y - 8} fill="#e2e8f0" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {p.pt.minute}'
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* Current match time marker */}
        <line x1={currentX} y1={padding - 5} x2={currentX} y2={height - padding + 5} stroke="#ff0055" strokeWidth="2" />
        <circle cx={currentX} cy={midY} r="3" fill="#ff0055" />
      </svg>
    </div>
  );
};
