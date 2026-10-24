import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export interface PitchEventMarker {
  id?: string;
  event_id?: string;
  minute: number;
  second?: number;
  event_type: string;
  player_name?: string;
  team_id?: string;
  x?: number;
  y?: number;
  outcome?: string;
  xg?: number;
  metadata?: any;
  is_noteworthy?: boolean;
}

interface Pitch2DProps {
  events?: PitchEventMarker[];
  selectedEventId?: string;
  onSelectEvent?: (event: PitchEventMarker) => void;
  ballCoordinates?: { x: number; y: number };
  highlightBoxBoundary?: boolean;
  involvedPlayers?: Array<{ id: string; name: string; name_ar: string; team: string; x: number; y: number }>;
  markerLabel?: string;
  markerLabelAr?: string;
  isSynthetic?: boolean;
}

export const Pitch2D: React.FC<Pitch2DProps> = ({
  events = [],
  selectedEventId,
  onSelectEvent,
  ballCoordinates = { x: 83.6, y: 49.2 },
  highlightBoxBoundary = false,
  involvedPlayers = [],
  markerLabel = 'Initial Contact (X=83.60: 10cm Outside Box)',
  markerLabelAr = 'نقطة التلامس الأولى (س=83.60: 10 سم خارج المنطقة)',
  isSynthetic = true
}) => {
  const { isRtl } = useLanguage();
  const [hoveredEvent, setHoveredEvent] = useState<PitchEventMarker | null>(null);

  // Normalization logic: detect whether coordinates are StatsBomb (0-120 x 0-80) or Standard (0-100 x 0-100)
  // Pitch SVG viewBox is 0 0 105 68 (Standard international pitch dimensions in meters)
  const normalizeCoords = (x?: number, y?: number): { x: number; y: number } | null => {
    if (x === undefined || y === undefined || x === null || y === null) return null;
    let normX = x;
    let normY = y;

    if (x > 100 || y > 75) {
      // StatsBomb 120 x 80 coordinates
      normX = (x / 120) * 105;
      normY = (y / 80) * 68;
    } else {
      // Standard percentage or 0-100 grid
      normX = (x / 100) * 105;
      normY = (y / 100) * 68;
    }

    return {
      x: Math.max(1, Math.min(104, normX)),
      y: Math.max(1, Math.min(67, normY))
    };
  };

  // Filter valid events with coordinates (limit to last 60 for clean visual rendering)
  const validEvents = events
    .filter(e => {
      const coords = normalizeCoords(e.x, e.y);
      return coords !== null;
    })
    .slice(-60);

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#0a141e',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #1e2e45',
      boxShadow: 'inset 0 0 25px rgba(0,0,0,0.7)',
      position: 'relative'
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#00FF87' }}>
            {isRtl ? 'الملعب التكتيكي التفاعلي والخريطة المكانية' : 'Interactive Tactical Pitch & Spatial Coordinate Map'}
          </span>
          <span style={{
            fontSize: '10px',
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: '4px',
            backgroundColor: isSynthetic ? 'rgba(0, 255, 135, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            color: isSynthetic ? '#00FF87' : '#38bdf8',
            border: `1px solid ${isSynthetic ? 'rgba(0, 255, 135, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
          }}>
            {isSynthetic ? 'SYNTHETIC GRID' : 'STATSBOMB REAL COORDINATES'}
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          {validEvents.length} {isRtl ? 'حدث مسجل على الملعب' : 'plotted match events'}
        </span>
      </div>

      {/* SVG Football Pitch (105m x 68m FIFA Standard Ratio) */}
      <div style={{ position: 'relative', width: '100%' }}>
        <svg
          viewBox="0 0 105 68"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: '8px',
            background: 'radial-gradient(ellipse at 50% 50%, #0e331e 0%, #071c11 100%)'
          }}
        >
          {/* Turf Mowing Striping (Subtle vertical stripes) */}
          {[0, 15, 30, 45, 60, 75, 90].map((stripeX, idx) => (
            <rect
              key={idx}
              x={stripeX}
              y="0"
              width="15"
              height="68"
              fill={idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'}
            />
          ))}

          {/* Pitch Outer Boundary */}
          <rect x="0" y="0" width="105" height="68" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.6" />

          {/* Halfway Line */}
          <line x1="52.5" y1="0" x2="52.5" y2="68" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />

          {/* Centre Circle & Spot */}
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
          <circle cx="52.5" cy="34" r="0.7" fill="rgba(255,255,255,0.8)" />

          {/* Left Penalty Area (16.5m x 40.32m -> X: 0 to 16.5, Y: 13.84 to 54.16) */}
          <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
          {/* Left Goal Area (5.5m x 18.32m) */}
          <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
          {/* Left Penalty Spot (11m) */}
          <circle cx="11" cy="34" r="0.6" fill="rgba(255,255,255,0.8)" />
          {/* Left Penalty Arc */}
          <path d="M 16.5 26.65 A 9.15 9.15 0 0 1 16.5 41.35" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
          {/* Left Goal */}
          <rect x="-2.4" y="30.34" width="2.4" height="7.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />

          {/* Right Penalty Area (X: 88.5 to 105, Y: 13.84 to 54.16) */}
          <rect
            x="88.5"
            y="13.84"
            width="16.5"
            height="40.32"
            fill={highlightBoxBoundary ? 'rgba(0, 255, 135, 0.05)' : 'none'}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.6"
          />
          {/* Right Goal Area */}
          <rect x="99.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
          {/* Right Penalty Spot (94m) */}
          <circle cx="94" cy="34" r="0.6" fill="rgba(255,255,255,0.8)" />
          {/* Right Penalty Arc */}
          <path d="M 88.5 26.65 A 9.15 9.15 0 0 0 88.5 41.35" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
          {/* Right Goal */}
          <rect x="105" y="30.34" width="2.4" height="7.32" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />

          {/* Corner Arcs */}
          <path d="M 0 1.5 A 1.5 1.5 0 0 0 1.5 0" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          <path d="M 0 66.5 A 1.5 1.5 0 0 1 1.5 68" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          <path d="M 103.5 0 A 1.5 1.5 0 0 0 105 1.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />
          <path d="M 103.5 68 A 1.5 1.5 0 0 1 105 66.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.4" />

          {/* Highlighted 18-Yard Demarcation Boundary (When VAR check active) */}
          {highlightBoxBoundary && (
            <g>
              <line
                x1="88.5"
                y1="13.84"
                x2="88.5"
                y2="54.16"
                stroke="#ff0055"
                strokeWidth="0.9"
                strokeDasharray="1.5, 1"
              />
              <text x="87" y="12" fill="#ff0055" fontSize="2.2" fontWeight="bold" textAnchor="end">
                18-Yard Boundary (Demarcation Line)
              </text>
            </g>
          )}

          {/* REAL MATCH EVENT MARKERS */}
          {validEvents.map((ev, i) => {
            const coords = normalizeCoords(ev.x, ev.y);
            if (!coords) return null;

            const isSelected = selectedEventId && (ev.id === selectedEventId || ev.event_id === selectedEventId);
            const isHovered = hoveredEvent && (hoveredEvent.id === ev.id || hoveredEvent.event_id === ev.event_id);
            const evType = (ev.event_type || '').toUpperCase();

            // Color and shape coding
            let fill = '#94a3b8';
            let stroke = '#060a12';
            let radius = 1.6;

            if (evType.includes('GOAL')) {
              fill = '#FFD700'; // Gold
              radius = 2.8;
            } else if (evType.includes('SHOT')) {
              fill = '#f97316'; // Orange
              radius = ev.xg ? Math.max(1.8, Math.min(3.5, ev.xg * 4.5)) : 2.0;
            } else if (evType.includes('CARD') || evType.includes('YELLOW')) {
              fill = evType.includes('RED') ? '#ef4444' : '#eab308';
              radius = 2.2;
            } else if (evType.includes('FOUL') || evType.includes('TACKLE')) {
              fill = '#ec4899'; // Pink/Amber
              radius = 1.9;
            } else if (evType.includes('VAR') || evType.includes('CHECK')) {
              fill = '#ff0055';
              radius = 3.0;
            }

            return (
              <g
                key={ev.id || ev.event_id || i}
                onClick={() => onSelectEvent && onSelectEvent(ev)}
                onMouseEnter={() => setHoveredEvent(ev)}
                onMouseLeave={() => setHoveredEvent(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Highlight ring if selected */}
                {isSelected && (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius + 2.5}
                    fill="none"
                    stroke="#00FF87"
                    strokeWidth="0.8"
                    strokeDasharray="1.5, 1"
                  >
                    <animate attributeName="r" from={radius + 1.5} to={radius + 3.5} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Event Marker */}
                {evType.includes('GOAL') ? (
                  <g>
                    <circle cx={coords.x} cy={coords.y} r={radius} fill={fill} stroke="#FFFFFF" strokeWidth="0.5" />
                    <circle cx={coords.x} cy={coords.y} r={radius * 1.8} fill="none" stroke="#FFD700" strokeWidth="0.4" strokeDasharray="1, 1" />
                  </g>
                ) : evType.includes('CARD') ? (
                  <rect
                    x={coords.x - 1.2}
                    y={coords.y - 1.8}
                    width="2.4"
                    height="3.6"
                    rx="0.4"
                    fill={fill}
                    stroke="#000"
                    strokeWidth="0.3"
                  />
                ) : (
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={radius}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth="0.4"
                    opacity={isHovered ? 1.0 : 0.85}
                  />
                )}

                {/* Small Minute Tag on hover */}
                {(isHovered || isSelected || evType.includes('GOAL')) && (
                  <text
                    x={coords.x}
                    y={coords.y - radius - 1.2}
                    fill="#FFFFFF"
                    fontSize="2.2"
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{ textShadow: '0 0 3px #000' }}
                  >
                    {ev.minute}' {evType.includes('GOAL') ? '⚽' : ''}
                  </text>
                )}
              </g>
            );
          })}

          {/* Involved Players (if specifically supplied for VAR inspection) */}
          {involvedPlayers.map((p) => {
            const pCoords = normalizeCoords(p.x, p.y);
            if (!pCoords) return null;
            return (
              <g key={p.id}>
                <circle
                  cx={pCoords.x}
                  cy={pCoords.y}
                  r="1.8"
                  fill={p.team === 'APX' || p.team === 'ARG' ? '#00FF87' : '#3A86FF'}
                  stroke="#0B132B"
                  strokeWidth="0.5"
                />
                <text
                  x={pCoords.x}
                  y={pCoords.y - 2.5}
                  fill="#FFFFFF"
                  fontSize="2.2"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isRtl ? p.name_ar : p.name}
                </text>
              </g>
            );
          })}

          {/* Ball Marker (if ballCoords provided) */}
          {ballCoordinates && (
            <g>
              {(() => {
                const bCoords = normalizeCoords(ballCoordinates.x, ballCoordinates.y);
                if (!bCoords) return null;
                return (
                  <g>
                    <circle cx={bCoords.x} cy={bCoords.y} r="1.1" fill="#FFD700" stroke="#000" strokeWidth="0.3" />
                    <circle cx={bCoords.x} cy={bCoords.y} r="3.2" fill="none" stroke="#FFD700" strokeWidth="0.4" strokeDasharray="1, 1">
                      <animate attributeName="r" from="1.5" to="4.5" dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="1" to="0" dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredEvent && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: isRtl ? 'auto' : '10px',
            left: isRtl ? '10px' : 'auto',
            backgroundColor: 'rgba(6, 12, 20, 0.92)',
            border: '1px solid #00FF87',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            color: '#FFFFFF',
            pointerEvents: 'none',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
            maxWidth: '240px'
          }}>
            <div style={{ fontWeight: 800, color: '#00FF87' }}>
              {hoveredEvent.minute}' — {hoveredEvent.event_type}
            </div>
            {hoveredEvent.player_name && (
              <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                Player: <strong>{hoveredEvent.player_name}</strong>
              </div>
            )}
            {hoveredEvent.xg && (
              <div style={{ color: '#eab308', marginTop: '2px' }}>
                Expected Goals (xG): <strong>{hoveredEvent.xg}</strong>
              </div>
            )}
            {hoveredEvent.outcome && (
              <div style={{ color: '#94a3b8', marginTop: '2px' }}>
                Outcome: {hoveredEvent.outcome}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visual Legend & Coordinate Details */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '11px',
        color: '#94a3b8'
      }}>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFD700', display: 'inline-block' }} />
            <span style={{ color: '#e2e8f0' }}>Goal (xG)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316', display: 'inline-block' }} />
            <span style={{ color: '#e2e8f0' }}>Shot</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ec4899', display: 'inline-block' }} />
            <span style={{ color: '#e2e8f0' }}>Foul / Challenge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '9px', backgroundColor: '#eab308', display: 'inline-block', borderRadius: '1px' }} />
            <span style={{ color: '#e2e8f0' }}>Card</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ff0055', display: 'inline-block' }} />
            <span style={{ color: '#e2e8f0' }}>VAR Check</span>
          </div>
        </div>

        {/* Dynamic Measurement or Empty state */}
        <div>
          {highlightBoxBoundary ? (
            <span style={{ color: '#ff4d88', fontWeight: 600 }}>
              {isRtl ? markerLabelAr : markerLabel}
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>
              {isRtl ? 'انقر على أي علامة في الملعب لفحص تفاصيل الحدث' : 'Click any event marker to inspect telemetry'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
