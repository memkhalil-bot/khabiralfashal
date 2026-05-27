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

const QUESTIONS: Question[] = [
  {
    id: 'cash_runway',
    chapter: 'CHAPTER 01 · THE NUMBERS YOU AVOID',
    prompt: 'When did you last open your real cash runway sheet?',
    type: 'choice',
    options: [
      { label: 'This morning. I know it cold.', weight: 1 },
      { label: 'Sometime this week.', weight: 2 },
      { label: 'A few weeks ago. I’m not sure of the number.', weight: 4, tag: 'Financial denial' },
      { label: "I avoid opening it. I'm afraid of what I'll see.", weight: 5, tag: 'Financial denial' },
    ],
  },
  {
    id: 'truth_team',
    chapter: 'CHAPTER 02 · WHAT YOUR TEAM WON’T SAY',
    prompt: 'If your team could speak without fear, what would they tell you?',
    sub: 'Answer for yourself before you choose.',
    type: 'choice',
    options: [
      { label: '“You’re on the right track — keep going.”', weight: 1 },
      { label: '“We need clearer direction.”', weight: 3 },
      { label: '“You’re not listening anymore.”', weight: 5, tag: 'Leadership isolation' },
      { label: '“We’ve already lost faith in the plan.”', weight: 5, tag: 'Leadership isolation' },
    ],
  },
  {
    id: 'denial',
    chapter: 'CHAPTER 03 · DENIAL INDEX',
    prompt: 'A close friend tells you the company is in trouble. Your first reaction?',
    type: 'choice',
    options: [
      { label: 'I ask them to be more specific. I want the data.', weight: 1 },
      { label: 'I defend the vision and explain the upside.', weight: 4, tag: 'Founder denial' },
      { label: 'I get quietly angry. They don’t understand.', weight: 5, tag: 'Founder denial' },
      { label: 'I agree out loud, then change nothing.', weight: 5, tag: 'Founder denial' },
    ],
  },
  {
    id: 'customer_pull',
    chapter: 'CHAPTER 04 · MARKET SIGNAL',
    prompt: 'How strong is real, unprompted pull from customers right now?',
    type: 'scale',
    scaleLabels: ['Strong, organic pull', 'Silence. I’m pushing.'],
    blindSpot: 'No market pull',
  },
  {
    id: 'concentration',
    chapter: 'CHAPTER 05 · THE SINGLE THREAD',
    prompt: 'How exposed are you to losing one customer, one channel, or one investor?',
    type: 'scale',
    scaleLabels: ['Diversified', 'One loss = collapse'],
    blindSpot: 'Concentration risk',
  },
  {
    id: 'identity_fusion',
    chapter: 'CHAPTER 06 · IDENTITY FUSION',
    prompt: 'Where does “the company” end and “you” begin?',
    sub: 'Be honest. Founders rarely answer this one truthfully.',
    type: 'choice',
    options: [
      { label: 'They are clearly separate. I have a life outside it.', weight: 1 },
      { label: 'They overlap, but I can step back.', weight: 2 },
      { label: 'The company is most of my identity now.', weight: 4, tag: 'Identity fusion' },
      { label: 'If the company dies, I don’t know who I am.', weight: 5, tag: 'Identity fusion' },
    ],
  },
  {
    id: 'decision_delay',
    chapter: 'CHAPTER 07 · THE DELAYED DECISION',
    prompt: 'There is a hard decision you’ve been postponing. How long have you postponed it?',
    type: 'scale',
    scaleLabels: ['No, I move fast', 'Months. I keep gathering data.'],
    blindSpot: 'Decision paralysis',
  },
  {
    id: 'sleep',
    chapter: 'CHAPTER 08 · THE BODY KEEPS THE SCORE',
    prompt: 'How is your sleep this last month?',
    type: 'scale',
    scaleLabels: ['Solid, restored', 'Broken. I wake up calculating.'],
    blindSpot: 'Burnout proximity',
  },
  {
    id: 'plan_b',
    chapter: 'CHAPTER 09 · THE EXIT YOU DON’T TALK ABOUT',
    prompt: 'Do you have a real Plan B — written, not imagined?',
    type: 'choice',
    options: [
      { label: 'Yes. Documented. I’ve walked through it.', weight: 1 },
      { label: 'A rough idea, nothing concrete.', weight: 3 },
      { label: 'No. Thinking about it feels like betrayal.', weight: 5, tag: 'No exit plan' },
      { label: 'No. There is no Plan B. There is only this.', weight: 5, tag: 'No exit plan' },
    ],
  },
  {
    id: 'last_honest',
    chapter: 'CHAPTER 10 · THE LAST HONEST CONVERSATION',
    prompt: 'When did you last have a brutally honest conversation about the company — with anyone?',
    type: 'choice',
    options: [
      { label: 'This week.', weight: 1 },
      { label: 'Within the last month.', weight: 2 },
      { label: 'Months ago.', weight: 4, tag: 'Leadership isolation' },
      { label: 'I can’t remember the last one.', weight: 5, tag: 'Leadership isolation' },
    ],
  },
];

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

