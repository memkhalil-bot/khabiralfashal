import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as z from 'zod';
import { ArrowLeft, RotateCcw, Share2, Check, X } from 'lucide-react';

/**
 * Arabic interactive "Valley of Death" quiz.
 * Lead capture → 12 yes/no risk questions → score, classification & upsell tiers.
 * Dark cinematic theme — matches خبير الفشل brand.
 */

const QUESTIONS = [
  'هل يمثل عميل واحد أكثر من 30% من إيراداتك الحالية؟',
  'هل عندك أقل من 6 أشهر runway نقدي؟',
  'هل توقفت عن التحدث مباشرة مع عملائك خلال آخر شهر؟',
  'هل يخاف فريقك أن يقول لك الحقيقة كاملة؟',
  'هل تؤجل قرارًا صعبًا بحجة "جمع المزيد من البيانات"؟',
  'هل تكلفة اكتساب العميل (CAC) أعلى من قيمته الكلية (LTV)؟',
  'هل فقدت موظفًا أساسيًا خلال آخر 3 شهور؟',
  'هل تعتمد على جولة تمويل لم تُغلق بعد لتغطية المرتبات؟',
  'هل تجاهلت ملاحظات متكررة من العملاء حول مشكلة جوهرية؟',
  'هل توقفت عن قياس معدل الـ Churn أو لا تعرف رقمه الحقيقي؟',
  'هل تتجنب فتح لوحة الأرقام كل يوم؟',
  'هل منتجك "تقريبًا جاهز" منذ أكثر من 6 شهور؟',
];

const SECTORS = [
  'Technology / SaaS', 'FinTech', 'E-commerce', 'Food & Beverage',
  'HealthTech', 'EdTech', 'Logistics', 'Real Estate', 'Retail', 'Other',
];
const COUNTRIES = [
  'السعودية', 'الإمارات', 'مصر', 'الكويت', 'قطر', 'البحرين',
  'عُمان', 'الأردن', 'المغرب', 'أخرى',
];
const STAGES = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Early Revenue', 'Growth'];

const leadSchema = z.object({
  email: z.string().trim().email('إيميل غير صحيح').max(255),
  company: z.string().trim().max(120).optional(),
  sector: z.string().min(1, 'اختر القطاع'),
  country: z.string().min(1, 'اختر الدولة'),
  city: z.string().trim().min(2, 'أدخل المدينة').max(80),
  stage: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: 'يجب الموافقة على الشروط' }) }),
});
type Lead = z.infer<typeof leadSchema>;

type Answer = { q: string; risk: boolean };

function classify(score: number) {
  if (score <= 25)
    return {
      tone: 'safe',
      label: 'خطر منخفض',
      title: 'شركتك خارج الوادي حاليًا',
      tip: 'وضعك جيد نسبيًا، لكن استمر في مراقبة المؤشرات المبكرة أسبوعيًا.',
      color: 'text-emerald-400',
      bg: 'border-emerald-500/30 bg-emerald-500/5',
    };
  if (score <= 50)
    return {
      tone: 'warn',
      label: 'خطر متوسط',
      title: 'بدأت تدخل منطقة الخطر',
      tip: 'تحتاج مراجعة واضحة لأولوياتك خلال 30 يومًا قبل زيادة الضغط.',
      color: 'text-amber-400',
      bg: 'border-amber-500/30 bg-amber-500/5',
    };
  if (score <= 75)
    return {
      tone: 'high',
      label: 'خطر مرتفع',
      title: 'شركتك داخل وادي الموت',
      tip: 'تحتاج معالجة أولويتين فورًا: النقدية، السوق، أو الفريق.',
      color: 'text-ember',
      bg: 'border-ember/30 bg-ember/5',
    };
  return {
    tone: 'critical',
    label: 'انهيار قريب',
    title: 'شركتك قريبة من الانهيار',
    tip: 'تحتاج خطة إنقاذ عاجلة خلال 14 يومًا قبل زيادة النزيف.',
    color: 'text-red-500',
    bg: 'border-red-500/40 bg-red-500/10',
  };
}

