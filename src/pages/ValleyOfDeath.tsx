import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { ValleyQuizArabic } from '@/components/valley/ValleyQuizArabic';

/**
 * Valley of Death — a brutal self-diagnostic test for founders.
 * 8 questions. Weighted scoring. Three verdict tiers.
 */

type Choice = { label: string; score: number };
type Question = { id: string; n: string; prompt: string; ar?: string; choices: Choice[] };

const QUESTIONS: Question[] = [
  {
    id: 'runway',
    n: '01',
    prompt: 'How many months of runway do you have right now — without any new revenue or funding?',
    ar: 'كم شهر تقدر تكمل بدون تمويل أو إيرادات جديدة؟',
    choices: [
      { label: 'Less than 3 months', score: 3 },
      { label: '3 to 6 months', score: 2 },
      { label: '6 to 12 months', score: 1 },
      { label: 'More than 12 months', score: 0 },
    ],
  },
  {
    id: 'truth',
    n: '02',
    prompt: 'When was the last time someone on your team told you something you really didn\'t want to hear?',
    choices: [
      { label: 'I genuinely cannot remember', score: 3 },
      { label: 'Months ago', score: 2 },
      { label: 'In the last few weeks', score: 1 },
      { label: 'This week', score: 0 },
    ],
  },
  {
    id: 'metric',
    n: '03',
    prompt: 'Pick the metric you check most often. Is it actually tied to survival?',
    choices: [
      { label: 'Followers, signups, or vanity numbers', score: 3 },
      { label: 'Traffic and engagement', score: 2 },
      { label: 'Revenue or active paying users', score: 1 },
      { label: 'Cash position and burn multiple', score: 0 },
    ],
  },
  {
    id: 'customer',
    n: '04',
    prompt: 'How many real conversations did you personally have with paying customers last month?',
    choices: [
      { label: 'Zero', score: 3 },
      { label: '1 to 3', score: 2 },
      { label: '4 to 10', score: 1 },
      { label: 'More than 10', score: 0 },
    ],
  },
  {
    id: 'gut',
    n: '05',
    prompt: 'There is one decision you keep postponing. You know which one. Why?',
    choices: [
      { label: 'I am hoping it solves itself', score: 3 },
      { label: 'I am waiting for more data', score: 2 },
      { label: 'I am preparing to act on it', score: 1 },
      { label: 'There is no such decision', score: 3 },
    ],
  },
  {
    id: 'team',
    n: '06',
    prompt: 'If your top performer quit tomorrow, what would actually break?',
    choices: [
      { label: 'The whole company', score: 3 },
      { label: 'A critical function for months', score: 2 },
      { label: 'A few weeks of pain, then recovery', score: 1 },
      { label: 'Almost nothing — the system holds', score: 0 },
    ],
  },
  {
    id: 'why',
    n: '07',
    prompt: 'Why are you still building this company?',
    choices: [
      { label: 'I have invested too much to stop', score: 3 },
      { label: 'I do not know what else I would do', score: 2 },
      { label: 'The mission still pulls me forward', score: 1 },
      { label: 'The numbers prove it is working', score: 0 },
    ],
  },
  {
    id: 'sleep',
    n: '08',
    prompt: 'When was the last time you slept a full night without checking your phone first?',
    choices: [
      { label: 'I cannot remember', score: 3 },
      { label: 'Weeks ago', score: 2 },
      { label: 'Within the last week', score: 1 },
      { label: 'Last night', score: 0 },
    ],
  },
];

const MAX = QUESTIONS.length * 3;

function verdict(score: number) {
  const pct = score / MAX;
  if (pct >= 0.66)
    return {
      tier: 'III',
      label: 'In the Valley',
      copy:
        'You are deep inside the Valley of Death. The signals are no longer subtle. Most founders in this zone meet me six months too late. This is the moment to stop performing and start telling the truth.',
      tone: 'text-ember',
    };
  if (pct >= 0.4)
    return {
      tier: 'II',
      label: 'Approaching the Edge',
      copy:
        'You are not collapsing — yet. But the patterns are forming. The story you are telling investors and the story your gut is telling you are starting to diverge. That gap is where companies die.',
      tone: 'text-ember/80',
    };
  return {
    tier: 'I',
    label: 'Holding the Line',
    copy:
      'You are seeing more clearly than most. Stay suspicious of comfort. The founders who survive are the ones who keep running this test even when nothing seems wrong.',
    tone: 'text-white/80',
  };
}

