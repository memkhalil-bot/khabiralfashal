import { useState } from 'react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { ValleyAssessment } from '@/components/valley/ValleyAssessment';
import { ValleyCurve } from '@/components/valley/ValleyCurve';
import { FounderTestimonials } from '@/components/testimonials/FounderTestimonials';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const inView = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
} as const;

export default function ValleyOfDeath() {
  const t = useT();
  const v = t.valley;
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [assessmentActive, setAssessmentActive] = useState(false);

  const handleStartDiagnosis = () => {
    setAssessmentActive(true);
  };

  return (
    <div className={cn('dark bg-black text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={v.metaTitle} description={v.metaDesc} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 lg:px-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.12),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black)]" />
        <div className={cn('relative max-w-5xl mx-auto', isRTL && 'text-right')}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {v.eyebrow && (
              <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse text-xs')}>
                <span className="h-px w-12 bg-ember" />
                <span className={cn(
                  'text-xs uppercase text-ember font-medium',
                  isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
                )}>
                  {v.eyebrow}
                </span>
              </div>
            )}
            <h1 className={cn(
              'leading-[0.95] tracking-tight',
              isRTL
                ? 'font-arabic font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.3]'
                : 'font-serif-display text-5xl md:text-7xl lg:text-8xl'
            )}>
              {v.heroHeading1}
              <br />
              <span className={cn('text-ember', !isRTL && 'italic')}>{v.heroHeading2}</span>
            </h1>
            <p className={cn(
              'mt-10 text-lg md:text-xl text-white/55 max-w-2xl leading-relaxed font-light',
              isRTL && 'leading-[2.2]'
            )}>
              {v.heroSub}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── NARRATIVE: WHAT IS THE VALLEY ───────────────────────────────────
          Psychological framing before any data or interaction.
          Creates weight, builds emotional readiness.                       */}
      <section className="relative border-b border-white/5 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,hsl(18_92%_55%/0.05),transparent_65%)] pointer-events-none" />

        <div className={cn('relative max-w-3xl mx-auto px-6 lg:px-10 py-28 md:py-36', isRTL && 'text-right')}>

          {/* Eyebrow */}
          <motion.div {...inView} className={cn('flex items-center gap-3 mb-10', isRTL && 'flex-row-reverse')}>
            <span className="h-px w-10 bg-ember/70 flex-shrink-0" />
            <span className={cn(
              'text-ember font-medium',
              isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.45em]'
            )}>
              {v.narrative.eyebrow}
            </span>
          </motion.div>

          {/* Context / definition paragraph — smaller, lead-in */}
          <motion.p
            {...inView}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className={cn(
              'text-white/45 max-w-2xl mb-14',
              isRTL ? 'font-arabic text-base md:text-lg leading-[2.1]' : 'text-base md:text-lg leading-relaxed font-light'
            )}
          >
            {v.narrative.intro}
          </motion.p>

          {/* Main heading — the psychological hook */}
          <motion.h2
            {...inView}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className={cn(
              'tracking-tight mb-14',
              isRTL
                ? 'font-arabic font-bold text-3xl md:text-5xl leading-[1.5]'
                : 'font-serif-display text-3xl md:text-5xl leading-[1.1]'
            )}
          >
            {v.narrative.heading}
          </motion.h2>

          {/* Body — 4 paragraphs with breathing room between them */}
          <div className={cn(
            'space-y-8 max-w-2xl',
            isRTL ? 'font-arabic text-base md:text-lg leading-[2.1]' : 'text-base md:text-lg leading-relaxed font-light'
          )}>
            <motion.p
              {...inView}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="text-white/65"
            >
              {v.narrative.p1}
            </motion.p>
            <motion.p
              {...inView}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              className="text-white/65"
            >
              {v.narrative.p2}
            </motion.p>
            <motion.p
              {...inView}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="text-white/50"
            >
              {v.narrative.p3}
            </motion.p>
          </div>

          {/* Closing stanza — separate, heavier weight */}
          <motion.div
            {...inView}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
            className="mt-14 pt-10 border-t border-white/[0.07]"
          >
            {v.narrative.p4.split('\n').map((line, i) => (
              <p
                key={i}
                className={cn(
                  'text-white/80',
                  isRTL
                    ? 'font-arabic font-semibold text-lg md:text-2xl leading-[1.8]'
                    : 'font-serif-display text-xl md:text-3xl leading-[1.3]',
                  i > 0 && 'mt-2'
                )}
              >
                {line}
              </p>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ── VALLEY CURVE — educational chart ─────────────────────────────── */}
      <ValleyCurve />

      {/* ── DIAGNOSIS CTA ────────────────────────────────────────────────────
          The threshold moment. Everything above was explanation.
          This is where the descent begins.                                  */}
      <section className="relative border-b border-white/5 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,hsl(18_92%_55%/0.07),transparent_60%)] pointer-events-none" />

        <div className={cn('relative max-w-2xl mx-auto px-6 lg:px-10 py-28 md:py-36', isRTL && 'text-right')}>

          {/* Diagnosis introduction text */}
          <motion.p
            {...inView}
            className={cn(
              'text-white/70 mb-10',
              isRTL
                ? 'font-arabic text-lg md:text-2xl leading-[1.9]'
                : 'font-serif-display text-xl md:text-3xl leading-[1.35]'
            )}
          >
            {v.diagnosisCta.intro}
          </motion.p>

          {/* Meta notes: time + privacy */}
          <motion.div
            {...inView}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className={cn('flex flex-col gap-2 mb-16', isRTL && 'items-end')}
          >
            {[v.diagnosisCta.timeNote, v.diagnosisCta.privacyNote].map((note) => (
              <p
                key={note}
                className={cn(
                  'text-white/35',
                  isRTL ? 'font-arabic text-sm' : 'text-[11px] uppercase tracking-[0.32em]'
                )}
              >
                {note}
              </p>
            ))}
          </motion.div>

          {/* The CTA — breathing, alive, psychologically tense */}
          <motion.div
            {...inView}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="relative"
          >
            {/* Outer aura — slow heartbeat pulse */}
            <motion.div
              className="absolute -inset-6 pointer-events-none"
              animate={{
                opacity: [0.04, 0.18, 0.04],
                scale: [1, 1.04, 1],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'radial-gradient(ellipse at center, hsl(18 92% 55%), transparent 65%)',
              }}
            />

            {/* Container box */}
            <motion.div
              className="relative border bg-black"
              animate={{
                borderColor: [
                  'hsl(18 92% 55% / 0.10)',
                  'hsl(18 92% 55% / 0.30)',
                  'hsl(18 92% 55% / 0.10)',
                ],
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Inner ambient glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.0, 0.08, 0.0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(ellipse at 50% 65%, hsl(18 92% 55%), transparent 58%)' }}
              />

              <div className={cn('relative px-10 py-12 text-center', isRTL && 'text-right')}>
                <button
                  onClick={handleStartDiagnosis}
                  className={cn(
                    'group w-full inline-flex items-center justify-center gap-5 px-8 py-6 bg-ember text-black hover:bg-white transition-all duration-500',
                    isRTL && 'flex-row-reverse'
                  )}
                >
                  <span className={cn(
                    'text-sm font-semibold',
                    isRTL ? 'font-arabic tracking-normal text-base' : 'uppercase tracking-[0.28em]'
                  )}>
                    {v.diagnosisCta.button}
                  </span>
                  <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
                </button>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ============ CONSULTATION WALKTHROUGH ============ */}
      <section className="relative py-24 md:py-32 px-6 lg:px-12 border-t border-white/5 bg-black">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9 }}
            className={cn('mb-16', isRTL && 'text-right')}
          >
            <p className={cn('text-[10px] uppercase text-ember mb-4', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]')}>
              {isRTL ? 'ماذا يحدث بعد الحجز؟' : 'What happens after booking?'}
            </p>
            <h2 className={cn(
              'text-3xl md:text-5xl leading-tight tracking-tight',
              isRTL ? 'font-arabic font-bold leading-[1.4]' : 'font-serif-display'
            )}>
              {isRTL ? 'أربع خطوات واضحة.' : 'Four clear steps.'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-px bg-white/5 border border-white/5">
            {[
              { n: '01', en: 'Review', ar: 'المراجعة', enBody: 'Your diagnostic results and submitted context are reviewed before the session begins.', arBody: 'تُراجَع نتائج تشخيصك والسياق المُقدَّم قبل بدء الجلسة.' },
              { n: '02', en: 'Diagnosis', ar: 'التشخيص', enBody: 'A forensic reading of your specific failure patterns, blind spots, and decision history.', arBody: 'قراءة جنائية لأنماط الفشل الخاصة بك ونقاط عمائك وتاريخ قراراتك.' },
              { n: '03', en: 'Strategic Discussion', ar: 'النقاش الاستراتيجي', enBody: 'An honest conversation about what is actually happening — not what should be happening.', arBody: 'محادثة صادقة حول ما يحدث فعلاً — وليس ما ينبغي أن يحدث.' },
              { n: '04', en: 'Action Plan', ar: 'خطة العمل', enBody: 'A specific set of interventions calibrated to your risk level and current position in the valley.', arBody: 'مجموعة محددة من التدخلات المُعايَرة وفق مستوى مخاطرك وموقعك الحالي في الوادي.' },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className={cn('bg-black p-8 md:p-10', isRTL && 'text-right')}
              >
                <div className={cn('text-[10px] text-ember mb-5', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.35em] uppercase font-medium')}>
                  {step.n}
                </div>
                <h3 className={cn('text-xl mb-3', isRTL ? 'font-arabic font-bold' : 'font-serif-display')}>
                  {isRTL ? step.ar : step.en}
                </h3>
                <p className={cn('text-sm text-white/45 font-light leading-relaxed', isRTL && 'font-arabic leading-[2]')}>
                  {isRTL ? step.arBody : step.enBody}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ RESOURCES (placeholder — future products) ============ */}
      <section className="relative py-16 px-6 lg:px-12 border-t border-white/5 bg-black">
        <div className={cn('max-w-5xl mx-auto', isRTL && 'text-right')}>
          <p className={cn('text-[10px] uppercase text-white/20 mb-6', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]')}>
            {isRTL ? 'الموارد القادمة' : 'Coming resources'}
          </p>
          <div className={cn('flex flex-wrap gap-4', isRTL && 'justify-end')}>
            {[
              { en: 'Recovery Playbook', ar: 'دليل الاسترداد' },
              { en: 'Founder Survival Toolkit', ar: 'أدوات نجاة المؤسس' },
              { en: 'Startup Failure Framework', ar: 'إطار فشل الشركات' },
            ].map(item => (
              <div key={item.en} className={cn(
                'px-4 py-2.5 border border-white/[0.06] text-[11px] text-white/20',
                isRTL ? 'font-arabic text-sm' : 'uppercase tracking-[0.2em]'
              )}>
                {isRTL ? item.ar : item.en}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE ASSESSMENT — full-screen overlay, revealed on CTA click */}
      {assessmentActive && (
        <ValleyAssessment />
      )}

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <FounderTestimonials
        eyebrow={v.testimonialsEyebrow}
        heading={v.testimonialsHeading}
      />
    </div>
  );
}
