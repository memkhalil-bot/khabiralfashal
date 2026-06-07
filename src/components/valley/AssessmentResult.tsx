import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FirstAidKit } from '@/components/assessment/FirstAidKit';
import { DiagnosticReport } from '@/components/report/DiagnosticReport';

/**
 * AssessmentResult — cinematic diagnosis. One revelation per section.
 * Order: shock → personal read → evidence → blind spots → consequences → action.
 * No dashboard. No SaaS cards. No excessive animation.
 */

function ScoreRing({ pct, accentHsl, isRTL }: { pct: number; accentHsl: string; isRTL: boolean }) {
  const [displayed, setDisplayed] = useState(0);
  const triggered = useRef(false);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - displayed / 100);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    const duration = 1200;
    const start = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - p) ** 3;
      setDisplayed(Math.round(eased * pct));
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [pct]);

  return (
    <div className="relative inline-flex items-center justify-center w-28 h-28">
      <svg width="112" height="112" className="-rotate-90" style={{ overflow: 'visible' }}>
        <circle cx="56" cy="56" r={r} fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth="2.5" />
        <circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke={accentHsl}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 5px ${accentHsl})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          'tabular-nums leading-none text-3xl',
          isRTL ? 'font-arabic font-bold' : 'font-serif-display italic'
        )} style={{ color: accentHsl }}>
          {displayed}
        </span>
      </div>
    </div>
  );
}

type CTA = { title: string; desc: string; intent: string; urgent?: boolean };

export type ReportRequestContext = {
  valleyLeadId: string | null;
  assessmentId: string | null;
  fullName: string | null;
  email: string | null;
  company: string | null;
  riskScore: number | null;
  riskLevel: string | null;
};

interface Props {
  verdict: { level: string; title: string; tone: string; insight: string };
  scorePct: number;
  blindSpots: string[];
  founderName?: string | null;
  riskBucket: 'low' | 'medium' | 'high';
  consequence: string;
  recovery: string;
  ctas: CTA[];
  isRTL: boolean;
  contactPath: string;
  dominantBlindSpot?: string | null;
  reportContext?: ReportRequestContext;
  labels: {
    diagnosisLabel: string;
    shockEyebrow: string;
    riskScoreLabel: string;
    riskLevelLabel: string;
    blindSpotsSection: string;
    consequencesSection: string;
    recoverySection: string;
    nextMoveSection: string;
    restartDiagnosticLabel: string;
  };
  onReset: () => void;
}

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-56px' },
  transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
} as const;