export default function ValleyOfDeath() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => Object.values(answers).reduce((s, v) => s + v, 0),
    [answers]
  );
  const answeredAll = Object.keys(answers).length === QUESTIONS.length;
  const v = verdict(score);

  return (
    <div className="dark bg-black text-white font-sans-ui min-h-screen">
      <SEOHead
        title="Valley of Death — The Founder Test | خبير الفشل"
        description="A brutal self-diagnostic for founders. 8 questions. No motivation. Just the truth about how close your company is to the edge."
      />

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 lg:px-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.12),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black)]" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-ember" />
              <span className="text-xs tracking-[0.3em] uppercase text-ember font-medium">
                The Founder Test · اختبار المؤسس
              </span>
            </div>
            <h1 className="font-serif-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              Valley
              <br />
              <span className="italic text-ember">of Death.</span>
            </h1>
            <p className="mt-10 text-lg md:text-xl text-white/55 max-w-2xl leading-relaxed font-light">
              Eight questions. No motivation. No coaching. Answer honestly —
              the only person you can lie to here is yourself.
            </p>
            <p
              dir="rtl"
              className="mt-4 font-arabic text-base md:text-lg text-white/40 leading-relaxed max-w-xl"
            >
              ثمانية أسئلة تكشف لك أين أنت فعلاً.
            </p>
          </motion.div>
        </div>
      </section>

      {/* TEST */}
      <section className="px-6 lg:px-12 py-20 md:py-28">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-20"
              >
                {QUESTIONS.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.7, delay: i * 0.03 }}
                    className="border-t border-white/10 pt-8"
                  >
                    <div className="flex items-baseline gap-6 mb-6">
                      <span className="font-serif-display italic text-ember text-3xl">
                        {q.n}
                      </span>
                      <h2 className="font-serif-display text-2xl md:text-3xl leading-snug tracking-tight">
                        {q.prompt}
                      </h2>
                    </div>
                    {q.ar && (
                      <p
                        dir="rtl"
                        className="font-arabic text-sm text-white/30 mb-6 pr-1"
                      >
                        {q.ar}
                      </p>
                    )}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {q.choices.map((c, ci) => {
                        const active = answers[q.id] === c.score;
                        return (
                          <button
                            key={ci}
                            type="button"
                            onClick={() =>
                              setAnswers((a) => ({ ...a, [q.id]: c.score }))
                            }
                            className={`text-left px-5 py-4 border text-sm font-light leading-relaxed transition-all duration-300 ${
                              active
                                ? 'border-ember bg-ember/10 text-white'
                                : 'border-white/10 text-white/55 hover:border-white/30 hover:text-white/90'
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}

                <div className="border-t border-white/10 pt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <p className="text-xs tracking-[0.25em] uppercase text-white/40">
                    {Object.keys(answers).length} / {QUESTIONS.length} answered
                  </p>
                  <button
                    type="button"
                    disabled={!answeredAll}
                    onClick={() => {
                      setSubmitted(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group inline-flex items-center justify-between gap-10 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-sm tracking-[0.25em] uppercase font-semibold">
                      Reveal the verdict
                    </span>
                    <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <div className="mb-8 text-xs tracking-[0.3em] uppercase text-ember">
                  Verdict · Tier {v.tier}
                </div>
                <h2 className={`font-serif-display text-5xl md:text-7xl leading-tight italic mb-10 ${v.tone}`}>
                  {v.label}.
                </h2>

                <div className="mx-auto max-w-md mb-12">
                  <div className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">
                    <span>Risk score</span>
                    <span>
                      {score} / {MAX}
                    </span>
                  </div>
                  <div className="relative h-px bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / MAX) * 100}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-y-0 left-0 bg-ember"
                    />
                  </div>
                </div>

                <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mx-auto mb-14">
                  {v.copy}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    to="/contact"
                    className="group inline-flex items-center gap-6 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500"
                  >
                    <span className="text-sm tracking-[0.25em] uppercase font-semibold">
                      Book a Risk Session
                    </span>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setAnswers({});
                      setSubmitted(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group inline-flex items-center gap-3 px-6 py-5 border border-white/15 text-white/60 hover:border-white/40 hover:text-white transition-all duration-500"
                  >
                    <RotateCcw className="size-4" />
                    <span className="text-xs tracking-[0.25em] uppercase">
                      Take it again
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Arabic interactive quiz */}
      <ValleyQuizArabic />
    </div>
  );
}