// classify
function classify(score: number, max: number) {
  const pct = Math.round((score / max) * 100);
  if (pct < 30)
    return {
      level: 'STABLE',
      title: 'You are outside the valley — for now.',
      tone: 'text-emerald-400',
      ring: 'border-emerald-500/30',
      insight:
        'You are still operating with clarity. The danger at your stage isn’t collapse — it’s complacency. The founders who fall hardest are the ones who stopped looking down.',
    };
  if (pct < 55)
    return {
      level: 'EXPOSED',
      title: 'You are at the edge of the valley.',
      tone: 'text-amber-400',
      ring: 'border-amber-500/30',
      insight:
        'You can still see the road, but the ground beneath you is moving. You are not ignoring the risks. You are emotionally negotiating with them.',
    };
  if (pct < 78)
    return {
      level: 'INSIDE THE VALLEY',
      title: 'You are inside the Valley of Death.',
      tone: 'text-ember',
      ring: 'border-ember/40',
      insight:
        'You already know. The signals have been there for weeks. What you don’t need is more motivation — you need someone to sit across from you and refuse to look away.',
    };
  return {
    level: 'COLLAPSE PROXIMITY',
    title: 'You are closer to collapse than you’re admitting.',
    tone: 'text-red-500',
    ring: 'border-red-500/40',
    insight:
      'This is not a coaching moment. It’s a triage moment. The runway, the team, and your nervous system are all running on credit. Stop performing. Start cutting.',
  };
}

type Stage = 'intro' | 'lead' | 'quiz' | 'submitting' | 'result' | 'error';

