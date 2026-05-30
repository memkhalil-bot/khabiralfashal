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

// ── Gate validation helpers ───────────────────────────────────────────────────

const DISPOSABLE_DOMAINS = new Set([
  'test.com','example.com','mailinator.com','guerrillamail.com','yopmail.com',
  'tempmail.com','throwaway.email','fakeinbox.com','trashmail.com','spam.la',
  'sharklasers.com','guerrillamailblock.com','grr.la','10minutemail.com',
  'temp-mail.org','dispostable.com','maildrop.cc','mailnull.com',
  'trashmail.at','trashmail.io','getairmail.com','spamgourmet.com',
]);

const FAKE_NAME_SET = new Set([
  'test','asdf','qwer','qwerty','user','name','anon','none','null','undefined',
  'fake','admin','hello','aaa','bbb','ccc','xxx','yyy','zzz','abc','xyz',
  'مستخدم','اسم','اختبار','مجهول',
]);

const KEYBOARD_SEQS = ['qwer','asdf','zxcv','1234','5678','9012','qwerty','asdfgh','zxcvbn'];

function _hasExcessiveRepeat(s: string): boolean {
  // 4+ identical chars in a row: "aaaa", "1111"
  return /(.)\1{3,}/.test(s.replace(/\s+/g, '').toLowerCase());
}

function _isKeyboardSeq(s: string): boolean {
  const lower = s.toLowerCase().replace(/\s+/g, '');
  return KEYBOARD_SEQS.some(seq => lower.includes(seq));
}

function _hasEnoughDistinctChars(s: string, min: number): boolean {
  return new Set(s.replace(/\s+/g, '').toLowerCase()).size >= min;
}

function _hasLetter(s: string): boolean {
  return /[a-zA-Z؀-ۿ]/.test(s);
}

