import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * ValleyCurve — animated Valley of Death diagram, fully language-aware.
 * Labels are driven entirely by translations. No mixed-language SVG.
 *
 * Motion system: a one-shot phase sequence (dormant -> descent -> floor ->
 * ascent -> settled) triggered once when the panel enters the viewport.
 * Segment geometry is derived at runtime from the CURVE path via
 * getTotalLength()/getPointAtLength() rather than hardcoded keyframes.
 */

const CURVE = 'M 60 215 C 180 235, 280 410, 430 420 S 680 320, 900 90';
const MILESTONE_POS = [
  { x: 110, y: 250 },
  { x: 230, y: 320 },
  { x: 360, y: 395 },
  { x: 555, y: 320 },
  { x: 820, y: 145 },
];

type Phase = 'dormant' | 'descent' | 'floor' | 'ascent' | 'settled';
const PHASE_ORDER: Phase[] = ['dormant', 'descent', 'floor', 'ascent', 'settled'];

// Desaturated, brand-aligned phase colors (not the literal neon prototype hexes).
const PHASE_COLOR: Record<Phase, string> = {
  dormant: 'hsl(0 0% 45%)',
  descent: 'hsl(18 92% 55%)',
  floor: 'hsl(0 0% 65%)',
  ascent: 'hsl(107 45% 52%)',
  settled: 'hsl(107 45% 52%)',
};

function buildSegment(
  path: SVGPathElement,
  total: number,
  fromT: number,
  toT: number,
  steps = 32
) {
  let points = '';
  let length = 0;
  let prev: { x: number; y: number } | null = null;
  for (let i = 0; i <= steps; i++) {
    const t = fromT + (toT - fromT) * (i / steps);
    const p = path.getPointAtLength(t * total);
    points += `${p.x},${p.y} `;
    if (prev) length += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = { x: p.x, y: p.y };
  }
  return { points: points.trim(), length };
}