export function FounderAssessment() {
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

  const total = QUESTIONS.length;
  const maxScore = total * 5;
  const score = useMemo(
    () => Object.values(answers).reduce((s, v) => s + v, 0),
    [answers]
  );
  const verdict = useMemo(() => classify(score, maxScore), [score, maxScore]);
  const blindSpots = useMemo(() => {
    const set = new Set<string>();
    QUESTIONS.forEach((q) => {
      const v = answers[q.id];
      if (v == null) return;
      if (q.type === 'scale' && q.blindSpot && v >= 4) set.add(q.blindSpot);
      if (q.type === 'choice') {
        const tag = chosenTags[q.id];
        if (tag) set.add(tag);
      }
    });
    return Array.from(set).slice(0, 4);
  }, [answers, chosenTags]);
  const valleyScorePct = Math.round((score / maxScore) * 100);

  const progress = stage === 'quiz' ? idx / total : stage === 'result' ? 1 : 0;

  const scrollTop = () =>
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // keyboard navigation
  useEffect(() => {
    if (stage !== 'quiz') return;
    const onKey = (e: KeyboardEvent) => {
      const q = QUESTIONS[idx];
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
  }, [stage, idx]);

  const pickChoice = (weight: number, tag?: string) => {
    const q = QUESTIONS[idx];
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
    const q = QUESTIONS[idx];
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
    const v = classify(score, maxScore);
    const bs: string[] = [];
    QUESTIONS.forEach((q) => {
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

  return (
    <section
      ref={rootRef}
      className="relative border-t border-white/5 bg-black text-white overflow-hidden"
    >
      {/* ambient bg */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.10),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* progress bar (sticky-feel) */}
      {(stage === 'quiz' || stage === 'submitting') && (
        <div className="sticky top-0 z-20 backdrop-blur-md bg-black/60 border-b border-white/10">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">
              Diagnostic
            </span>
            <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-ember"
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50 tabular-nums">
              {String(Math.min(idx + 1, total)).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

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
            >
              <div className="flex items-center gap-3 mb-8">
                <span className="h-px w-12 bg-ember" />
                <span className="text-xs tracking-[0.3em] uppercase text-ember font-medium">
                  The Founder Diagnostic
                </span>
              </div>
              <h2 className="font-serif-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
                Ten questions.
                <br />
                <span className="italic text-ember">No comfortable answers.</span>
              </h2>
              <p className="mt-8 text-white/60 text-lg leading-relaxed max-w-xl">
                This is not a survey. It’s a controlled, psychological diagnostic
                designed to surface what most founders cannot say out loud — about
                their company, their team, and themselves.
              </p>
              <ul className="mt-10 grid gap-3 text-sm text-white/55 max-w-md">
                {[
                  'Takes about 4 minutes.',
                  'One question at a time. No going back through chapters.',
                  'Your results are private. Only you see the diagnosis.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-2 size-1 rounded-full bg-ember" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setStage('lead')}
                className="mt-12 group inline-flex items-center gap-5 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500"
              >
                <span className="text-sm tracking-[0.25em] uppercase font-semibold">
                  Begin Diagnostic
                </span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
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
            >
              <p className="text-[11px] tracking-[0.3em] uppercase text-ember mb-6">
                Step 01 · Identification
              </p>
              <h2 className="font-serif-display text-3xl md:text-5xl leading-tight">
                Before we begin —
                <br />
                <span className="italic text-white/70">who are we diagnosing?</span>
              </h2>

              <div className="mt-10 grid md:grid-cols-2 gap-6">
                <Field label="Full name *" error={errors.name}>
                  <input
                    autoFocus
                    value={leadForm.name}
                    onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                    className="cinematic-input"
                    placeholder="Mohamed Khalil"
                  />
                </Field>
                <Field label="Email *" error={errors.email}>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="cinematic-input"
                    placeholder="founder@company.com"
                  />
                </Field>
                <Field label="Company">
                  <input
                    value={leadForm.company}
                    onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                    className="cinematic-input"
                  />
                </Field>
                <Field label="Stage">
                  <select
                    value={leadForm.stage}
                    onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}
                    className="cinematic-input"
                  >
                    <option value="">Select stage</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Sector">
                  <input
                    value={leadForm.sector}
                    onChange={(e) => setLeadForm({ ...leadForm, sector: e.target.value })}
                    className="cinematic-input"
                    placeholder="SaaS, FinTech, E-commerce…"
                  />
                </Field>
                <Field label="Country">
                  <input
                    value={leadForm.country}
                    onChange={(e) => setLeadForm({ ...leadForm, country: e.target.value })}
                    className="cinematic-input"
                    placeholder="UAE, KSA, Egypt…"
                  />
                </Field>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={submitLead}
                  className="group inline-flex items-center gap-5 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500"
                >
                  <span className="text-sm tracking-[0.25em] uppercase font-semibold">
                    Enter the Diagnostic
                  </span>
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                  Your answers are confidential. We only use them to prepare your
                  session if you choose to book one.
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
            >
              <p className="text-[11px] tracking-[0.35em] uppercase text-ember mb-6">
                {QUESTIONS[idx].chapter}
              </p>
              <h2 className="font-serif-display text-3xl md:text-5xl leading-[1.15] tracking-tight">
                {QUESTIONS[idx].prompt}
              </h2>
              {QUESTIONS[idx].sub && (
                <p className="mt-5 text-white/45 text-base italic max-w-xl leading-relaxed">
                  {QUESTIONS[idx].sub}
                </p>
              )}

              <div className="mt-12">
                {QUESTIONS[idx].type === 'choice' ? (
                  <div className="grid gap-3">
                    {QUESTIONS[idx].options!.map((opt, i) => (
                      <motion.button
                        key={opt.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06, duration: 0.4 }}
                        onClick={() => pickChoice(opt.weight, opt.tag)}
                        className="group text-left flex items-start gap-5 px-6 py-5 border border-white/10 hover:border-ember hover:bg-ember/[0.04] transition-all duration-300"
                      >
                        <span className="font-serif-display text-2xl text-white/30 group-hover:text-ember transition-colors tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-white/85 text-base md:text-lg leading-snug pt-1">
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
                    <div className="mt-4 flex justify-between text-[10px] tracking-[0.25em] uppercase text-white/35">
                      <span>{QUESTIONS[idx].scaleLabels?.[0]}</span>
                      <span>{QUESTIONS[idx].scaleLabels?.[1]}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-12 flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-white/35">
                <button
                  onClick={() => idx > 0 && setIdx(idx - 1)}
                  disabled={idx === 0}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="size-3" /> Back
                </button>
                <span>Press 1–{QUESTIONS[idx].type === 'choice' ? QUESTIONS[idx].options!.length : 5} to answer</span>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors"
                >
                  <RotateCcw className="size-3" /> Restart
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
              <p className="mt-8 text-[11px] tracking-[0.35em] uppercase text-white/50">
                Analyzing responses
              </p>
              <p className="mt-3 font-serif-display text-2xl text-white/80 italic">
                Compiling your diagnosis…
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
              <p className="text-[11px] tracking-[0.35em] uppercase text-red-400">
                Submission failed
              </p>
              <p className="mt-4 text-white/70">{submitError}</p>
              <button
                onClick={submit}
                className="mt-8 px-6 py-3 border border-white/20 hover:border-ember hover:text-ember text-sm tracking-[0.25em] uppercase transition-colors"
              >
                Retry
              </button>
            </motion.div>
          )}

          {/* ================= RESULT ================= */}
          {stage === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              <div>
                <p className="text-[11px] tracking-[0.35em] uppercase text-ember mb-6">
                  Diagnosis · {lead?.name ?? 'Founder'}
                </p>
                <h2 className="font-serif-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
                  {verdict.title}
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {/* Risk level */}
                <div className={`border ${verdict.ring} bg-white/[0.02] p-6`}>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">
                    Founder Risk Level
                  </p>
                  <p className={`mt-4 font-serif-display text-3xl ${verdict.tone}`}>
                    {verdict.level}
                  </p>
                </div>
                {/* Valley score */}
                <div className="border border-white/10 bg-white/[0.02] p-6">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">
                    Valley Risk Score
                  </p>
                  <p className={`mt-4 font-serif-display text-5xl italic ${verdict.tone} tabular-nums`}>
                    {valleyScorePct}
                    <span className="text-2xl text-white/30">/100</span>
                  </p>
                </div>
                {/* Blind spots count */}
                <div className="border border-white/10 bg-white/[0.02] p-6">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-white/40">
                    Blind Spots Detected
                  </p>
                  <p className="mt-4 font-serif-display text-5xl text-white tabular-nums">
                    {String(blindSpots.length).padStart(2, '0')}
                  </p>
                </div>
              </div>

              {/* Blind spot list */}
              {blindSpots.length > 0 && (
                <div className="border-t border-white/10 pt-10">
                  <p className="text-[11px] tracking-[0.35em] uppercase text-ember mb-6">
                    Blind Spot Indicators
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-3">
                    {blindSpots.map((b, i) => (
                      <li
                        key={b}
                        className="flex items-start gap-4 border border-white/10 px-5 py-4"
                      >
                        <span className="font-serif-display text-ember tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-white/80">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insight */}
              <div className="border-t border-white/10 pt-10">
                <p className="text-[11px] tracking-[0.35em] uppercase text-ember mb-6">
                  Psychological Insight
                </p>
                <blockquote className="font-serif-display text-2xl md:text-3xl italic text-white/90 leading-snug max-w-2xl">
                  “{verdict.insight}”
                </blockquote>
              </div>

              {/* CTAs */}
              <div className="border-t border-white/10 pt-10">
                <p className="text-[11px] tracking-[0.35em] uppercase text-ember mb-6">
                  Your next move
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  <ResultCTA
                    to="/contact?intent=emergency"
                    icon={<Siren className="size-5" />}
                    title="Book Emergency Session"
                    desc="60 minutes. We triage runway, team, and the decision you’ve been postponing."
                    primary
                  />
                  <ResultCTA
                    to="/contact?intent=autopsy"
                    icon={<FileSearch className="size-5" />}
                    title="Request Startup Autopsy"
                    desc="A full forensic review of where the company is bleeding — and why."
                  />
                  <ResultCTA
                    to="/contact?intent=founder-call"
                    icon={<Phone className="size-5" />}
                    title="Book Founder Call"
                    desc="Private 1:1 with Mohamed Khalil. Strategic, candid, off the record."
                  />
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-3 text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-ember transition-colors"
                >
                  <RotateCcw className="size-3" /> Restart diagnostic
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.3em] uppercase text-white/45 mb-3">
        {label}
      </label>
      {children}
      {error && <p className="mt-2 text-xs text-ember">{error}</p>}
    </div>
  );
}

function ResultCTA({
  to, icon, title, desc, primary,
}: { to: string; icon: React.ReactNode; title: string; desc: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`group block p-6 border transition-all duration-500 ${
        primary
          ? 'border-ember bg-ember/[0.08] hover:bg-ember hover:text-black'
          : 'border-white/10 hover:border-ember hover:bg-white/[0.03]'
      }`}
    >
      <div className={`mb-5 ${primary ? 'text-ember group-hover:text-black' : 'text-ember'}`}>
        {icon}
      </div>
      <h4 className="font-serif-display text-xl mb-3 leading-snug">{title}</h4>
      <p className={`text-sm leading-relaxed ${primary ? 'text-white/70 group-hover:text-black/70' : 'text-white/50'}`}>
        {desc}
      </p>
      <div className={`mt-6 inline-flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase ${primary ? 'text-white group-hover:text-black' : 'text-white/60 group-hover:text-ember'} transition-colors`}>
        Continue <ArrowRight className="size-3" />
      </div>
    </Link>
  );
}
