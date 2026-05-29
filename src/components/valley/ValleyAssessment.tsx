import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { AssessmentResult } from './AssessmentResult';

type Stage = 'gate' | 'quiz' | 'analyzing' | 'result';

interface BinaryQ {
  id: string;
  en: string;
  ar: string;
  /** If true: Yes = risky (weight 5), No = safe (weight 1). Reversed otherwise. */
  yesRisky: boolean;
  blindSpot?: string;
}

const QUESTIONS: BinaryQ[] = [
  {
    id: 'q01',
    en: 'Is your cash runway less than 3 months?',
    ar: 'هل مدة بقاء نقدك أقل من 3 أشهر؟',
    yesRisky: true,
    blindSpot: 'Financial denial',
  },
  {
    id: 'q02',
    en: 'Do you avoid opening your cash flow sheet?',
    ar: 'هل تتجنّب فتح جدول التدفق النقدي؟',
    yesRisky: true,
    blindSpot: 'Financial denial',
  },
  {
    id: 'q03',
    en: 'Has your team stopped giving you honest feedback?',
    ar: 'هل توقّف فريقك عن إعطائك تغذية راجعة صادقة؟',
    yesRisky: true,
    blindSpot: 'Leadership isolation',
  },
  {
    id: 'q04',
    en: 'Is there a hard decision you have been avoiding for months?',
    ar: 'هل هناك قرار صعب أجّلتَه لأشهر؟',
    yesRisky: true,
    blindSpot: 'Decision paralysis',
  },
  {
    id: 'q05',
    en: 'Does losing one client or investor mean collapse?',
    ar: 'هل فقدان عميل واحد أو مستثمر يعني الانهيار؟',
    yesRisky: true,
    blindSpot: 'Concentration risk',
  },
  {
    id: 'q06',
    en: 'Has your sleep deteriorated significantly in the last month?',
    ar: 'هل تدهور نومك بشكل ملحوظ خلال الشهر الماضي؟',
    yesRisky: true,
    blindSpot: 'Burnout proximity',
  },
  {
    id: 'q07',
    en: 'Do you feel the company has become your entire identity?',
    ar: 'هل تشعر أن الشركة أصبحت هويتك بالكامل؟',
    yesRisky: true,
    blindSpot: 'Identity fusion',
  },
  {
    id: 'q08',
    en: 'Is the company burning more than it earns with no path to break-even in 6 months?',
    ar: 'هل تحرق الشركة أكثر مما تكسب دون مسار واضح للتعادل خلال 6 أشهر؟',
    yesRisky: true,
    blindSpot: 'Financial denial',
  },
  {
    id: 'q09',
    en: 'Has a co-founder or key team member left in the last 3 months?',
    ar: 'هل غادر شريك مؤسس أو عضو فريق أساسي خلال الأشهر الثلاثة الماضية؟',
    yesRisky: true,
    blindSpot: 'Leadership isolation',
  },
  {
    id: 'q10',
    en: 'Have honest conversations about the company\'s problems become rare?',
    ar: 'هل أصبحت المحادثات الصادقة حول مشاكل الشركة نادرة؟',
    yesRisky: true,
    blindSpot: 'Leadership isolation',
  },
  {
    id: 'q11',
    en: 'When someone warns you about the company, do you get defensive?',
    ar: 'حين يحذّرك أحد بشأن الشركة، هل تدافع فوراً؟',
    yesRisky: true,
    blindSpot: 'Founder denial',
  },
  {
    id: 'q12',
    en: 'Do you have a real written Plan B if the company fails?',
    ar: 'هل لديك خطة بديلة مكتوبة حقيقية إن فشلت الشركة؟',
    yesRisky: false,
    blindSpot: 'No exit plan',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function classify(
  score: number,
  max: number,
  verdicts: Record<string, { title: string; insight: string }>,
) {
  const pct = Math.round((score / max) * 100);
  if (pct < 30)
    return { level: 'STABLE', title: verdicts['STABLE']?.title ?? '', tone: 'text-emerald-400', insight: verdicts['STABLE']?.insight ?? '' };
  if (pct < 55)
    return { level: 'EXPOSED', title: verdicts['EXPOSED']?.title ?? '', tone: 'text-amber-400', insight: verdicts['EXPOSED']?.insight ?? '' };
  if (pct < 78)
    return { level: 'INSIDE THE VALLEY', title: verdicts['INSIDE THE VALLEY']?.title ?? '', tone: 'text-ember', insight: verdicts['INSIDE THE VALLEY']?.insight ?? '' };
  return { level: 'COLLAPSE PROXIMITY', title: verdicts['COLLAPSE PROXIMITY']?.title ?? '', tone: 'text-red-500', insight: verdicts['COLLAPSE PROXIMITY']?.insight ?? '' };
}

function bezier(p0: number, p1: number, p2: number, p3: number, t: number) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

// Curve: M 0 45 C 160 45, 350 240, 450 240 C 550 240, 740 45, 900 45
// viewBox 900×285. Floor at y=240, safe zone at y=45.
function curvePoint(t01: number): { cx: number; cy: number } {
  if (t01 <= 0.5) {
    const t = t01 * 2;
    return { cx: bezier(0, 160, 350, 450, t), cy: bezier(45, 45, 240, 240, t) };
  }
  const t = (t01 - 0.5) * 2;
  return { cx: bezier(450, 550, 740, 900, t), cy: bezier(240, 240, 45, 45, t) };
}

// Maps final risk % to a stable resting position on the curve.
// High risk → floor (t01=0.50). Low risk → recovery (t01=0.85).
function finalMarkerT01(scorePct: number): number {
  if (scorePct < 30) return 0.85;
  if (scorePct < 55) return 0.62;
  return 0.50;
}
function finalMarkerSink(scorePct: number): number {
  if (scorePct < 30) return 0;
  if (scorePct < 55) return 18;
  if (scorePct < 78) return 45;
  return 70;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ValleyAssessment({ onClose }: { onClose?: () => void }) {
  const t = useT();
  const a = t.assessment;
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [stage, setStage] = useState<Stage>('gate');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finalAnswers, setFinalAnswers] = useState<Record<string, number>>({});
  const [gateForm, setGateForm] = useState({ name: '', email: '' });
  const [gateErrors, setGateErrors] = useState<{ name?: string; email?: string }>({});
  const [founderName, setFounderName] = useState<string | null>(null);
  const [founderEmail, setFounderEmail] = useState('');
  const [flashKey, setFlashKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const total = QUESTIONS.length;
  const MAX_SCORE = total * 5; // 60

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────

  const answered = Object.keys(answers).length;
  const partialScore = useMemo(
    () => Object.values(answers).reduce((s, v) => s + v, 0),
    [answers],
  );
  const tension = answered === 0 ? 0 : partialScore / (answered * 5);

  const finalScore = useMemo(
    () => Object.values(finalAnswers).reduce((s, v) => s + v, 0),
    [finalAnswers],
  );
  const finalScorePct = Math.round((finalScore / MAX_SCORE) * 100);

  const isDone = stage === 'analyzing' || stage === 'result';

  // During quiz: marker moves left-to-right with progress + risk sink
  // During analyzing/result: marker rests at risk-based position
  const quizT01 = total === 0 ? 0 : idx / total;
  const dispT01 = isDone ? finalMarkerT01(finalScorePct) : quizT01;
  const dispSink = isDone ? finalMarkerSink(finalScorePct) : tension * 40;

  const { cx: baseCx, cy: baseCy } = curvePoint(dispT01);
  const markerY = Math.min(275, baseCy + dispSink);
  const isDanger = tension > 0.62 || finalScorePct >= 78;
  const markerColor = isDanger ? 'hsl(0 84% 60%)' : 'hsl(18 92% 55%)';

  const verdict = useMemo(() => {
    const s = isDone ? finalScore : partialScore;
    const m = isDone ? MAX_SCORE : MAX_SCORE;
    return classify(s, m, a.verdicts);
  }, [isDone, finalScore, partialScore, MAX_SCORE, a.verdicts]);

  const scorePct = isDone ? finalScorePct : Math.round((partialScore / MAX_SCORE) * 100);

  const blindSpots = useMemo(() => {
    const src = isDone ? finalAnswers : answers;
    const set = new Set<string>();
    QUESTIONS.forEach(q => {
      if ((src[q.id] ?? 0) >= 4 && q.blindSpot) set.add(q.blindSpot);
    });
    return Array.from(set).slice(0, 4);
  }, [isDone, finalAnswers, answers]);

  const riskBucket: 'low' | 'medium' | 'high' =
    verdict.level === 'COLLAPSE PROXIMITY' ? 'high'
    : verdict.level === 'INSIDE THE VALLEY' ? 'medium'
    : 'low';

  // ── Keyboard — Y/N to answer ─────────────────────────────────────────────

  useEffect(() => {
    if (stage !== 'quiz') return;
    const q = QUESTIONS[idx];
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') pickAnswer(true, q);
      if (e.key === 'n' || e.key === 'N') pickAnswer(false, q);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, idx]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const submitGate = () => {
    const errs: typeof gateErrors = {};
    const name = gateForm.name.trim();
    const email = gateForm.email.trim();
    if (name.length < 2)
      errs.name = isRTL ? 'أدخل اسمك الحقيقي' : 'Enter your real name';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      errs.email = isRTL ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email';
    if (Object.keys(errs).length) { setGateErrors(errs); return; }
    setFounderName(name);
    setFounderEmail(email);
    setGateErrors({});
    setStage('quiz');
    setIdx(0);
    setAnswers({});
  };

  const pickAnswer = (userSaysYes: boolean, q: BinaryQ) => {
    const risky = userSaysYes === q.yesRisky;
    const weight = risky ? 5 : 1;
    if (risky) setFlashKey(k => k + 1);
    const newAnswers = { ...answers, [q.id]: weight };
    setAnswers(newAnswers);
    setTimeout(() => {
      if (idx + 1 >= total) {
        doFinalize(newAnswers);
      } else {
        setIdx(i => i + 1);
        rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 220);
  };

  const doFinalize = async (fa: Record<string, number>) => {
    setFinalAnswers(fa);
    setStage('analyzing');
    await new Promise(r => setTimeout(r, 2800));
    // Submit to Supabase
    try {
      const fs = Object.values(fa).reduce((s, v) => s + v, 0);
      const v = classify(fs, MAX_SCORE, a.verdicts);
      const bs = Array.from(new Set(
        QUESTIONS.filter(q => (fa[q.id] ?? 0) >= 4 && q.blindSpot).map(q => q.blindSpot!),
      ));
      await supabase.from('founder_assessments').insert({
        email: founderEmail,
        name: founderName,
        answers: { responses: fa },
        risk_score: fs,
        risk_level: v.level,
        blind_spots: bs,
        insight: v.insight,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      } as never);
    } catch (err) {
      console.error('Valley assessment submit failed', err);
    }
    setStage('result');
    rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setStage('gate');
    setIdx(0);
    setAnswers({});
    setFinalAnswers({});
    setGateForm({ name: '', email: '' });
    setFounderName(null);
    setFounderEmail('');
    setFlashKey(0);
    rootRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── SVG ──────────────────────────────────────────────────────────────────

  const CURVE = 'M 0 45 C 160 45, 350 240, 450 240 C 550 240, 740 45, 900 45';
  const isActive = stage === 'quiz' || stage === 'analyzing';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 bg-black text-white overflow-y-auto">

      {/* ── Atmospheric overlays ──────────────────────────────────────── */}
      {isActive && (
        <>
          <motion.div
            className="pointer-events-none fixed inset-0"
            style={{ background: 'hsl(0 0% 0%)' }}
            animate={{ opacity: tension * 0.35 }}
            transition={{ duration: 0.9 }}
          />
          <motion.div
            className="pointer-events-none fixed inset-0"
            animate={{
              background: `radial-gradient(ellipse at 50% 100%, hsl(${isDanger ? '0' : '18'} 100% 35% / ${0.07 + tension * 0.42}), transparent 55%)`,
            }}
            transition={{ duration: 0.9 }}
          />
          <motion.div
            className="pointer-events-none fixed inset-0"
            animate={{
              boxShadow: `inset 0 0 ${80 + tension * 220}px ${20 + tension * 100}px hsl(0 0% 0% / ${0.4 + tension * 0.4})`,
            }}
            transition={{ duration: 0.9 }}
          />
          {flashKey > 0 && (
            <motion.div
              key={`flash-${flashKey}`}
              className="pointer-events-none fixed inset-0 z-10"
              initial={{ opacity: 0.28 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              style={{
                background: `radial-gradient(ellipse at 50% 55%, hsl(${isDanger ? '0' : '8'} 95% 52% / 0.38), transparent 65%)`,
              }}
            />
          )}
        </>
      )}

      {/* ── Close button ─────────────────────────────────────────────── */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-5 right-5 z-[60] p-2 text-white/22 hover:text-white/55 transition-colors"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      )}

      {/* ── Valley SVG — sticky header ────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-black/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 pt-4 pb-3">

          {isActive && (
            <div className={cn('flex items-center justify-between mb-2', isRTL && 'flex-row-reverse')}>
              <span className={cn(
                'text-white/28',
                isRTL ? 'font-arabic text-xs' : 'text-[9px] uppercase tracking-[0.42em]',
              )}>
                {isRTL ? 'النزول' : 'Descent'}
              </span>
              <span className={cn(
                'tabular-nums transition-colors duration-500',
                isRTL ? 'font-arabic text-xs' : 'text-[9px] uppercase tracking-[0.32em]',
                isDanger ? 'text-red-400' : tension > 0.35 ? 'text-ember' : 'text-white/28',
              )}>
                {idx}/{total}
              </span>
            </div>
          )}

          <div className="relative h-[140px]" style={{ overflow: 'visible' }}>
            <svg
              viewBox="0 0 900 285"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
              style={{ overflow: 'visible' }}
            >
              <defs>
                {/* 3-zone gradient: orange (descent) → dark gray (floor) → green (ascent) */}
                <linearGradient id="vaGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"    stopColor="hsl(18 92% 55%)" />
                  <stop offset="40%"   stopColor="hsl(18 92% 55%)" />
                  <stop offset="40.01%" stopColor="hsl(0 0% 28%)" />
                  <stop offset="60%"   stopColor="hsl(0 0% 28%)" />
                  <stop offset="60.01%" stopColor="#7ed957" />
                  <stop offset="100%"  stopColor="#7ed957" />
                </linearGradient>
                <linearGradient id="vaGhostGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"    stopColor="hsl(18 92% 55%)" stopOpacity="0.16" />
                  <stop offset="40%"   stopColor="hsl(18 92% 55%)" stopOpacity="0.16" />
                  <stop offset="40.01%" stopColor="hsl(0 0% 40%)" stopOpacity="0.12" />
                  <stop offset="60%"   stopColor="hsl(0 0% 40%)" stopOpacity="0.12" />
                  <stop offset="60.01%" stopColor="#7ed957" stopOpacity="0.16" />
                  <stop offset="100%"  stopColor="#7ed957" stopOpacity="0.16" />
                </linearGradient>
              </defs>

              {/* Zone labels */}
              {[
                { x: 180, label: isRTL ? 'نزول' : 'DESCENT', color: 'hsl(18 92% 60%)' },
                { x: 450, label: isRTL ? 'القاع'  : 'FLOOR',   color: 'hsl(0 0% 52%)' },
                { x: 720, label: isRTL ? 'صعود'  : 'ASCENT',  color: '#7ed957' },
              ].map(({ x, label, color }) => (
                <text
                  key={label}
                  x={x} y={16}
                  textAnchor="middle"
                  fontSize="16"
                  letterSpacing="1.5"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fill={color}
                  opacity="0.62"
                >
                  {label}
                </text>
              ))}

              {/* Phase dividers */}
              <line x1="360" y1="22" x2="360" y2="278"
                stroke="hsl(0 0% 100% / 0.07)" strokeWidth="1" strokeDasharray="4 7" />
              <line x1="540" y1="22" x2="540" y2="278"
                stroke="hsl(0 0% 100% / 0.07)" strokeWidth="1" strokeDasharray="4 7" />

              {/* Ghost path — always visible, faint gradient */}
              <path d={CURVE} fill="none" stroke="url(#vaGhostGrad)" strokeWidth="2.5" />

              {/* Active trace — draws in progressively, colored by zone */}
              {isActive && (
                <path
                  d={CURVE}
                  fill="none"
                  stroke="url(#vaGrad)"
                  strokeWidth="3.2"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100 - dispT01 * 100}
                  style={{ transition: 'stroke-dashoffset 0.65s cubic-bezier(0.16,1,0.3,1)' }}
                />
              )}

              {/* Marker halos — expand with tension */}
              {isActive && (
                <>
                  <circle
                    cx={baseCx} cy={markerY}
                    r={14 + tension * 22}
                    fill={`hsl(${isDanger ? '0' : '18'} 92% 55% / ${tension * 0.09})`}
                    style={{ transition: 'cx 0.65s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), r 0.9s ease' }}
                  />
                  <circle
                    cx={baseCx} cy={markerY}
                    r={7 + tension * 10}
                    fill={`hsl(${isDanger ? '0' : '18'} 92% 55% / ${0.11 + tension * 0.20})`}
                    style={{ transition: 'cx 0.65s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), r 0.65s ease' }}
                  />
                  <motion.circle
                    animate={{ cx: baseCx, cy: markerY, r: [7, 9, 7] }}
                    transition={{
                      cx: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
                      cy: { duration: stage === 'analyzing' ? 1.8 : 0.9, ease: [0.16, 1, 0.3, 1] },
                      r:  { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    fill={markerColor}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Progress strip (quiz only) */}
          {stage === 'quiz' && (
            <div className={cn('mt-2 flex gap-1.5', isRTL && 'flex-row-reverse')}>
              {QUESTIONS.map((q, i) => (
                <div
                  key={q.id}
                  className="h-px flex-1 transition-all duration-400"
                  style={{
                    backgroundColor:
                      i < idx
                        ? (answers[q.id] >= 4 ? 'hsl(18 92% 55%)' : 'hsl(0 0% 38%)')
                        : i === idx
                        ? 'hsl(0 0% 68%)'
                        : 'hsl(0 0% 100% / 0.08)',
                  }}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 lg:px-10 py-20 min-h-[72vh] flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {/* ─── GATE ─────────────────────────────────────────────────── */}
          {stage === 'gate' && (
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className={isRTL ? 'text-right' : undefined}
            >
              <p className={cn(
                'text-ember mb-6',
                isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.42em]',
              )}>
                {isRTL ? 'قبل أن تبدأ' : 'Before you begin'}
              </p>

              <h2 className={cn(
                'tracking-tight mb-2',
                isRTL
                  ? 'font-arabic font-bold text-3xl md:text-5xl leading-[1.4]'
                  : 'font-serif-display text-3xl md:text-5xl leading-tight',
              )}>
                {isRTL ? 'من نقوم' : 'Who are'}
                <br />
                <span className={cn('text-white/60', !isRTL && 'italic')}>
                  {isRTL ? 'بتشخيصه؟' : 'we diagnosing?'}
                </span>
              </h2>

              <p className={cn(
                'text-white/35 mb-10',
                isRTL ? 'font-arabic text-sm leading-[2]' : 'text-[10px] uppercase tracking-[0.28em]',
              )}>
                {isRTL ? 'إجاباتك سرية.' : 'Your answers are private.'}
              </p>

              <div className="space-y-5 max-w-sm">
                <div>
                  <label className={cn(
                    'block text-white/38 mb-2',
                    isRTL ? 'font-arabic text-sm text-right' : 'text-[10px] uppercase tracking-[0.32em]',
                  )}>
                    {isRTL ? 'الاسم الكامل *' : 'Full name *'}
                  </label>
                  <input
                    autoFocus
                    value={gateForm.name}
                    onChange={e => setGateForm(f => ({ ...f, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && submitGate()}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                    placeholder={isRTL ? 'محمد خليل' : 'Your name'}
                  />
                  {gateErrors.name && (
                    <p className={cn('mt-1.5 text-xs text-ember', isRTL && 'font-arabic text-right')}>
                      {gateErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className={cn(
                    'block text-white/38 mb-2',
                    isRTL ? 'font-arabic text-sm text-right' : 'text-[10px] uppercase tracking-[0.32em]',
                  )}>
                    {isRTL ? 'البريد الإلكتروني *' : 'Email *'}
                  </label>
                  <input
                    type="email"
                    value={gateForm.email}
                    onChange={e => setGateForm(f => ({ ...f, email: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && submitGate()}
                    className="cinematic-input"
                    placeholder="founder@company.com"
                    dir="ltr"
                  />
                  {gateErrors.email && (
                    <p className={cn('mt-1.5 text-xs text-ember', isRTL && 'font-arabic text-right')}>
                      {gateErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={submitGate}
                className={cn(
                  'mt-10 group inline-flex items-center gap-5 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500',
                  isRTL && 'flex-row-reverse',
                )}
              >
                <span className={cn(
                  'text-sm font-semibold',
                  isRTL ? 'font-arabic' : 'uppercase tracking-[0.25em]',
                )}>
                  {isRTL ? 'ادخل التشخيص' : 'Enter the Diagnostic'}
                </span>
                <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
              </button>
            </motion.div>
          )}

          {/* ─── QUIZ ─────────────────────────────────────────────────── */}
          {stage === 'quiz' && (
            <motion.div
              key={`q-${idx}`}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -26 }}
              transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
              className={isRTL ? 'text-right' : undefined}
            >
              {/* Counter */}
              <p className={cn(
                'text-ember mb-8',
                isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.4em]',
              )}>
                {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </p>

              {/* Question text */}
              <h2 className={cn(
                'tracking-tight mb-14',
                isRTL
                  ? 'font-arabic font-bold text-2xl md:text-4xl leading-[1.6]'
                  : 'font-serif-display text-3xl md:text-5xl leading-[1.12]',
              )}>
                {isRTL ? QUESTIONS[idx].ar : QUESTIONS[idx].en}
              </h2>

              {/* Yes / No buttons */}
              <div className={cn('flex gap-4', isRTL && 'flex-row-reverse')}>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.4 }}
                  onClick={() => pickAnswer(true, QUESTIONS[idx])}
                  className="group flex-1 py-7 border border-white/10 hover:border-ember hover:bg-ember/[0.05] transition-all duration-300"
                >
                  <span className={cn(
                    'text-white/80 text-xl md:text-2xl group-hover:text-white transition-colors',
                    isRTL ? 'font-arabic' : 'font-serif-display',
                  )}>
                    {isRTL ? 'نعم' : 'Yes'}
                  </span>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, duration: 0.4 }}
                  onClick={() => pickAnswer(false, QUESTIONS[idx])}
                  className="group flex-1 py-7 border border-white/10 hover:border-white/35 hover:bg-white/[0.03] transition-all duration-300"
                >
                  <span className={cn(
                    'text-white/48 text-xl md:text-2xl group-hover:text-white/75 transition-colors',
                    isRTL ? 'font-arabic' : 'font-serif-display',
                  )}>
                    {isRTL ? 'لا' : 'No'}
                  </span>
                </motion.button>
              </div>

              {/* Keyboard hint */}
              <p className={cn(
                'mt-6 text-white/20',
                isRTL ? 'font-arabic text-xs' : 'text-[9px] uppercase tracking-[0.32em]',
              )}>
                {isRTL ? 'اضغط Y أو N للإجابة' : 'Press Y or N to answer'}
              </p>
            </motion.div>
          )}

          {/* ─── ANALYZING ────────────────────────────────────────────── */}
          {stage === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55 }}
              className="text-center py-20"
            >
              <motion.p
                animate={{ opacity: [0.38, 1, 0.38] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className={cn(
                  'text-ember mb-6',
                  isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.45em]',
                )}
              >
                {isRTL ? 'تحليل الإجابات' : 'Analyzing responses'}
              </motion.p>
              <p className={cn(
                'text-2xl md:text-4xl text-white/80',
                isRTL ? 'font-arabic font-bold leading-[1.7]' : 'font-serif-display italic',
              )}>
                {isRTL ? 'جاري تجميع تشخيصك…' : 'Compiling your diagnosis…'}
              </p>
            </motion.div>
          )}

          {/* ─── RESULT ───────────────────────────────────────────────── */}
          {stage === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <AssessmentResult
                verdict={verdict}
                scorePct={scorePct}
                blindSpots={blindSpots}
                founderName={founderName}
                riskBucket={riskBucket}
                consequence={a.consequences[verdict.level] ?? ''}
                recovery={a.recoveryPaths[verdict.level] ?? ''}
                ctas={a.dynamicCtas[riskBucket]}
                isRTL={isRTL}
                contactPath={getPath('/contact')}
                labels={{
                  diagnosisLabel:        a.diagnosisLabel,
                  shockEyebrow:          a.shockEyebrow,
                  riskScoreLabel:        a.riskScoreLabel,
                  riskLevelLabel:        a.riskLevelLabel,
                  blindSpotsSection:     a.blindSpotsSection,
                  consequencesSection:   a.consequencesSection,
                  recoverySection:       a.recoverySection,
                  nextMoveSection:       a.nextMoveSection,
                  restartDiagnosticLabel: a.restartDiagnosticLabel,
                }}
                onReset={reset}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
