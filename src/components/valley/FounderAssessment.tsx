import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import {
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Phone,
  FileSearch,
  Siren,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { AssessmentResult } from './AssessmentResult';


/**
 * FounderAssessment — cinematic, psychological, in-site diagnostic
 * Replaces external Google Form. One question at a time, dark/orange palette.
 * Saves submissions to public.founder_assessments.
 */

type QType = 'scale' | 'choice';
type Question = {
  id: string;
  chapter: string;      // e.g. "CHAPTER 01 · DENIAL"
  prompt: string;
  sub?: string;
  type: QType;
  options?: { label: string; weight: number; tag?: string }[]; // tag = blind-spot bucket
  // scale: 1 (low risk) → 5 (high risk). weight applied = value
  scaleLabels?: [string, string]; // [minLabel, maxLabel]
  blindSpot?: string; // for scale questions, which bucket
};

// QUESTIONS array removed — questions now come from translations (a.questions)

// Lead capture (start)
const leadSchema = z.object({
  name: z.string().trim().min(2, 'Tell us your name').max(80),
  email: z.string().trim().email('Enter a valid email').max(255),
  company: z.string().trim().max(120).optional(),
  stage: z.string().optional(),
  sector: z.string().optional(),
  country: z.string().optional(),
});
type Lead = z.infer<typeof leadSchema>;

const STAGES = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Early Revenue', 'Growth', 'Survival mode'];

// classify — called with the verdict translations object so it returns bilingual titles/insights
function classify(
  score: number,
  max: number,
  verdicts: Record<string, { title: string; insight: string }>
) {
  const pct = Math.round((score / max) * 100);
  if (pct < 30)
    return {
      level: 'STABLE',
      title: verdicts['STABLE']?.title ?? 'You are outside the valley — for now.',
      tone: 'text-emerald-400',
      ring: 'border-emerald-500/30',
      insight: verdicts['STABLE']?.insight ?? '',
    };
  if (pct < 55)
    return {
      level: 'EXPOSED',
      title: verdicts['EXPOSED']?.title ?? 'You are at the edge of the valley.',
      tone: 'text-amber-400',
      ring: 'border-amber-500/30',
      insight: verdicts['EXPOSED']?.insight ?? '',
    };
  if (pct < 78)
    return {
      level: 'INSIDE THE VALLEY',
      title: verdicts['INSIDE THE VALLEY']?.title ?? 'You are inside the Valley of Death.',
      tone: 'text-ember',
      ring: 'border-ember/40',
      insight: verdicts['INSIDE THE VALLEY']?.insight ?? '',
    };
  return {
    level: 'COLLAPSE PROXIMITY',
    title: verdicts['COLLAPSE PROXIMITY']?.title ?? "You are closer to collapse than you're admitting.",
    tone: 'text-red-500',
    ring: 'border-red-500/40',
    insight: verdicts['COLLAPSE PROXIMITY']?.insight ?? '',
  };
}

type Stage = 'intro' | 'lead' | 'quiz' | 'submitting' | 'result' | 'error';

export function FounderAssessment() {
  const t = useT();
  const a = t.assessment;
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  // Questions come from translations (English or Arabic based on active lang)
  const ACTIVE_QUESTIONS = a.questions;

  const [stage, setStage] = useState<Stage>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [chosenTags, setChosenTags] = useState<Record<string, string>>({}); // qid -> tag
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: '', email: '', company: '', stage: '', sector: '', country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const total = ACTIVE_QUESTIONS.length;
  const maxScore = total * 5;
  const score = useMemo(
    () => Object.values(answers).reduce((s, v) => s + v, 0),
    [answers]
  );
  const verdict = useMemo(() => classify(score, maxScore, a.verdicts), [score, maxScore, a.verdicts]);
  const blindSpots = useMemo(() => {
    const set = new Set<string>();
    ACTIVE_QUESTIONS.forEach((q) => {
      const v = answers[q.id];
      if (v == null) return;
      if (q.type === 'scale' && q.blindSpot && v >= 4) set.add(q.blindSpot);
      if (q.type === 'choice') {
        const tag = chosenTags[q.id];
        if (tag) set.add(tag);
      }
    });
    return Array.from(set).slice(0, 4);
  }, [answers, chosenTags, ACTIVE_QUESTIONS]);
  const valleyScorePct = Math.round((score / maxScore) * 100);

  const progress = stage === 'quiz' ? idx / total : stage === 'result' ? 1 : 0;

  const scrollTop = () =>
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // keyboard navigation
  useEffect(() => {
    if (stage !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      const q = ACTIVE_QUESTIONS[idx];
      if (!q) return;
      if (q.type === 'choice') {
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && n >= 1 && n <= (q.options?.length ?? 0)) {
          const opt = q.options![n - 1];
          pickChoice(opt.weight, opt.tag);
        }
      }
      if (q.type === 'scale') {
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && n >= 1 && n <= 5) pickScale(n);
      }
      if (e.key === 'ArrowLeft' && idx > 0) setIdx((i) => i - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, idx, ACTIVE_QUESTIONS]);

  const pickChoice = (weight: number, tag?: string) => {
    const q = ACTIVE_QUESTIONS[idx];
    setAnswers((a) => ({ ...a, [q.id]: weight }));
    setChosenTags((t) => {
      const next = { ...t };
      if (tag) next[q.id] = tag;
      else delete next[q.id];
      return next;
    });
    advance();
  };
  const pickScale = (value: number) => {
    const q = ACTIVE_QUESTIONS[idx];
    setAnswers((a) => ({ ...a, [q.id]: value }));
    advance();
  };
  const advance = () => {
    setTimeout(() => {
      if (idx + 1 >= total) submit();
      else setIdx(idx + 1);
    }, 220);
  };

  const submitLead = () => {
    const parsed = leadSchema.safeParse(leadForm);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setLead(parsed.data);
    setStage('quiz');
    setIdx(0);
    setAnswers({});
    setChosenTags({});
    scrollTop();
  };

  const submit = async () => {
    setStage('submitting');
    const v = classify(score, maxScore, a.verdicts);
    const bs: string[] = [];
    ACTIVE_QUESTIONS.forEach((q) => {
      const val = answers[q.id];
      if (val == null) return;
      if (q.type === 'scale' && q.blindSpot && val >= 4) bs.push(q.blindSpot);
      if (q.type === 'choice') {
        const tag = chosenTags[q.id];
        if (tag) bs.push(tag);
      }
    });
    const uniqBs = Array.from(new Set(bs));

    try {
      const payload = {
        email: lead?.email ?? '',
        name: lead?.name ?? null,
        company: lead?.company ?? null,
        stage: lead?.stage ?? null,
        sector: lead?.sector ?? null,
        country: lead?.country ?? null,
        answers: { responses: answers, picked: chosenTags },
        risk_score: score,
        risk_level: v.level,
        blind_spots: uniqBs,
        insight: v.insight,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      };
      const { error } = await supabase
        .from('founder_assessments')
        .insert(payload as never);
      if (error) throw error;
      setStage('result');
      scrollTop();
    } catch (err) {
      console.error('assessment submit failed', err);
      setSubmitError(
        err instanceof Error ? err.message : 'Submission failed. Please try again.'
      );
      setStage('error');
    }
  };

  const reset = () => {
    setStage('intro');
    setIdx(0);
    setAnswers({});
    setChosenTags({});
    setSubmitError(null);
    scrollTop();
  };

  // Tension drives atmospheric overlay color + descent curve position
  const answered = Object.keys(answers).length;
  const partialMax = Math.max(answered, 1) * 5;
  const partialScore = Object.values(answers).reduce((s, v) => s + v, 0);
  const tension = answered === 0 ? 0 : partialScore / partialMax; // 0..1
  const stateIdx = Math.min(4, Math.floor(tension * 5));

  return (
    <section
      ref={rootRef}
      className="relative border-t border-white/5 bg-black text-white overflow-hidden"
    >
      {/* ambient bg */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.10),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Atmospheric tension overlay — reddens as the founder descends */}
      {(stage === 'quiz' || stage === 'submitting') && (
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          initial={false}
          animate={{
            opacity: 0.15 + tension * 0.55,
            background: `radial-gradient(ellipse at 50% 80%, hsl(${stateIdx >= 4 ? '0' : '14'} ${60 + tension * 30}% ${20 + tension * 10}% / ${0.25 + tension * 0.45}), transparent 70%)`,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      {/* Vignette that tightens at high tension */}
      {(stage === 'quiz' || stage === 'submitting') && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{
            boxShadow: `inset 0 0 ${120 + tension * 220}px ${40 + tension * 80}px hsl(0 0% 0% / ${0.4 + tension * 0.4})`,
          }}
          transition={{ duration: 0.9 }}
        />
      )}

      {/* Descent bar with mini valley curve + avatar — no visible question count */}
      {(stage === 'quiz' || stage === 'submitting') && (() => {
        const stateLabel = a.emotionalStates[stateIdx] ?? '';
        const t01 = progress;
        const cx = 4 + t01 * 92;
        const valleyY = 6 + 14 * Math.sin(Math.PI * Math.min(1, t01));
        return (
          <div className="sticky top-0 z-20 backdrop-blur-md bg-black/70 border-b border-white/10">
            <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
              <span className={cn(
                'text-[10px] uppercase text-white/40 hidden sm:inline',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
              )}>
                {a.diagnosticProgress}
              </span>
              <div className="flex-1 relative h-7">
                <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
                  <path d="M 0 6 Q 25 6, 50 20 T 100 6" fill="none" stroke="hsl(0 0% 100% / 0.12)" strokeWidth="0.5" />
                  <path
                    d="M 0 6 Q 25 6, 50 20 T 100 6"
                    fill="none"
                    stroke={stateIdx >= 4 ? 'hsl(0 84% 60%)' : 'hsl(18 92% 55%)'}
                    strokeWidth="0.6"
                    strokeDasharray="100"
                    strokeDashoffset={100 - t01 * 100}
                    style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
                  />
                  <circle cx={cx} cy={valleyY} r="3.5" fill={stateIdx >= 4 ? 'hsl(0 84% 60% / 0.18)' : 'hsl(18 92% 55% / 0.18)'} />
                  <motion.circle
                    cx={cx}
                    cy={valleyY}
                    r={1.6}
                    fill={stateIdx >= 4 ? 'hsl(0 84% 60%)' : 'hsl(18 92% 55%)'}
                    animate={{ r: [1.4, 2.1, 1.4] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </svg>
              </div>
              <span className={cn(
                'text-[10px] uppercase whitespace-nowrap',
                stateIdx >= 4 ? 'text-red-400' : stateIdx >= 3 ? 'text-ember' : 'text-white/50',
                isRTL ? 'font-arabic text-sm tracking-normal' : 'tracking-[0.3em]'
              )}>
                {stateLabel}
              </span>
            </div>
          </div>
        );
      })()}

      <div className="relative max-w-3xl mx-auto px-6 lg:px-10 py-20 md:py-28 min-h-[80vh] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* ================= INTRO ================= */}
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className={isRTL ? 'text-right' : undefined}
            >
              {a.diagnosticLabel && (
                <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse text-xs')}>
                  <span className="h-px w-12 bg-ember" />
                  <span className={cn(
                    'text-xs uppercase text-ember font-medium',
                    isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
                  )}>
                    {a.diagnosticLabel}
                  </span>
                </div>
              )}
              {(a.introHeading1 || a.introHeading2) && (
                <h2 className={cn(
                  'text-4xl md:text-6xl leading-[1.05] tracking-tight',
                  isRTL ? 'font-arabic font-bold leading-[1.4]' : 'font-serif-display'
                )}>
                  {a.introHeading1}
                  {a.introHeading1 && a.introHeading2 && <br />}
                  <span className={cn('text-ember', !isRTL && 'italic')}>{a.introHeading2}</span>
                </h2>
              )}
              <p className={cn(
                'mt-8 text-white/60 text-lg leading-relaxed max-w-xl',
                isRTL && 'leading-[2.2]'
              )}>
                {a.introDesc}
              </p>
              <ul className={cn('mt-10 grid gap-3 text-sm text-white/55 max-w-md', isRTL && 'text-right')}>
                {a.introBullets.map((bullet) => (
                  <li key={bullet} className={cn('flex items-start gap-3', isRTL && 'flex-row-reverse')}>
                    <span className="mt-2 size-1 rounded-full bg-ember flex-shrink-0" />
                    <span className={isRTL ? 'font-arabic leading-[2]' : undefined}>{bullet}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setStage('lead')}
                className={cn(
                  'mt-12 group inline-flex items-center gap-5 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500',
                  isRTL && 'flex-row-reverse'
                )}
              >
                <span className={cn(
                  'text-sm uppercase font-semibold',
                  isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]'
                )}>
                  {a.beginButton}
                </span>
                <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
              </button>
            </motion.div>
          )}

          {/* ================= LEAD ================= */}
          {stage === 'lead' && (
            <motion.div
              key="lead"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className={isRTL ? 'text-right' : undefined}
            >
              <p className={cn(
                'text-[11px] uppercase text-ember mb-6',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
              )}>
                {a.leadLabel}
              </p>
              <h2 className={cn(
                'text-3xl md:text-5xl leading-tight',
                isRTL ? 'font-arabic font-bold leading-[1.4]' : 'font-serif-display'
              )}>
                {a.leadHeading1}
                <br />
                <span className={cn('text-white/70', !isRTL && 'italic')}>{a.leadHeading2}</span>
              </h2>

              <div className="mt-10 grid md:grid-cols-2 gap-6">
                <AssessField label={a.fieldName} error={errors.name} isRTL={isRTL}>
                  <input
                    autoFocus
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                    placeholder="Mohamed Khalil"
                  />
                </AssessField>
                <AssessField label={a.fieldEmail} error={errors.email} isRTL={isRTL}>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="cinematic-input"
                    placeholder="founder@company.com"
                    dir="ltr"
                  />
                </AssessField>
                <AssessField label={a.fieldCompany} isRTL={isRTL}>
                  <input
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                  />
                </AssessField>
                <AssessField label={a.fieldStage} isRTL={isRTL}>
                  <select
                    value={leadForm.stage}
                    onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                  >
                    <option value="">{a.fieldStageDefault}</option>
                    {a.stages.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </AssessField>
                <AssessField label={a.fieldSector} isRTL={isRTL}>
                  <input
                    value={leadForm.sector}
                    onChange={(e) => setLeadForm({ ...leadForm, sector: e.target.value })}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                    placeholder="SaaS, FinTech, E-commerce…"
                  />
                </AssessField>
                <AssessField label={a.fieldCountry} isRTL={isRTL}>
                  <input
                    value={leadForm.country}
                    onChange={(e) => setLeadForm({ ...leadForm, country: e.target.value })}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                    placeholder="UAE, KSA, Egypt…"
                  />
                </AssessField>
              </div>

              <div className={cn('mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4', isRTL && 'sm:flex-row-reverse')}>
                <button
                  onClick={submitLead}
                  className={cn(
                    'group inline-flex items-center gap-5 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500',
                    isRTL && 'flex-row-reverse'
                  )}
                >
                  <span className={cn(
                    'text-sm uppercase font-semibold',
                    isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]'
                  )}>
                    {a.enterButton}
                  </span>
                  <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
                </button>
                <p className={cn('text-xs text-white/40 max-w-xs leading-relaxed', isRTL && 'font-arabic leading-[2] text-right')}>
                  {a.confidentialNote}
                </p>
              </div>
            </motion.div>
          )}

          {/* ================= QUIZ ================= */}
          {stage === 'quiz' && (
            <motion.div
              key={`q-${idx}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className={isRTL ? 'text-right' : undefined}
            >
              <p className={cn(
                'text-[11px] uppercase text-ember mb-6',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.35em]'
              )}>
                {ACTIVE_QUESTIONS[idx].chapter}
              </p>
              <h2 className={cn(
                'text-3xl md:text-5xl leading-[1.15] tracking-tight',
                isRTL ? 'font-arabic font-bold leading-[1.5]' : 'font-serif-display'
              )}>
                {ACTIVE_QUESTIONS[idx].prompt}
              </h2>
              {ACTIVE_QUESTIONS[idx].sub && (
                <p className={cn(
                  'mt-5 text-white/45 text-base max-w-xl leading-relaxed',
                  isRTL ? 'font-arabic leading-[2]' : 'italic'
                )}>
                  {ACTIVE_QUESTIONS[idx].sub}
                </p>
              )}

              <div className="mt-12">
                {ACTIVE_QUESTIONS[idx].type === 'choice' ? (
                  <div className="grid gap-3">
                    {ACTIVE_QUESTIONS[idx].options!.map((opt, i) => (
                      <motion.button
                        key={opt.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                        onClick={() => pickChoice(opt.weight, opt.tag)}
                        className={cn(
                          'group flex items-start gap-5 px-6 py-5 border border-white/10 hover:border-ember hover:bg-ember/[0.04] transition-all duration-300',
                          isRTL ? 'text-right flex-row-reverse' : 'text-left'
                        )}
                      >
                        <span className="font-serif-display text-2xl text-white/30 group-hover:text-ember transition-colors tabular-nums flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className={cn(
                          'text-white/85 text-base md:text-lg leading-snug pt-1',
                          isRTL && 'font-arabic leading-[1.8]'
                        )}>
                          {opt.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-5 gap-2 md:gap-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <motion.button
                          key={n}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * n, duration: 0.35 }}
                          onClick={() => pickScale(n)}
                          className="group relative aspect-square border border-white/10 hover:border-ember hover:bg-ember/10 transition-all duration-300 flex items-center justify-center"
                        >
                          <span className="font-serif-display text-3xl md:text-4xl text-white/40 group-hover:text-ember transition-colors">
                            {n}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    <div className={cn(
                      'mt-4 flex justify-between text-[10px] uppercase text-white/35',
                      isRTL ? 'font-arabic tracking-normal text-sm flex-row-reverse' : 'tracking-[0.25em]'
                    )}>
                      <span>{ACTIVE_QUESTIONS[idx].scaleLabels?.[0]}</span>
                      <span>{ACTIVE_QUESTIONS[idx].scaleLabels?.[1]}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={cn(
                'mt-12 flex items-center justify-between text-[10px] uppercase text-white/35',
                isRTL ? 'font-arabic tracking-normal text-sm flex-row-reverse' : 'tracking-[0.3em]'
              )}>
                <button
                  onClick={() => idx > 0 && setIdx(idx - 1)}
                  disabled={idx === 0}
                  className={cn(
                    'inline-flex items-center gap-2 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
                    isRTL && 'flex-row-reverse'
                  )}
                >
                  <ArrowLeft className={cn('size-3', isRTL && 'rotate-180')} /> {a.backButton}
                </button>
                <span className="hidden sm:inline">{a.pressHint.replace('{max}', String(ACTIVE_QUESTIONS[idx].type === 'choice' ? ACTIVE_QUESTIONS[idx].options!.length : 5))}</span>
                <button
                  onClick={reset}
                  className={cn('inline-flex items-center gap-2 hover:text-white transition-colors', isRTL && 'flex-row-reverse')}
                >
                  <RotateCcw className="size-3" /> {a.restartButton}
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= SUBMITTING ================= */}
          {stage === 'submitting' && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center py-20"
            >
              <Loader2 className="mx-auto size-10 text-ember animate-spin" />
              <p className={cn(
                'mt-8 text-[11px] uppercase text-white/50',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.35em]'
              )}>
                {a.analyzingLabel}
              </p>
              <p className={cn(
                'mt-3 text-2xl text-white/80',
                isRTL ? 'font-arabic font-bold' : 'font-serif-display italic'
              )}>
                {a.analyzingHeading}
              </p>
            </motion.div>
          )}

          {/* ================= ERROR ================= */}
          {stage === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-20"
            >
              <p className={cn(
                'text-[11px] uppercase text-red-400',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.35em]'
              )}>
                {a.errorLabel}
              </p>
              <p className="mt-4 text-white/70">{submitError}</p>
              <button
                onClick={submit}
                className={cn(
                  'mt-8 px-6 py-3 border border-white/20 hover:border-ember hover:text-ember text-sm uppercase transition-colors',
                  isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]'
                )}
              >
                {a.retryButton}
              </button>
            </motion.div>
          )}

          {/* ================= RESULT ================= */}
          {stage === 'result' && (() => {
            const riskBucket: 'low' | 'medium' | 'high' =
              verdict.level === 'COLLAPSE PROXIMITY'
                ? 'high'
                : verdict.level === 'INSIDE THE VALLEY'
                ? 'medium'
                : 'low';
            const ctas = a.dynamicCtas[riskBucket];
            const consequence = a.consequences[verdict.level] ?? '';
            const recovery = a.recoveryPaths[verdict.level] ?? '';
            return (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <AssessmentResult
                  verdict={verdict}
                  scorePct={valleyScorePct}
                  blindSpots={blindSpots}
                  founderName={lead?.name}
                  riskBucket={riskBucket}
                  consequence={consequence}
                  recovery={recovery}
                  ctas={ctas}
                  isRTL={isRTL}
                  contactPath={getPath('/contact')}
                  labels={{
                    diagnosisLabel: a.diagnosisLabel,
                    shockEyebrow: a.shockEyebrow,
                    riskScoreLabel: a.riskScoreLabel,
                    riskLevelLabel: a.riskLevelLabel,
                    blindSpotsSection: a.blindSpotsSection,
                    consequencesSection: a.consequencesSection,
                    recoverySection: a.recoverySection,
                    nextMoveSection: a.nextMoveSection,
                    restartDiagnosticLabel: a.restartDiagnosticLabel,
                  }}
                  onReset={reset}
                />
              </motion.div>
            );
          })()}

        </AnimatePresence>
      </div>
    </section>
  );
}

function AssessField({
  label, error, isRTL, children,
}: { label: string; error?: string; isRTL?: boolean; children: React.ReactNode }) {
  return (
    <div className={isRTL ? 'text-right' : undefined}>
      <label className={cn(
        'block text-[10px] uppercase text-white/45 mb-3',
        isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
      )}>
        {label}
      </label>
      {children}
      {error && <p className={cn('mt-2 text-xs text-ember', isRTL && 'font-arabic')}>{error}</p>}
    </div>
  );
}

function ResultCTA({
  to, icon, title, desc, primary, urgent, isRTL, continueLabel,
}: { to: string; icon: React.ReactNode; title: string; desc: string; primary?: boolean; urgent?: boolean; isRTL?: boolean; continueLabel?: string }) {
  return (
    <Link
      to={to}
      className={cn(
        'group relative block p-6 border transition-all duration-500 overflow-hidden',
        urgent
          ? 'border-red-500/60 bg-red-950/30 hover:bg-red-500 hover:text-black'
          : primary
          ? 'border-ember bg-ember/[0.08] hover:bg-ember hover:text-black'
          : 'border-white/10 hover:border-ember hover:bg-white/[0.03]'
      )}
    >
      {urgent && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, hsl(0 84% 45% / 0.18), transparent 70%)',
          }}
        />
      )}
      <div className={cn(
        'relative mb-5',
        urgent ? 'text-red-400 group-hover:text-black' : primary ? 'text-ember group-hover:text-black' : 'text-ember'
      )}>
        {icon}
      </div>
      <h4 className={cn(
        'relative text-xl mb-3 leading-snug',
        isRTL ? 'font-arabic font-bold text-right leading-[1.5]' : 'font-serif-display'
      )}>
        {title}
      </h4>
      <p className={cn(
        'relative text-sm leading-relaxed',
        isRTL ? 'font-arabic text-right leading-[2]' : '',
        urgent ? 'text-white/75 group-hover:text-black/75' : primary ? 'text-white/70 group-hover:text-black/70' : 'text-white/50'
      )}>
        {desc}
      </p>
      <div className={cn(
        'relative mt-6 inline-flex items-center gap-2 text-[10px] uppercase transition-colors',
        isRTL ? 'font-arabic tracking-normal text-sm flex-row-reverse' : 'tracking-[0.3em]',
        urgent || primary ? 'text-white group-hover:text-black' : 'text-white/60 group-hover:text-ember'
      )}>
        {continueLabel ?? 'Continue'} <ArrowRight className={cn('size-3', isRTL && 'rotate-180')} />
      </div>
    </Link>
  );
}