export function ValleyCurve() {
  const t = useT();
  const c = t.valley.curve;
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const fontFamily = isRTL ? 'Cairo, sans-serif' : 'ui-sans-serif, system-ui';

  const panelRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const isInView = useInView(panelRef, { once: true, margin: '-100px' });

  const [reducedMotion, setReducedMotion] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [floorT, setFloorT] = useState(0.5);
  const [segments, setSegments] = useState<{
    descent: { points: string; length: number };
    ascent: { points: string; length: number };
  } | null>(null);
  const [phase, setPhase] = useState<Phase>('dormant');
  const [markerT, setMarkerT] = useState(0);
  const [markerPos, setMarkerPos] = useState({ x: 60, y: 215 });

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Derive floor point + segment polylines from the live path geometry once.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    let deepestT = 0.5;
    let deepestY = -Infinity;
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const tNorm = i / steps;
      const p = path.getPointAtLength(tNorm * total);
      if (p.y > deepestY) {
        deepestY = p.y;
        deepestT = tNorm;
      }
    }
    setFloorT(deepestT);
    setSegments({
      descent: buildSegment(path, total, 0, deepestT),
      ascent: buildSegment(path, total, deepestT, 1),
    });
    setMarkerPos(path.getPointAtLength(0));
    setMeasured(true);
  }, []);

  // One-shot phase sequence, gated on viewport entry + measured geometry.
  useEffect(() => {
    if (!isInView || !measured) return;

    if (reducedMotion) {
      setPhase('settled');
      setMarkerT(1);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('descent'), 500));
    timers.push(
      setTimeout(() => {
        setPhase('floor');
        setMarkerT(floorT);
      }, 700)
    );
    timers.push(setTimeout(() => setPhase('ascent'), 1700));
    timers.push(
      setTimeout(() => {
        setMarkerT(1);
      }, 1750)
    );
    timers.push(setTimeout(() => setPhase('settled'), 3300));

    return () => timers.forEach(clearTimeout);
  }, [isInView, measured, floorT, reducedMotion]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !measured) return;
    const total = path.getTotalLength();
    setMarkerPos(path.getPointAtLength(markerT * total));
  }, [markerT, measured]);

  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const phaseAtLeast = (target: Phase) => phaseIndex >= PHASE_ORDER.indexOf(target);
  const markerColor = PHASE_COLOR[phase];

  const phaseLabel = useMemo(() => {
    if (phase === 'dormant') return c.phases.dormant;
    if (phase === 'descent') return c.phases.descent;
    if (phase === 'floor') return c.phases.floor;
    return c.phases.ascent;
  }, [phase, c.phases]);

  return (
    <section
      dir={isRTL ? 'rtl' : 'ltr'}
      className="relative border-y border-white/5 bg-black py-24 md:py-32 px-6 lg:px-12 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,hsl(18_92%_55%/0.10),transparent_65%)]" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 60px)',
        }}
      />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9 }}
          className="mb-16"
        >
          {c.eyebrow && (
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-10 bg-ember" />
              <span className={cn(
                'text-ember font-medium',
                isRTL ? 'font-arabic text-sm' : 'text-[10px] tracking-[0.4em] uppercase'
              )}>
                {c.eyebrow}
              </span>
              <span className="h-px w-10 bg-ember" />
            </div>
          )}
          <h2 className={cn(
            'text-4xl md:text-6xl leading-[1.15] tracking-tight',
            isRTL ? 'font-arabic font-bold leading-[1.4]' : 'font-serif-display'
          )}>
            {c.heading1}{' '}
            <span className={cn('text-ember', !isRTL && 'italic')}>{c.heading2}</span>
          </h2>
          <p className={cn(
            'mt-6 max-w-2xl mx-auto text-white/55',
            isRTL ? 'font-arabic text-base md:text-lg leading-[2] text-center' : 'text-base md:text-lg leading-relaxed font-light'
          )}>
            {c.sub}
          </p>
        </motion.div>

        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, delay: 0.15 }}
          className="relative bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 p-6 md:p-10"
        >
          {/* Phase status readout — HTML so it stays legible at any viewport width */}
          <div className="absolute top-3 right-4 md:top-5 md:right-6 flex items-center gap-2 z-10">
            <span
              className="h-1.5 w-1.5 rounded-full transition-colors duration-500"
              style={{
                backgroundColor: markerColor,
                boxShadow: phaseAtLeast('settled') ? `0 0 6px ${markerColor}` : 'none',
              }}
            />
            <span
              className={cn(
                'text-[10px] uppercase tracking-[0.25em] transition-colors duration-500',
                isRTL && 'font-arabic tracking-normal'
              )}
              style={{ color: markerColor }}
            >
              {phaseLabel}
            </span>
          </div>

          <svg viewBox="0 0 960 480" className="w-full h-auto" role="img" aria-label={c.valleyLabel}>
            {/* Stage bands */}
            {c.stages.map((s, i) => {
              const w = 960 / c.stages.length;
              const x = i * w;
              return (
                <g key={i}>
                  <rect
                    x={x + 4}
                    y={20}
                    width={w - 8}
                    height={26}
                    fill={s.danger ? 'hsl(18 92% 55%)' : 'rgba(255,255,255,0.06)'}
                    stroke={s.danger ? 'none' : 'rgba(255,255,255,0.12)'}
                  />
                  <text
                    x={x + w / 2}
                    y={37}
                    textAnchor="middle"
                    fontSize={isRTL ? '11' : '10'}
                    letterSpacing={isRTL ? '0' : '2'}
                    fill={s.danger ? '#000' : 'rgba(255,255,255,0.75)'}
                    fontFamily={fontFamily}
                    fontWeight={isRTL ? 700 : 400}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1="40" y1="60" x2="40" y2="450" stroke="rgba(255,255,255,0.18)" />
            <line x1="40" y1="450" x2="940" y2="450" stroke="rgba(255,255,255,0.18)" />

            <text
              x={isRTL ? 936 : 44}
              y="72"
              textAnchor={isRTL ? 'end' : 'start'}
              fontSize="11"
              fill="rgba(255,255,255,0.5)"
              fontFamily={fontFamily}
              letterSpacing={isRTL ? '0' : '1.5'}
            >
              {c.axisY}
            </text>
            <text
              x={isRTL ? 44 : 900}
              y="468"
              textAnchor={isRTL ? 'start' : 'end'}
              fontSize="11"
              fill="rgba(255,255,255,0.5)"
              fontFamily={fontFamily}
              letterSpacing={isRTL ? '0' : '1.5'}
            >
              {isRTL ? `← ${c.axisX}` : `${c.axisX} →`}
            </text>

            {/* Danger band */}
            <rect
              x={(960 / c.stages.length) * 2 + 4}
              y={60}
              width={(960 / c.stages.length) - 8}
              height={390}
              fill="hsl(18 92% 55%)"
              opacity="0.06"
            />

            {/* Ghost track — always-visible muted base line, doubles as geometry source */}
            <path
              ref={pathRef}
              d={CURVE}
              fill="none"
              stroke={PHASE_COLOR.dormant}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.35"
            />

            {/* Descent segment reveal */}
            {segments && (
              <polyline
                points={segments.descent.points}
                fill="none"
                stroke={PHASE_COLOR.descent}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={segments.descent.length}
                strokeDashoffset={phaseAtLeast('descent') ? 0 : segments.descent.length}
                style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)' }}
              />
            )}

            {/* Ascent segment reveal */}
            {segments && (
              <polyline
                points={segments.ascent.points}
                fill="none"
                stroke={PHASE_COLOR.ascent}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={segments.ascent.length}
                strokeDashoffset={phaseAtLeast('ascent') ? 0 : segments.ascent.length}
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
              />
            )}

            {/* Moving marker */}
            {measured && (
              <g>
                <circle
                  cx={markerPos.x}
                  cy={markerPos.y}
                  r={phaseAtLeast('settled') ? 10 : 7}
                  fill="none"
                  stroke={markerColor}
                  opacity={phaseAtLeast('settled') ? 0.35 : 0}
                  className={phaseAtLeast('settled') && !reducedMotion ? 'animate-pulse' : ''}
                  style={{
                    transition: 'cx 0.9s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), stroke 0.5s, r 0.6s, opacity 0.6s',
                  }}
                />
                <circle
                  cx={markerPos.x}
                  cy={markerPos.y}
                  r="4.5"
                  fill={markerColor}
                  style={{
                    transition: 'cx 0.9s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), fill 0.5s',
                  }}
                />
              </g>
            )}

            {/* Milestones */}
            {MILESTONE_POS.map((p, i) => (
              <motion.g
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.2 }}
              >
                <rect
                  x={p.x - 6}
                  y={p.y - 6}
                  width="12"
                  height="12"
                  transform={`rotate(45 ${p.x} ${p.y})`}
                  fill="black"
                  stroke="hsl(18 92% 55%)"
                  strokeWidth="1.5"
                />
                <text
                  x={p.x}
                  y={p.y - 14}
                  textAnchor="middle"
                  fontSize={isRTL ? '12' : '11'}
                  fill="rgba(255,255,255,0.78)"
                  fontFamily={fontFamily}
                  fontWeight={isRTL ? 600 : 400}
                >
                  {c.milestones[i]}
                </text>
              </motion.g>
            ))}

            {/* Valley label — reveals once the marker reaches the floor */}
            <g
              style={{
                opacity: phaseAtLeast('floor') ? 1 : 0,
                transition: 'opacity 0.8s ease-out',
              }}
            >
              <line x1="430" y1="420" x2="430" y2="455" stroke="hsl(18 92% 55%)" strokeDasharray="3 3" />
              <text
                x="430"
                y="475"
                textAnchor="middle"
                fontSize={isRTL ? '14' : '12'}
                fontWeight="700"
                fill="hsl(18 92% 55%)"
                fontFamily={fontFamily}
                letterSpacing={isRTL ? '0' : '2'}
              >
                {c.valleyLabel}
              </text>
            </g>
          </svg>

          {/* Stage legend below */}
          <div className="mt-8 grid grid-cols-5 gap-2 text-center">
            {c.stages.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className={cn(
                  'text-xs md:text-sm',
                  s.danger ? 'text-ember font-bold' : 'text-white/70',
                  isRTL && 'font-arabic'
                )}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Caption cards */}
        <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 mt-10">
          {c.captions.map((cap, i) => (
            <div key={i} className="bg-black p-8">
              <div className={cn(
                'text-xl md:text-2xl text-ember mb-3',
                isRTL ? 'font-arabic font-bold' : 'font-serif-display'
              )}>
                {cap.t}
              </div>
              <p className={cn(
                'text-sm md:text-base text-white/55',
                isRTL ? 'font-arabic leading-[2]' : 'leading-relaxed'
              )}>
                {cap.b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
