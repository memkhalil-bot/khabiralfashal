import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowUpRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SEOHead } from '@/components/seo/SEOHead';
import bookCallPhone from '@/assets/book-call-phone.png';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(120).optional(),
  stage: z.enum(['idea', 'pre-seed', 'seed', 'series-a', 'post-failure']),
  context: z.string().trim().min(20).max(1500),
});
type FormValues = z.infer<typeof schema>;

export default function Contact() {
  const t = useT();
  const c = t.contact;
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedStage = watch('stage');

  const onSubmit = async (_data: FormValues) => {
    await new Promise((r) => setTimeout(r, 900));
    setDone(true);
    reset();
    setTimeout(() => setDone(false), 6000);
  };

  const inputClass = cn(
    'w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-lg font-light transition-colors',
    isRTL && 'font-arabic text-right'
  );

  return (
    <div className={cn('dark bg-black text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={c.metaTitle} description={c.metaDesc} />

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 lg:px-12 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.12),transparent_65%)]" />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={cn('order-2 lg:order-1', isRTL && 'text-right')}
          >
            <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
              <span className="h-px w-12 bg-ember" />
              <span className={cn(
                'text-xs uppercase text-ember font-medium',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
              )}>
                {c.eyebrow}
              </span>
            </div>
            <h1 className={cn(
              'leading-[0.95] tracking-tight',
              isRTL
                ? 'font-arabic font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.3]'
                : 'font-serif-display text-5xl md:text-7xl lg:text-8xl'
            )}>
              {c.heroHeading1}
              <br />
              <span className={cn('text-ember', !isRTL && 'italic')}>{c.heroHeading2}</span>
            </h1>
            <p className={cn(
              'mt-10 text-lg md:text-xl text-white/55 max-w-xl leading-relaxed font-light',
              isRTL && 'leading-[2.2]'
            )}>
              {c.heroSub}
            </p>
            {!isRTL && (
              <p
                dir="rtl"
                className="mt-6 font-arabic text-base md:text-lg text-white/40 leading-relaxed max-w-xl"
              >
                {c.heroArabicSub}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(18_92%_55%/0.18),transparent_70%)] blur-2xl" />
            <div className="relative w-full max-w-lg mx-auto">
              <div className="pointer-events-none absolute left-[42%] top-[14%] -translate-x-1/2 -translate-y-1/2 z-0">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="absolute left-1/2 top-1/2 block rounded-full border border-ember/40 animate-ripple"
                    style={{ width: 40, height: 40, marginLeft: -20, marginTop: -20, animationDelay: `${i * 1.2}s` }}
                  />
                ))}
              </div>
              <svg
                className="pointer-events-none absolute left-[30%] top-[6%] w-24 h-24 z-0 text-ember/60"
                viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"
              >
                <path d="M20 70 Q50 30 80 70" className="animate-arc" style={{ animationDelay: '0s' }} />
                <path d="M30 75 Q50 45 70 75" className="animate-arc" style={{ animationDelay: '0.6s' }} />
                <path d="M40 80 Q50 60 60 80" className="animate-arc" style={{ animationDelay: '1.2s' }} />
              </svg>
              <img
                src={bookCallPhone}
                alt="Orange phone receiver — book a risk session"
                className="relative z-10 w-full h-auto select-none pointer-events-none animate-float"
                draggable={false}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="px-6 lg:px-12 py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {c.pillars.map((b) => (
            <div key={b.k} className={cn('bg-black p-8', isRTL && 'text-right')}>
              <div className={cn(
                'text-3xl text-ember mb-3',
                isRTL ? 'font-arabic font-bold' : 'font-serif-display'
              )}>
                {b.k}
              </div>
              <p className={cn('text-sm text-white/50 font-light leading-relaxed', isRTL && 'leading-[2]')}>
                {b.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section className="px-6 lg:px-12 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-ember/30 bg-ember/5 p-12 text-center"
            >
              <CheckCircle2 className="size-12 mx-auto text-ember mb-6" />
              <h3 className={cn(
                'text-3xl mb-3',
                isRTL ? 'font-arabic font-bold' : 'font-serif-display'
              )}>
                {c.successHeading}
              </h3>
              <p className={cn(
                'text-white/60 font-light max-w-md mx-auto leading-relaxed',
                isRTL && 'font-arabic leading-[2]'
              )}>
                {c.successBody}
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-10"
            >
              <div className={cn('mb-12', isRTL && 'text-right')}>
                <p className={cn(
                  'text-xs uppercase text-ember mb-4',
                  isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
                )}>
                  {c.formLabel}
                </p>
                <h2 className={cn(
                  'text-3xl md:text-4xl tracking-tight',
                  isRTL ? 'font-arabic font-bold leading-[1.5]' : 'font-serif-display'
                )}>
                  {c.formHeading}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <Field label={c.fieldName} error={errors.name?.message} isRTL={isRTL}>
                  <input
                    {...register('name')}
                    className={inputClass}
                    placeholder={c.fieldNamePlaceholder}
                  />
                </Field>
                <Field label={c.fieldEmail} error={errors.email?.message} isRTL={isRTL}>
                  <input
                    {...register('email')}
                    type="email"
                    className={inputClass}
                    placeholder={c.fieldEmailPlaceholder}
                    dir="ltr"
                  />
                </Field>
              </div>

              <Field label={c.fieldCompany} isRTL={isRTL}>
                <input
                  {...register('company')}
                  className={inputClass}
                  placeholder={c.fieldCompanyPlaceholder}
                />
              </Field>

              <Field label={c.fieldStage} error={errors.stage?.message} isRTL={isRTL}>
                <div className={cn('flex flex-wrap gap-2 pt-2', isRTL && 'justify-end')}>
                  {c.stages.map((s) => {
                    const active = selectedStage === s.v;
                    return (
                      <button
                        type="button"
                        key={s.v}
                        onClick={() => setValue('stage', s.v as FormValues['stage'], { shouldValidate: true })}
                        className={cn(
                          'px-4 py-2 text-xs border transition-all',
                          isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.15em] uppercase',
                          active
                            ? 'border-ember bg-ember/10 text-ember'
                            : 'border-white/15 text-white/50 hover:border-white/40 hover:text-white/80'
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field
                label={c.fieldContext}
                hint={c.fieldContextHint}
                error={errors.context?.message}
                isRTL={isRTL}
              >
                <textarea
                  {...register('context')}
                  rows={6}
                  className={cn(inputClass, 'resize-none')}
                  placeholder={c.fieldContextPlaceholder}
                />
              </Field>

              <div className={cn('pt-8', isRTL && 'text-right')}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full md:w-auto inline-flex items-center justify-between gap-12 px-10 py-6 bg-ember text-black hover:bg-white transition-all duration-500 disabled:opacity-50"
                >
                  <span className={cn(
                    'text-sm uppercase font-semibold',
                    isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]'
                  )}>
                    {isSubmitting ? c.submittingLabel : c.submitLabel}
                  </span>
                  {isSubmitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <ArrowUpRight className={cn('size-5 transition-transform group-hover:rotate-45', isRTL && 'rotate-180')} />
                  )}
                </button>

                <p className={cn(
                  'mt-6 text-xs text-white/30 tracking-wide font-light max-w-md',
                  isRTL && 'font-arabic text-right leading-[2]'
                )}>
                  {c.submitDisclaimer}
                </p>
              </div>
            </motion.form>
          )}
        </div>
      </section>

      {/* CLOSING */}
      <section className="border-t border-white/5 py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className={cn(
            'text-2xl md:text-4xl italic text-white/40 leading-snug',
            isRTL ? 'font-arabic font-bold leading-[1.8]' : 'font-serif-display'
          )}>
            {c.closingQuote}
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- small field primitive ---------- */
function Field({
  label,
  hint,
  error,
  isRTL,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  isRTL?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={isRTL ? 'text-right' : undefined}>
      <label className={cn(
        'block text-[11px] uppercase text-white/40 mb-2',
        isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.25em]'
      )}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className={cn('mt-2 text-xs text-white/30 font-light', isRTL && 'font-arabic leading-[2]')}>{hint}</p>
      )}
      {error && (
        <p className={cn('mt-2 text-xs text-ember font-light', isRTL && 'font-arabic')}>{error}</p>
      )}
    </div>
  );
}
