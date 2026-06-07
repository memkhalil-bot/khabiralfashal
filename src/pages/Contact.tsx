import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SEOHead } from '@/components/seo/SEOHead';
import bookCallPhone from '@/assets/book-call-phone.png';
import bookCallPhoneWebp from '@/assets/book-call-phone.webp';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { ReportRequestContext } from '@/components/valley/AssessmentResult';

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
  const { lang, getPath } = useLanguage();
  const isRTL = lang === 'ar';
  const navigate = useNavigate();
  const location = useLocation();

  // Arrives via AssessmentResult's "Request a detailed report" CTA as
  // `/contact?intent=report`, optionally carrying the originating valley_lead context.
  const intent = new URLSearchParams(location.search).get('intent');
  const reportContext = (location.state ?? null) as ReportRequestContext | null;

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedStage = watch('stage');

  const onSubmit = async (data: FormValues) => {
    // "Request a detailed report" CTA → write a real report_requests row
    // (Valley completed → Report requested → report_requests → /admin/report-queue)
    if (intent === 'report') {
      try {
        const { data: service } = await (supabase as any)
          .from('services')
          .select('price')
          .eq('service_key', 'valley_report')
          .maybeSingle();
        const price = service?.price != null ? Number(service.price) : 0;

        const { data: inserted } = await (supabase as any)
          .from('report_requests')
          .insert({
            valley_lead_id:      reportContext?.valleyLeadId ?? null,
            assessment_id:       reportContext?.assessmentId ?? null,
            full_name:           data.name,
            email:               data.email,
            company:             data.company || reportContext?.company || null,
            report_type:         'valley_report',
            risk_score:          reportContext?.riskScore ?? null,
            risk_level:          reportContext?.riskLevel ?? null,
            original_price:      price,
            discount_value:      0,
            final_price:         price,
            payment_status:      price > 0 ? 'pending' : 'free',
          })
          .select('id')
          .single();

        if (inserted?.id && reportContext?.valleyLeadId) {
          (supabase as any)
            .from('valley_leads')
            .update({ requested_report: true })
            .eq('id', reportContext.valleyLeadId)
            .then(() => {})
            .catch(() => {});
        }
      } catch {
        /* fall through to confirmation regardless — never block the founder */
      }
    } else {
      await new Promise((r) => setTimeout(r, 900));
    }
    reset();
    navigate(getPath('/thank-you'), { state: { name: data.name } });
  };

  const inputClass = cn(
    'w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-lg font-light transition-colors duration-200 min-h-[48px] placeholder:text-white/25',
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
            <p className={cn(
              'mt-8 text-[10px] text-white/35 border-t border-white/[0.06] pt-6',
              isRTL ? 'font-arabic text-sm leading-[2]' : 'uppercase tracking-[0.28em]'
            )}>
              {c.sessionInfo}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className={cn('relative', isRTL ? 'order-2 lg:order-1' : 'order-1 lg:order-2')}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(18_92%_55%/0.22),transparent_65%)] blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,hsl(18_92%_55%/0.10),transparent_60%)] blur-xl" />
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
              <picture>
                <source srcSet={bookCallPhoneWebp} type="image/webp" />
                <img
                  src={bookCallPhone}
                  alt="Orange phone receiver — book a risk session"
                  className="relative z-10 w-full h-auto select-none pointer-events-none animate-float"
                  draggable={false}
                  loading="lazy"
                />
              </picture>
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
                    dir={isRTL ? 'rtl' : 'ltr'}
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
                  dir={isRTL ? 'rtl' : 'ltr'}
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
                {/* Situation tags */}
                <div className={cn('flex flex-wrap gap-2 mb-4 pt-2', isRTL && 'justify-end')}>
                  {c.situationTags.map((tag: string) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'px-3 py-1.5 text-[11px] border transition-all duration-200',
                          isRTL ? 'font-arabic text-sm' : 'uppercase tracking-[0.12em]',
                          active
                            ? 'border-ember/60 bg-ember/10 text-ember'
                            : 'border-white/12 text-white/40 hover:border-white/30 hover:text-white/65'
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  {...register('context')}
                  rows={6}
                  dir={isRTL ? 'rtl' : 'ltr'}
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
