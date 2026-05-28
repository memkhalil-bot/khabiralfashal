import { motion } from 'framer-motion';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * ValleyCurve — animated Valley of Death diagram, fully language-aware.
 * Labels are driven entirely by translations. No mixed-language SVG.
 */

const CURVE = 'M 60 215 C 180 235, 280 410, 430 420 S 680 320, 900 90';
const MILESTONE_POS = [
  { x: 110, y: 250 },
  { x: 230, y: 320 },
  { x: 360, y: 395 },
  { x: 555, y: 320 },
  { x: 820, y: 145 },
];

export function ValleyCurve() {
  const t = useT();
  const c = t.valley.curve;
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const fontFamily = isRTL ? 'Cairo, sans-serif' : 'ui-sans-serif, system-ui';

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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, delay: 0.15 }}
          className="relative bg-gradient-to-b from-white/[0.02] to-transparent border border-white/10 p-6 md:p-10"
        >
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

            {/* Curve */}
            <motion.path
              d={CURVE}
              fill="none"
              stroke="hsl(18 92% 55%)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.path
              d={CURVE}
              fill="none"
              stroke="hsl(18 92% 55%)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.18"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
            />

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

            {/* Valley label */}
            <motion.g
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 1.6 }}
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
            </motion.g>
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