const PRODUCTS = [
  { tag: 'Most Accessible', title: 'التقرير التفصيلي', price: '$5',
    desc: 'تحليل مُخصّص + أهم 3 مخاطر + توصيات + مقارنة مبدئية بالسوق.' },
  { tag: 'Recovery PDF', title: 'خطة معالجة سريعة', price: '$29–49',
    desc: 'خطة PDF لمدة 14 إلى 30 يوم حسب مرحلة الخطر.' },
  { tag: 'Diagnosis', title: 'جلسة تشخيص 30 دقيقة', price: '$75–100',
    desc: 'جلسة مباشرة لمراجعة النتيجة وتحديد أولويات الإنقاذ.' },
  { tag: 'Coaching', title: 'برنامج متابعة شهر', price: '$300–500',
    desc: 'متابعة شهرية أو ترشيح Coach متخصص.' },
];

export function ValleyQuizArabic() {
  const [stage, setStage] = useState<'gate' | 'quiz' | 'result'>('gate');
  const [form, setForm] = useState({
    email: '', company: '', sector: '', country: '', city: '', stage: '', terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lead, setLead] = useState<Lead | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  const yesCount = answers.filter((a) => a.risk).length;
  const score = useMemo(
    () => Math.min(100, Math.round((yesCount / QUESTIONS.length) * 100)),
    [yesCount]
  );
  const health = Math.max(0, 100 - yesCount * 9);
  const verdict = classify(score);
  const topRisks = answers.filter((a) => a.risk).slice(0, 3).map((a) => a.q);

  const scrollHere = () =>
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const submitGate = () => {
    const parsed = leadSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLead(parsed.data);
    setStage('quiz');
    setIdx(0);
    setAnswers([]);
  };

  const answer = (risk: boolean) => {
    const next = [...answers, { q: QUESTIONS[idx], risk }];
    setAnswers(next);
    if (idx + 1 >= QUESTIONS.length) {
      setStage('result');
      scrollHere();
    } else {
      setIdx(idx + 1);
    }
  };

  const reset = () => {
    setStage('gate');
    setAnswers([]);
    setIdx(0);
    scrollHere();
  };

  const share = () => {
    const msg = encodeURIComponent(
      `نتيجتي في اختبار وادي الموت: ${score}/100 — ${verdict.label}. جرب الاختبار.`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${msg}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // SVG valley path
  const pathD = 'M 20 60 Q 120 60 200 130 T 380 60';
  const progress = stage === 'quiz' ? idx / QUESTIONS.length : stage === 'result' ? 1 : 0;
  // approximate point along path
  const markerX = 20 + progress * 360;
  const markerY = 60 + Math.sin(progress * Math.PI) * 70 + yesCount * 2;

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      className="font-arabic relative border-t border-white/5 px-6 lg:px-12 py-20 md:py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(18_92%_55%/0.08),transparent_65%)] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">
        {/* Section header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-12 bg-ember" />
            <span className="text-xs tracking-[0.3em] uppercase text-ember font-medium font-sans-ui">
              Arabic Edition · النسخة العربية
            </span>
            <span className="h-px w-12 bg-ember" />
          </div>
          <h2 className="font-serif-display text-4xl md:text-6xl leading-tight tracking-tight">
            هل شركتك هتعدّي
            <br />
            <span className="italic text-ember">وادي الموت؟</span>
          </h2>
          <p className="mt-6 text-white/55 leading-relaxed max-w-2xl mx-auto">
            اختبار تفاعلي لتقييم مؤشرات الخطر في شركتك الناشئة. النتيجة العامة مجانية،
            والتقرير التفصيلي متاح بعد المراجعة.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ============ GATE ============ */}
          {stage === 'gate' && (
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="border border-white/10 bg-white/[0.02] p-8 md:p-10 rounded-sm"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <ArField label="الإيميل *" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@email.com"
                    className="ar-input"
                    dir="ltr"
                  />
                </ArField>
                <ArField label="اسم الشركة (اختياري)">
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="ar-input"
                  />
                </ArField>
                <ArField label="القطاع *" error={errors.sector}>
                  <select
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                    className="ar-input"
                  >
                    <option value="">اختر القطاع</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </ArField>
                <ArField label="الدولة *" error={errors.country}>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="ar-input"
                  >
                    <option value="">اختر الدولة</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </ArField>
                <ArField label="المدينة / المحافظة *" error={errors.city}>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="ar-input"
                  />
                </ArField>
                <ArField label="مرحلة الشركة (اختياري)">
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className="ar-input"
                  >
                    <option value="">اختر المرحلة</option>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </ArField>
              </div>

              <label className="flex items-start gap-3 mt-8 text-sm text-white/50 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                  className="mt-1 accent-ember"
                />
                <span>
                  أوافق على الشروط: البيانات تُستخدم للتحليل فقط ولن تُباع لطرف ثالث.
                  الاختبار أداة تقييم مبدئي وليس استشارة قانونية أو استثمارية.
                </span>
              </label>
              {errors.terms && (
                <p className="mt-2 text-xs text-ember">{errors.terms}</p>
              )}

              <button
                onClick={submitGate}
                className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-4 px-10 py-5 bg-ember text-black hover:bg-white transition-all duration-500 font-sans-ui"
              >
                <span className="text-sm tracking-[0.25em] uppercase font-semibold">
                  ابدأ الاختبار المجاني
                </span>
              </button>
            </motion.div>
          )}

          {/* ============ QUIZ ============ */}
          {stage === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* health + progress */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm font-sans-ui">
                <div>
                  <div className="flex justify-between text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">
                    <span>صحة الشركة</span>
                    <span>{Math.round(health)}%</span>
                  </div>
                  <div className="h-1 bg-white/10 overflow-hidden">
                    <motion.div
                      animate={{ width: `${health}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${
                        health > 70 ? 'bg-emerald-500' : health > 35 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2">
                    <span>السؤال</span>
                    <span>{idx + 1} / {QUESTIONS.length}</span>
                  </div>
                  <div className="h-1 bg-white/10 overflow-hidden">
                    <motion.div
                      animate={{ width: `${((idx + 1) / QUESTIONS.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-ember"
                    />
                  </div>
                </div>
              </div>

              {/* valley scene */}
              <div className="relative h-48 border border-white/10 bg-black/40 overflow-hidden">
                <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
                  <path d={pathD} fill="none" stroke="hsl(0 0% 100% / 0.1)" strokeWidth="1" strokeDasharray="3 4" />
                  <motion.circle
                    cx={markerX}
                    cy={markerY}
                    r="6"
                    fill="hsl(18 92% 55%)"
                    stroke="white"
                    strokeWidth="1.5"
                    animate={{ cx: markerX, cy: markerY }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <text x="20" y="190" className="fill-white/30" fontSize="9">IDEA</text>
                  <text x="120" y="190" className="fill-white/30" fontSize="9">MVP</text>
                  <text x="180" y="190" className="fill-ember" fontSize="9">VALLEY</text>
                  <text x="280" y="190" className="fill-white/30" fontSize="9">SURVIVAL</text>
                  <text x="350" y="190" className="fill-white/30" fontSize="9">GROWTH</text>
                </svg>
              </div>

              {/* question */}
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border-t border-white/10 pt-8"
              >
                <p className="text-xs tracking-[0.25em] uppercase text-ember font-sans-ui mb-4">
                  السؤال {String(idx + 1).padStart(2, '0')}
                </p>
                <h3 className="font-serif-display text-2xl md:text-3xl leading-snug mb-8">
                  {QUESTIONS[idx]}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => answer(true)}
                    className="group flex items-center justify-center gap-3 px-6 py-5 border border-red-500/40 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300"
                  >
                    <Check className="size-5 text-red-400" />
                    <span className="text-base font-semibold">نعم</span>
                  </button>
                  <button
                    onClick={() => answer(false)}
                    className="group flex items-center justify-center gap-3 px-6 py-5 border border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-300"
                  >
                    <X className="size-5 text-emerald-400" />
                    <span className="text-base font-semibold">لا</span>
                  </button>
                </div>
                <button
                  onClick={reset}
                  className="mt-6 inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors font-sans-ui"
                >
                  <RotateCcw className="size-3" /> إعادة
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* ============ RESULT ============ */}
          {stage === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-10"
            >
              <div className={`border ${verdict.bg} p-8 md:p-10 text-center`}>
                <p className="text-xs tracking-[0.3em] uppercase text-white/40 font-sans-ui mb-4">
                  Startup Risk Score™
                </p>
                <div className={`font-serif-display text-7xl md:text-8xl italic ${verdict.color}`}>
                  {score}
                  <span className="text-3xl text-white/30">/100</span>
                </div>
                <h3 className="mt-6 font-serif-display text-3xl md:text-4xl">
                  {verdict.title}
                </h3>
                <p className={`mt-2 text-sm tracking-[0.2em] uppercase font-sans-ui ${verdict.color}`}>
                  {verdict.label}
                </p>
                <p className="mt-6 text-white/65 leading-relaxed max-w-xl mx-auto">
                  {verdict.tip}
                </p>

                {topRisks.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/10 text-right">
                    <p className="text-xs tracking-[0.25em] uppercase text-ember font-sans-ui mb-4">
                      أهم 3 مؤشرات خطر
                    </p>
                    <ul className="space-y-2">
                      {topRisks.map((r, i) => (
                        <li key={i} className="text-white/70 text-sm leading-relaxed flex gap-3">
                          <span className="text-ember font-serif-display">{i + 1}.</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Upsell tiers */}
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-ember font-sans-ui mb-2 text-center">
                  الترقية المدفوعة
                </p>
                <h3 className="font-serif-display text-2xl md:text-3xl text-center mb-8">
                  عايز تحليل أعمق؟
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {PRODUCTS.map((p) => (
                    <div
                      key={p.title}
                      className="border border-white/10 bg-white/[0.02] p-5 flex flex-col"
                    >
                      <span className="self-start text-[10px] tracking-[0.2em] uppercase text-ember border border-ember/30 px-2 py-1 mb-4 font-sans-ui">
                        {p.tag}
                      </span>
                      <h4 className="font-serif-display text-xl mb-2 leading-snug">
                        {p.title}
                      </h4>
                      <div className="font-serif-display text-2xl text-ember mb-3">
                        {p.price}
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed flex-1 mb-4">
                        {p.desc}
                      </p>
                      <Link
                        to="/contact"
                        className="text-[11px] tracking-[0.2em] uppercase text-white/80 hover:text-ember transition-colors font-sans-ui border-t border-white/10 pt-3"
                      >
                        اطلب الآن ←
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                <button
                  onClick={share}
                  className="inline-flex items-center gap-3 px-6 py-4 border border-white/15 hover:border-ember hover:text-ember transition-all duration-500 font-sans-ui"
                >
                  <Share2 className="size-4" />
                  <span className="text-xs tracking-[0.25em] uppercase">
                    شارك على LinkedIn
                  </span>
                </button>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-3 px-6 py-4 border border-white/15 hover:border-white/40 transition-all duration-500 font-sans-ui"
                >
                  <ArrowLeft className="size-4" />
                  <span className="text-xs tracking-[0.25em] uppercase">
                    أعد الاختبار
                  </span>
                </button>
              </div>

              {lead && (
                <p className="text-center text-[10px] tracking-[0.2em] uppercase text-white/30 font-sans-ui">
                  Submitted · {lead.email}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ArField({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.2em] uppercase text-white/50 mb-2 font-sans-ui">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-ember">{error}</p>}
    </div>
  );
}