export function AssessmentResult({
  verdict,
  scorePct,
  blindSpots,
  founderName,
  riskBucket,
  consequence,
  recovery,
  ctas,
  isRTL,
  contactPath,
  dominantBlindSpot,
  reportContext,
  labels,
  onReset,
}: Props) {
  // CTAs with intent "report" carry the assessment context to /contact so the
  // submission can be linked back to this exact valley_lead / assessment row.
  const ctaState = (intent: string) => (intent === 'report' ? reportContext : undefined);

  const accent =
    riskBucket === 'high'   ? 'text-red-400'
    : riskBucket === 'medium' ? 'text-ember'
    : 'text-emerald-400';

  const accentHsl =
    riskBucket === 'high'   ? 'hsl(0 84% 60%)'
    : riskBucket === 'medium' ? 'hsl(18 92% 55%)'
    : 'hsl(142 76% 55%)';

  const primaryCta   = ctas[0];
  const secondaryCtas = ctas.slice(1);

  const eyebrow = (text: string, colorClass = 'text-white/28') =>
    cn(
      'text-[10px] uppercase mb-7',
      colorClass,
      isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.42em]'
    );

  return (
    <div className={cn('relative', isRTL && 'text-right')}>

      {/* ── 1 · VERDICT ────────────────────────────────────────────
          The founding sentence. No data. Just the diagnosis.         */}
      <section className="min-h-[55vh] flex flex-col justify-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.25 }}
          className={cn(
            'text-[10px] uppercase mb-10',
            accent,
            isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.5em]'
          )}
        >
          {labels.shockEyebrow}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.7, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-3xl text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.6)]',
            isRTL ? 'font-arabic font-bold leading-[1.3]' : 'font-serif-display font-semibold'
          )}
        >
          <span className={cn(!isRTL && 'italic')}>{verdict.title}</span>
        </motion.h2>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.3, delay: 2.1, ease: [0.16, 1, 0.3, 1] }}
          className={cn('mt-14 h-px w-20 origin-left', isRTL && 'origin-right ml-auto')}
          style={{ background: accentHsl }}
        />
      </section>

      {/* ── 2 · PERSONAL READ ──────────────────────────────────────
          verdict.insight as a standalone revelation — the psychological
          read of this specific founder. The most personal section.    */}
      <section className="border-t border-white/[0.07] pt-20 pb-20">
        {founderName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 2.5 }}
            className={cn(
              'text-[10px] uppercase text-white/28 mb-10',
              isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.42em]'
            )}
          >
            {labels.diagnosisLabel} {founderName}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: founderName ? 2.75 : 2.5, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'text-2xl md:text-[2.15rem] leading-[1.42] text-white/95 max-w-2xl',
            isRTL ? 'font-arabic font-semibold leading-[1.75]' : 'font-serif-display'
          )}
        >
          {verdict.insight}
        </motion.p>
      </section>

      {/* ── 3 · EVIDENCE ───────────────────────────────────────────
          Score and level as supporting data — not the headline.
          The insight delivered the diagnosis; this is the proof.      */}
      <motion.section
        {...reveal}
        className="border-t border-white/[0.07] pt-16 pb-20"
      >
        <div className={cn('flex flex-wrap gap-x-16 gap-y-10 items-end')}>
          <div>
            <p className={cn('text-[10px] uppercase text-white/28 mb-4', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]')}>
              {labels.riskScoreLabel}
            </p>
            <ScoreRing pct={scorePct} accentHsl={accentHsl} isRTL={isRTL} />
          </div>
          <div>
            <p className={cn('text-[10px] uppercase text-white/28 mb-4', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]')}>
              {labels.riskLevelLabel}
            </p>
            <p className={cn('leading-tight', accent, isRTL ? 'font-arabic font-bold text-2xl md:text-4xl' : 'font-serif-display text-3xl md:text-5xl')}>
              {verdict.level}
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── 4 · BLIND SPOTS ────────────────────────────────────────
          Each item is a discovery, not a list entry.                  */}
      {blindSpots.length > 0 && (
        <motion.section {...reveal} className="border-t border-white/[0.07] pt-16 pb-20">
          <p className={eyebrow(labels.blindSpotsSection, 'text-ember')}>
            {labels.blindSpotsSection}
          </p>
          <ul className="max-w-2xl">
            {blindSpots.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-32px' }}
                transition={{ duration: 0.75, delay: i * 0.11, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'flex items-baseline gap-6 border-b border-white/[0.06] py-5',
                  isRTL && 'flex-row-reverse'
                )}
              >
                <span className="font-serif-display text-ember/45 tabular-nums text-lg md:text-xl flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={cn('text-lg md:text-2xl text-white/85', isRTL ? 'font-arabic leading-[1.7]' : 'font-serif-display leading-snug')}>
                  {b}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* ── 5 · CONSEQUENCES ───────────────────────────────────────
          What happens if nothing changes. Stated as prognosis.        */}
      <motion.section {...reveal} className="border-t border-white/[0.07] pt-16 pb-20">
        <p className={eyebrow(labels.consequencesSection, riskBucket === 'high' ? 'text-red-400' : 'text-ember')}>
          {labels.consequencesSection}
        </p>
        <p className={cn(
          'text-xl md:text-3xl leading-[1.45] max-w-3xl',
          riskBucket === 'high' ? 'text-white/92' : 'text-white/82',
          isRTL ? 'font-arabic leading-[1.9]' : 'font-serif-display'
        )}>
          {consequence}
        </p>

        {riskBucket === 'high' && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.5 }}
            className={cn(
              'mt-7 text-sm text-red-400/65',
              isRTL ? 'font-arabic leading-[2]' : 'italic tracking-wide'
            )}
          >
            {isRTL
              ? 'هذا ليس تحذيراً مؤجلاً. هذا ما يحدث الآن.'
              : 'This is not a deferred warning. This is what is happening now.'}
          </motion.p>
        )}
      </motion.section>

      {/* ── 6 · ACTION ─────────────────────────────────────────────
          One clear next move. Dynamic by risk level.                  */}
      <motion.section {...reveal} className="border-t border-white/[0.07] pt-16 pb-10">
        <p className={eyebrow(labels.nextMoveSection, riskBucket === 'high' ? 'text-red-400' : 'text-ember')}>
          {labels.nextMoveSection}
        </p>

        {dominantBlindSpot && (
          <motion.p
            {...reveal}
            className={cn(
              'mb-6 text-sm',
              accent,
              isRTL ? 'font-arabic leading-[2]' : 'font-light tracking-wide'
            )}
          >
            {isRTL
              ? `المنطقة الأعلى خطورة لديك: ${dominantBlindSpot}`
              : `Your highest-risk pattern: ${dominantBlindSpot}`}
          </motion.p>
        )}

        {/* Compact findings summary — value before the ask */}
        <div className="mb-10 p-6 border border-white/[0.08] bg-white/[0.02] max-w-xl">
          <div className={cn('flex flex-wrap gap-x-10 gap-y-3 mb-4', isRTL && 'flex-row-reverse')}>
            <div className={isRTL ? 'text-right' : undefined}>
              <p className={cn('text-[9px] uppercase text-white/28 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
                {labels.riskLevelLabel}
              </p>
              <p className={cn('text-sm font-semibold', accent, isRTL && 'font-arabic')}>
                {verdict.level}
              </p>
            </div>
            <div className={isRTL ? 'text-right' : undefined}>
              <p className={cn('text-[9px] uppercase text-white/28 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
                {labels.riskScoreLabel}
              </p>
              <p className={cn('text-sm font-semibold text-white/80 tabular-nums', isRTL && 'font-arabic')}>
                {scorePct}/100
              </p>
            </div>
          </div>
          <p className={cn('text-sm text-white/55 leading-relaxed', isRTL ? 'font-arabic leading-[1.9] text-right' : 'font-light')}>
            {verdict.tone}
          </p>
        </div>

        <p className={cn('text-base md:text-lg text-white/50 max-w-2xl mb-12', isRTL ? 'font-arabic leading-[2]' : 'font-light leading-relaxed')}>
          {recovery}
        </p>

        {primaryCta && (
          <div className="relative inline-block">
            {primaryCta.urgent && (
              <motion.span
                className="absolute inset-0 pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 0 0px hsl(0 84% 55% / 0.40)',
                    '0 0 0 16px hsl(0 84% 55% / 0.00)',
                  ],
                }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <Link
              to={`${contactPath}?intent=${primaryCta.intent}`}
              state={ctaState(primaryCta.intent)}
              className={cn(
                'group inline-flex items-center gap-5 px-8 py-5 transition-all duration-500',
                primaryCta.urgent
                  ? 'bg-red-500 text-black hover:bg-white'
                  : 'bg-ember text-black hover:bg-white',
                isRTL && 'flex-row-reverse'
              )}
            >
              <span className={cn('text-sm uppercase font-semibold', isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]')}>
                {primaryCta.title}
              </span>
              <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
            </Link>
          </div>
        )}

        {primaryCta?.urgent && (
          <p className={cn(
            'mt-4 text-[10px] uppercase text-red-400/55',
            isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.28em]'
          )}>
            {isRTL ? 'مقاعد محدودة · هذا الأسبوع فقط' : 'Limited intake · This week only'}
          </p>
        )}

        {/* Scarcity — professional, not fake urgency */}
        <p className={cn(
          'mt-6 text-[10px] text-white/22',
          isRTL ? 'font-arabic tracking-normal text-sm' : 'uppercase tracking-[0.3em]'
        )}>
          {isRTL ? 'طاقة استيعابية محدودة هذا الشهر' : 'Limited advisory capacity this month'}
        </p>

        {secondaryCtas.length > 0 && (
          <div className={cn('mt-12 flex flex-col gap-5', isRTL && 'items-end')}>
            {secondaryCtas.map((c, i) => (
              <motion.div
                key={c.intent}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }}
              >
                <Link
                  to={`${contactPath}?intent=${c.intent}`}
                  state={ctaState(c.intent)}
                  className={cn(
                    'group inline-flex items-start gap-4 max-w-sm',
                    isRTL && 'flex-row-reverse text-right'
                  )}
                >
                  <ArrowRight className={cn('size-3 mt-1 flex-shrink-0 text-white/35 group-hover:text-ember transition-colors', isRTL && 'rotate-180')} />
                  <div>
                    <span className={cn(
                      'text-sm text-white/50 group-hover:text-ember transition-colors border-b border-transparent group-hover:border-ember/35 pb-px',
                      isRTL ? 'font-arabic' : undefined
                    )}>
                      {c.title}
                    </span>
                    {c.desc && (
                      <p className={cn('mt-1 text-xs text-white/28 leading-relaxed', isRTL ? 'font-arabic leading-[1.9]' : undefined)}>
                        {c.desc}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ── FIRST AID KIT ───────────────────────────────────────── */}
      <FirstAidKit dominantBlindSpot={dominantBlindSpot} isRTL={isRTL} />

      {/* ── DIAGNOSTIC REPORT ───────────────────────────────────── */}
      <DiagnosticReport
        verdict={verdict}
        scorePct={scorePct}
        blindSpots={blindSpots}
        dominantBlindSpot={dominantBlindSpot}
        riskBucket={riskBucket}
        consequence={consequence}
        recovery={recovery}
        founderName={founderName}
        isRTL={isRTL}
        accentHsl={accentHsl}
      />

      {/* ── RESTART ─────────────────────────────────────────────── */}
      <div className="flex justify-center pt-20 pb-6">
        <button
          onClick={onReset}
          className={cn(
            'inline-flex items-center gap-3 text-[10px] uppercase text-white/22 hover:text-white/50 transition-colors',
            isRTL ? 'font-arabic tracking-normal text-sm flex-row-reverse' : 'tracking-[0.32em]'
          )}
        >
          <RotateCcw className="size-3" /> {labels.restartDiagnosticLabel}
        </button>
      </div>

    </div>
  );
}