// Lead capture (start)
const leadSchema = z.object({
  name:    z.string().trim().min(2).max(80),
  email:   z.string().trim().email().max(255),
  company: z.string().trim().max(120).optional(),
  stage:   z.string().optional(),
  sector:  z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(80),
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

export function FounderAssessment({ autoStart = false }: { autoStart?: boolean }) {
  const t = useT();
  const a = t.assessment;
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  // Questions come from translations (English or Arabic based on active lang)
  const ACTIVE_QUESTIONS = a.questions;

  const [stage, setStage] = useState<Stage>(autoStart ? 'lead' : 'intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [chosenTags, setChosenTags] = useState<Record<string, string>>({}); // qid -> tag
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: '', email: '', company: '', stage: '', sector: '', country: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
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
    if (weight >= 4) setFlashKey(k => k + 1);
    advance();
  };
  const pickScale = (value: number) => {
    const q = ACTIVE_QUESTIONS[idx];
    setAnswers((a) => ({ ...a, [q.id]: value }));
    if (value >= 4) setFlashKey(k => k + 1);
    advance();
  };
  const advance = () => {
    setTimeout(() => {
      if (idx + 1 >= total) submit();
      else setIdx(idx + 1);
    }, 220);
  };

  const submitLead = () => {
    const errs: Record<string, string> = {};
    const ar = lang === 'ar';
    const f  = leadForm;

    // ── Name ─────────────────────────────────────────────────────────────────
    const name = f.name.trim();
    if (name.length < 2) {
      errs.name = ar ? 'أدخل اسمك الحقيقي' : 'Enter your real name';
    } else if (!_hasLetter(name)) {
      errs.name = ar ? 'يجب أن يحتوي الاسم على أحرف' : 'Name must contain letters';
    } else if (_hasExcessiveRepeat(name)) {
      errs.name = ar ? 'الاسم يبدو غير حقيقي' : 'Name does not look real';
    } else if (!_hasEnoughDistinctChars(name, 2)) {
      errs.name = ar ? 'الاسم يبدو غير حقيقي' : 'Name does not look real';
    } else if (FAKE_NAME_SET.has(name.toLowerCase())) {
      errs.name = ar ? 'أدخل اسمك الحقيقي' : 'Enter your real name';
    } else if (_isKeyboardSeq(name)) {
      errs.name = ar ? 'أدخل اسمك الحقيقي' : 'Enter your real name';
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    const email = f.email.trim();
    if (!email) {
      errs.email = ar ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errs.email = ar ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email address';
    } else {
      const atIdx = email.lastIndexOf('@');
      const local  = email.slice(0, atIdx).toLowerCase();
      const domain = email.slice(atIdx + 1).toLowerCase();
      if (DISPOSABLE_DOMAINS.has(domain)) {
        errs.email = ar ? 'الرجاء استخدام بريد إلكتروني حقيقي' : 'Please use a real email address';
      } else if (local.length < 3) {
        errs.email = ar ? 'البريد الإلكتروني يبدو غير صحيح' : 'Email address looks invalid';
      } else if (_hasExcessiveRepeat(local)) {
        errs.email = ar ? 'البريد الإلكتروني يبدو غير حقيقي' : 'Email address does not look real';
      } else if (_isKeyboardSeq(local)) {
        errs.email = ar ? 'الرجاء استخدام بريد إلكتروني حقيقي' : 'Please use a real email address';
      }
    }

    // ── Sector ────────────────────────────────────────────────────────────────
    const sector = f.sector.trim();
    if (!sector) {
      errs.sector = ar ? 'القطاع مطلوب' : 'Sector is required';
    } else if (!_hasLetter(sector)) {
      errs.sector = ar ? 'أدخل قطاعاً حقيقياً' : 'Enter a real sector';
    } else if (_hasExcessiveRepeat(sector)) {
      errs.sector = ar ? 'أدخل قطاعاً حقيقياً' : 'Enter a real sector';
    }

    // ── Country ───────────────────────────────────────────────────────────────
    const country = f.country.trim();
    if (!country) {
      errs.country = ar ? 'الدولة مطلوبة' : 'Country is required';
    } else if (!_hasLetter(country)) {
      errs.country = ar ? 'أدخل دولة حقيقية' : 'Enter a real country';
    } else if (_hasExcessiveRepeat(country)) {
      errs.country = ar ? 'أدخل دولة حقيقية' : 'Enter a real country';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setLead({
      name,
      email,
      sector,
      country,
      company: f.company?.trim() || undefined,
      stage:   f.stage || undefined,
    });
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

      {/* Darkness grows as founder descends — scene deepens toward black */}
      {(stage === 'quiz' || stage === 'submitting') && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ opacity: tension * 0.32 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: 'hsl(0 0% 0%)' }}
        />
      )}
      {/* Danger upwelling — ember/red glow rises from the valley floor */}
      {(stage === 'quiz' || stage === 'submitting') && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{
            background: `radial-gradient(ellipse at 50% 95%, hsl(${stateIdx >= 4 ? '0' : '18'} 100% 35% / ${0.10 + tension * 0.55}), transparent 58%)`,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
      {/* Vignette crushes edges as tension climbs */}
      {(stage === 'quiz' || stage === 'submitting') && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{
            boxShadow: `inset 0 0 ${80 + tension * 260}px ${20 + tension * 130}px hsl(0 0% 0% / ${0.45 + tension * 0.45})`,
          }}
          transition={{ duration: 0.9 }}
        />
      )}
      {/* Risky answer flash — brief red/amber pulse on high-weight selections */}
      {stage === 'quiz' && flashKey > 0 && (
        <motion.div
          key={`flash-${flashKey}`}
          className="pointer-events-none absolute inset-0 z-10"
          initial={{ opacity: 0.32 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          style={{ background: `radial-gradient(ellipse at 50% 55%, hsl(${stateIdx >= 4 ? '0' : '8'} 95% 52% / 0.42), transparent 65%)` }}
        />
      )}

      {/* Descent bar — valley depth driven by progress + risk accumulation */}
      {(stage === 'quiz' || stage === 'submitting') && (() => {
        const stateLabel = a.emotionalStates[stateIdx] ?? '';
        const t01 = progress;

        // ── On-curve bezier position ────────────────────────────────────────
        // Path: M 0 35  C 180 35, 360 165, 450 165  C 540 165, 720 35, 900 35
        // viewBox 900×200. Y=35 = safe zone top. Y=165 = valley floor. 130-unit descent.
        // Segment 1 (t01 0→0.5): P0=(0,35)   P1=(180,35)  P2=(360,165) P3=(450,165)
        // Segment 2 (t01 0.5→1): P0=(450,165) P1=(540,165) P2=(720,35)  P3=(900,35)
        const { cx, onCurveY } = (() => {
          if (t01 <= 0.5) {
            const t = t01 * 2, mt = 1 - t;
            return {
              cx:       mt*mt*mt*0   + 3*mt*mt*t*180 + 3*mt*t*t*360 + t*t*t*450,
              onCurveY: mt*mt*mt*35  + 3*mt*mt*t*35  + 3*mt*t*t*165 + t*t*t*165,
            };
          }
          const t = (t01 - 0.5) * 2, mt = 1 - t;
          return {
            cx:       mt*mt*mt*450 + 3*mt*mt*t*540 + 3*mt*t*t*720 + t*t*t*900,
            onCurveY: mt*mt*mt*165 + 3*mt*mt*t*165 + 3*mt*t*t*35  + t*t*t*35,
          };
        })();

        // Risky answers sink the marker below the reference curve — 32 units max
        const riskSink  = tension * 32;
        const valleyY   = Math.min(192, onCurveY + riskSink);
        const sinkDepth = valleyY - onCurveY;

        const healthPct   = Math.round((1 - tension) * 100);
        const healthColor = healthPct > 65 ? '#34d399' : healthPct > 35 ? '#fbbf24' : '#f87171';
        const accent      = stateIdx >= 4 ? 'hsl(0 84% 60%)' : 'hsl(18 92% 55%)';

        const borderColor =
          stateIdx >= 4 ? 'hsl(0 84% 60% / 0.35)'
          : stateIdx >= 3 ? 'hsl(18 92% 55% / 0.30)'
          : stateIdx >= 2 ? 'hsl(38 92% 55% / 0.18)'
          : 'hsl(0 0% 100% / 0.07)';

        // Zone based on marker depth: Y=35 (safe top) → Y=192 (floor+sink max)
        const zoneIdx =
          valleyY < 72  ? 0
          : valleyY < 115 ? 1
          : valleyY < 158 ? 2
          : 3;

        return (
          <div
            className="sticky top-0 z-20 backdrop-blur-md"
            style={{
              backgroundColor: `hsl(0 0% 0% / ${0.72 + tension * 0.18})`,
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <div className="max-w-3xl mx-auto px-6 pt-3 pb-2">

              {/* Top row: label + health readout */}
              <div className={cn('flex items-center justify-between mb-2', isRTL && 'flex-row-reverse')}>
                <span className={cn(
                  'text-[9px] text-white/30',
                  isRTL ? 'font-arabic tracking-normal text-xs' : 'uppercase tracking-[0.4em]',
                )}>
                  {a.diagnosticProgress}
                </span>
                <span
                  className={cn('text-[9px] tabular-nums', isRTL ? 'font-arabic text-xs' : 'uppercase tracking-[0.3em]')}
                  style={{ color: healthColor }}
                >
                  {isRTL ? `${healthPct}٪ صحة` : `${healthPct}% health`}
                </span>
              </div>

              {/* Valley SVG — clarity-first, 160px tall, readable labels, visible descent */}
              <div className="relative h-[160px]" style={{ overflow: 'visible' }}>
                <svg
                  viewBox="0 0 900 200"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                  style={{ overflow: 'visible' }}
                >
                  {/* Subtle zone tints */}
                  <rect x="0"   y="28" width="225" height="165" fill="hsl(142 76% 50% / 0.025)" />
                  <rect x="225" y="28" width="225" height="165" fill="hsl(38 92% 55% / 0.025)" />
                  <rect x="450" y="28" width="225" height="165" fill="hsl(18 92% 55% / 0.045)" />
                  <rect x="675" y="28" width="225" height="165" fill="hsl(0 84% 55% / 0.025)" />

                  {/* Zone dividers */}
                  {[225, 450, 675].map((x) => (
                    <line key={x} x1={x} y1="28" x2={x} y2="188"
                      stroke="hsl(0 0% 100% / 0.06)" strokeWidth="1" strokeDasharray="4 7" />
                  ))}

                  {/* Valley floor — danger zone below the curve */}
                  <rect x="0" y="158" width="900" height="42"
                    fill={`hsl(${stateIdx >= 4 ? '0' : '18'} 92% 40% / ${0.03 + tension * 0.11})`}
                  />
                  <line x1="0" y1="158" x2="900" y2="158"
                    stroke={`hsl(${stateIdx >= 4 ? '0' : '18'} 92% 55% / ${0.08 + tension * 0.18})`}
                    strokeWidth="1.5"
                  />

                  {/* Rising danger pool — fills from floor as tension climbs */}
                  <rect
                    x="0"
                    y={200 - tension * 42}
                    width="900"
                    height={tension * 42}
                    fill={`hsl(${stateIdx >= 4 ? '0' : '18'} 92% 40% / ${0.04 + tension * 0.22})`}
                    style={{ transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)' }}
                  />

                  {/* Ghost curve — the reference safe path */}
                  <path
                    d="M 0 35 C 180 35, 360 165, 450 165 C 540 165, 720 35, 900 35"
                    fill="none"
                    stroke="hsl(0 0% 100% / 0.11)"
                    strokeWidth="1.8"
                  />

                  {/* Active trace — draws in as founder moves through questions */}
                  <path
                    d="M 0 35 C 180 35, 360 165, 450 165 C 540 165, 720 35, 900 35"
                    fill="none"
                    stroke={accent}
                    strokeWidth="2.5"
                    pathLength={100}
                    strokeDasharray={100}
                    strokeDashoffset={100 - t01 * 100}
                    style={{ transition: 'stroke-dashoffset 0.65s cubic-bezier(0.16,1,0.3,1)' }}
                  />

                  {/* Depth indicator — shows how far below the safe path the founder is */}
                  {sinkDepth > 4 && (
                    <line
                      x1={cx} y1={onCurveY + 4}
                      x2={cx} y2={valleyY - 4}
                      stroke={accent}
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                      opacity={Math.min(0.85, sinkDepth / 26)}
                      style={{ transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1)' }}
                    />
                  )}

                  {/* Outer halo — expands with tension */}
                  <circle
                    cx={cx}
                    cy={valleyY}
                    r={10 + tension * 24}
                    fill={`hsl(${stateIdx >= 4 ? '0' : '18'} 92% 55% / ${tension * 0.08})`}
                    style={{ transition: 'cx 0.65s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), r 0.9s ease' }}
                  />

                  {/* Inner halo */}
                  <circle
                    cx={cx}
                    cy={valleyY}
                    r={5 + tension * 10}
                    fill={`hsl(${stateIdx >= 4 ? '0' : '18'} 92% 55% / ${0.11 + tension * 0.20})`}
                    style={{ transition: 'cx 0.65s cubic-bezier(0.16,1,0.3,1), cy 0.9s cubic-bezier(0.16,1,0.3,1), r 0.65s ease' }}
                  />

                  {/* Founder marker — clearly visible, pulses gently */}
                  <motion.circle
                    initial={{ cx: 0, cy: 35 }}
                    animate={{ cx, cy: valleyY, r: [7, 9, 7] }}
                    transition={{
                      cx: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
                      cy: { duration: 0.9,  ease: [0.16, 1, 0.3, 1] },
                      r:  { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    fill={accent}
                  />

                  {/* Zone labels — readable, driven by vertical depth */}
                  {(['STABLE', 'EXPOSED', 'VALLEY', 'CRITICAL'] as const).map((label, i) => (
                    <text
                      key={label}
                      x={i * 225 + 112}
                      y={19}
                      textAnchor="middle"
                      fontSize="18"
                      letterSpacing="1.5"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      fill={
                        zoneIdx === i
                          ? (i >= 3 ? 'hsl(0 84% 65%)' : i >= 2 ? 'hsl(18 92% 62%)' : i === 1 ? 'hsl(38 92% 62%)' : 'hsl(142 76% 58%)')
                          : 'hsl(0 0% 100% / 0.20)'
                      }
                    >
                      {label}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Health strip + state label */}
              <div className={cn('mt-2 flex items-center gap-3 mb-1', isRTL && 'flex-row-reverse')}>
                {/* Degrading health bar — visual strip that shrinks and reddens */}
                <div className="flex-1 h-px bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${healthPct}%`,
                      backgroundColor: healthColor,
                      boxShadow: `0 0 6px ${healthColor}55`,
                    }}
                  />
                </div>
                <span className={cn(
                  'text-[9px] whitespace-nowrap flex-shrink-0 transition-colors duration-500',
                  stateIdx >= 4 ? 'text-red-400' : stateIdx >= 3 ? 'text-ember' : stateIdx >= 2 ? 'text-amber-400/70' : 'text-white/35',
                  isRTL ? 'font-arabic tracking-normal text-xs' : 'uppercase tracking-[0.32em]',
                )}>
                  {stateLabel}
                </span>
              </div>

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
                <AssessField label={a.fieldSector} error={errors.sector} isRTL={isRTL}>
                  <input
                    value={leadForm.sector}
                    onChange={(e) => setLeadForm({ ...leadForm, sector: e.target.value })}
                    className={cn('cinematic-input', isRTL && 'text-right')}
                    placeholder="SaaS, FinTech, E-commerce…"
                  />
                </AssessField>
                <AssessField label={a.fieldCountry} error={errors.country} isRTL={isRTL}>
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
