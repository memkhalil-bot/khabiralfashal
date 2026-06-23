import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, AlertCircle, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { cn } from '@/lib/utils';

// ── Copy ─────────────────────────────────────────────────────────────────────

// Fixed session type for the simplified first-touch form — no longer chosen
// by the visitor, but still required by the booking_requests schema.
const SESSION_TYPE = 'founder_call';

const copy = {
  en: {
    metaTitle: 'Book a Session — Khabeer Al Fashal',
    metaDesc:  'Request a private session with Khabeer Al Fashal.',
    eyebrow:   'Session Intake',
    heading:   'Request a Session.',
    sub:       'Tell us where you stand and what worries you most — we will reach back with the next step.',
    privacy:   '100% confidential · No investor disclosure · No spam',
    stages: [
      { v: 'idea',         label: 'Idea / Pre-build' },
      { v: 'pre-seed',     label: 'Pre-seed' },
      { v: 'seed',         label: 'Seed' },
      { v: 'series-a',     label: 'Series A+' },
      { v: 'post-failure', label: 'Post-failure / Pivot' },
    ],
    fields: {
      fullName:      'Full Name',
      email:         'Email',
      stage:         'Startup Stage',
      painPoint:     'Biggest Pain Point',
      painPointHint: 'What worries you most right now? Be direct — the more honest the intake, the sharper the session.',
    },
    placeholders: {
      fullName:   'Mohamed K.',
      email:      'you@company.com',
      painPoint:  'The numbers say one thing. My gut says another…',
    },
    promoCode:         'Promo Code (optional)',
    promoPlaceholder:  'FAIL01',
    promoValidating:   'Validating…',
    promoApplied:      'Code applied',
    promoInvalid:      'Invalid or expired code',
    submit:     'Submit Request',
    submitting: 'Submitting…',
    successHeading: 'Your session request has been received.',
    successBody:    'We will review your case and respond with the next step.',
    errorGeneric:   'Something went wrong. Please try again.',
  },
  ar: {
    metaTitle: 'احجز جلسة — خبير الفشل',
    metaDesc:  'اطلب جلسة خاصة مع خبير الفشل.',
    eyebrow:   'استمارة الحجز',
    heading:   'اطلب جلسة.',
    sub:       'شاركنا وضعك الحالي وما يقلقك أكثر — وسنعود إليك بالخطوة التالية.',
    privacy:   'سرية كاملة · لا مشاركة مع المستثمرين · لا رسائل مزعجة',
    stages: [
      { v: 'idea',         label: 'فكرة / ما قبل البناء' },
      { v: 'pre-seed',     label: 'ما قبل التمويل الأولي' },
      { v: 'seed',         label: 'التمويل الأولي' },
      { v: 'series-a',     label: 'الجولة A وما بعدها' },
      { v: 'post-failure', label: 'ما بعد الانهيار / تحول محوري' },
    ],
    fields: {
      fullName:      'الاسم الكامل',
      email:         'البريد الإلكتروني',
      stage:         'مرحلة الشركة',
      painPoint:     'أكبر نقطة ألم',
      painPointHint: 'ما الذي يقلقك أكثر من أي شيء الآن؟ كن مباشراً، كلما كان الإدخال أصدق كانت الجلسة أحدّ.',
    },
    placeholders: {
      fullName:   'محمد خ.',
      email:      'you@company.com',
      painPoint:  'الأرقام تقول شيئاً. حدسي يقول شيئاً آخر...',
    },
    promoCode:         'كود الخصم (اختياري)',
    promoPlaceholder:  'FAIL01',
    promoValidating:   'جارٍ التحقق...',
    promoApplied:      'تم تطبيق الكود',
    promoInvalid:      'الكود غير صالح أو منتهي الصلاحية',
    submit:     'إرسال الطلب',
    submitting: 'جارٍ الإرسال...',
    successHeading: 'تم استلام طلب الجلسة.',
    successBody:    'سنراجع حالتك ونعود إليك بالخطوة التالية.',
    errorGeneric:   'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
  },
} as const;

type Lang = 'en' | 'ar';

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  full_name:  string;
  email:      string;
  stage:      string;
  pain_point: string;
}

const EMPTY: FormState = {
  full_name: '', email: '', stage: '', pain_point: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputBase =
  'w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-base font-light transition-colors duration-200 placeholder:text-white/25 min-h-[48px]';

function Field({
  label, hint, error, isRTL, children,
}: {
  label: string; hint?: string; error?: string; isRTL: boolean; children: React.ReactNode;
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
        <p className={cn('mt-2 text-xs text-ember', isRTL && 'font-arabic')}>{error}</p>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookSession() {
  const { lang } = useLanguage();
  const c = copy[lang as Lang] ?? copy.en;
  const isRTL = lang === 'ar';

  // Live service prices (used to compute original/discount/final price on submit)
  const { data: servicePrices } = useQuery({
    queryKey: ['public', 'services', 'session-prices'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('services')
        .select('service_key, price')
        .eq('category', 'session')
        .eq('active', true);
      if (error) throw error;
      return (data ?? []) as { service_key: string; price: number | string }[];
    },
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    valid: boolean;
    promoCodeId: string | null;
    discountType: string | null;
    discountValue: number | null;
    title: string | null;
  } | null>(null);
  const promoDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validatePromo = (code: string) => {
    if (!code.trim()) { setPromoResult(null); return; }
    if (promoDebounce.current) clearTimeout(promoDebounce.current);
    promoDebounce.current = setTimeout(async () => {
      setPromoValidating(true);
      try {
        const { data } = await (supabase as any).rpc('validate_promo_code', {
          input_code:        code.trim().toUpperCase(),
          input_service_key: SESSION_TYPE,
          input_email:       form.email.trim() || null,
        });
        if (data && data.valid) {
          setPromoResult({
            valid: true,
            promoCodeId:   data.promo_code_id,
            discountType:  data.discount_type,
            discountValue: data.discount_value,
            title:         data.title,
          });
        } else {
          setPromoResult({ valid: false, promoCodeId: null, discountType: null, discountValue: null, title: null });
        }
      } catch {
        setPromoResult({ valid: false, promoCodeId: null, discountType: null, discountValue: null, title: null });
      } finally {
        setPromoValidating(false);
      }
    }, 600);
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim())   e.full_name  = isRTL ? 'الاسم مطلوب'        : 'Name is required';
    if (!form.email.trim())       e.email      = isRTL ? 'البريد مطلوب'       : 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                   e.email      = isRTL ? 'بريد غير صالح'      : 'Invalid email';
    if (!form.stage)               e.stage      = isRTL ? 'اختر مرحلة الشركة'  : 'Select your startup stage';
    if (!form.pain_point.trim())  e.pain_point = isRTL ? 'هذا الحقل مطلوب'    : 'This field is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);

    try {
      // Price the session from live `services` data, then apply the validated promo (if any)
      const servicePrice = servicePrices?.find((s) => s.service_key === SESSION_TYPE)?.price;
      const originalPrice = servicePrice != null ? Number(servicePrice) : null;
      let discountValue = 0;
      if (originalPrice != null && promoResult?.valid) {
        if (promoResult.discountType === 'percentage') {
          discountValue = +(originalPrice * ((promoResult.discountValue ?? 0) / 100)).toFixed(2);
        } else if (promoResult.discountType === 'fixed_amount') {
          discountValue = Math.min(promoResult.discountValue ?? 0, originalPrice);
        } else if (promoResult.discountType === 'free') {
          discountValue = originalPrice;
        }
      }
      const finalPrice = originalPrice != null ? +(originalPrice - discountValue).toFixed(2) : null;

      // The simplified form no longer collects phone/country/session_type —
      // booking_requests still requires them, so they're sent with safe
      // hidden defaults. Stage + pain point are folded into `description`
      // since the table has no dedicated column for either (no schema change).
      const stageLabel = c.stages.find((s) => s.v === form.stage)?.label ?? form.stage;
      const payload = {
        full_name:      form.full_name.trim(),
        email:          form.email.trim(),
        phone:          'Not provided',
        company:        null,
        country:        'Not provided',
        session_type:   SESSION_TYPE,
        preferred_date: null,
        preferred_time: null,
        description:    `Startup Stage: ${stageLabel}\n\n${form.pain_point.trim()}`,
        status:         'pending',
        promo_code:     promoResult?.valid ? promoInput.trim().toUpperCase() : null,
        promo_code_id:  promoResult?.valid ? promoResult.promoCodeId : null,
        original_price: originalPrice,
        discount_value: discountValue,
        final_price:    finalPrice,
      };

      const { data: inserted, error } = await (supabase as any)
        .from('booking_requests')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;

      // Attempt to create admin notification (graceful — table may not exist)
      if (inserted?.id) {
        await (supabase as any)
          .from('admin_notifications')
          .insert({
            type:          'booking_request',
            title:         'New Session Request',
            related_table: 'booking_requests',
            related_id:    inserted.id,
            priority:      'high',
            status:        'unread',
          })
          .then(() => {})
          .catch(() => {});
      }

      // Record promo redemption + bump used_count (graceful — never blocks the booking itself)
      if (inserted?.id && promoResult?.valid && promoResult.promoCodeId) {
        (async () => {
          try {
            await (supabase as any).from('promo_code_redemptions').insert({
              promo_code_id: promoResult.promoCodeId,
              code:          promoInput.trim().toUpperCase(),
              email:         form.email.trim(),
              service_key:   SESSION_TYPE,
              related_type:  'booking_request',
              related_id:    inserted.id,
              discount_type: promoResult.discountType,
              discount_value: promoResult.discountValue,
            });
            const { data: promoRow } = await (supabase as any)
              .from('promo_codes')
              .select('used_count')
              .eq('id', promoResult.promoCodeId)
              .single();
            if (promoRow) {
              await (supabase as any)
                .from('promo_codes')
                .update({ used_count: (promoRow.used_count ?? 0) + 1 })
                .eq('id', promoResult.promoCodeId);
            }
          } catch { /* redemption bookkeeping is non-critical */ }
        })();
      }

      setSuccess(true);
      setForm(EMPTY);
    } catch (err: any) {
      setServerError(err?.message ?? c.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = cn(inputBase, isRTL && 'font-arabic text-right');

  return (
    <div className={cn('dark bg-[#080808] text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={c.metaTitle} description={c.metaDesc} />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-ember/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-20 md:py-32">

        {/* Brand mark */}
        <div className={cn('flex items-center gap-3 mb-14', isRTL && 'flex-row-reverse justify-end')}>
          <Flame className="size-5 text-ember shrink-0" />
          <div className={isRTL ? 'text-right' : undefined}>
            <p className={cn(
              'text-[11px] text-white font-medium',
              isRTL ? 'tracking-normal' : 'tracking-[0.3em] uppercase'
            )}>
              خبير الفشل
            </p>
            <p className={cn(
              'text-[9px] text-white/25 mt-0.5',
              isRTL ? 'tracking-normal text-xs' : 'tracking-[0.25em] uppercase'
            )}>
              {c.eyebrow}
            </p>
          </div>
        </div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={cn('mb-12', isRTL && 'text-right')}
        >
          <h1 className={cn(
            'leading-tight mb-4',
            isRTL
              ? 'font-arabic font-bold text-4xl md:text-5xl leading-[1.4]'
              : 'font-serif-display text-4xl md:text-6xl'
          )}>
            {c.heading}
          </h1>
          <p className={cn(
            'text-base text-white/50 font-light',
            isRTL && 'leading-[2]'
          )}>
            {c.sub}
          </p>
        </motion.div>

        {/* Success state */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'mb-10 p-8 border border-recovery/20 bg-recovery/5 rounded-2xl',
                isRTL && 'text-right'
              )}
            >
              <div className={cn('flex items-center gap-4 mb-4', isRTL && 'flex-row-reverse')}>
                <div className="size-10 rounded-full bg-recovery/15 border border-recovery/25 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5 text-recovery" />
                </div>
                <h2 className={cn(
                  'text-lg text-white font-medium',
                  isRTL ? 'font-arabic' : 'font-serif-display'
                )}>
                  {c.successHeading}
                </h2>
              </div>
              <p className={cn('text-white/55 font-light', isRTL && 'leading-[2]')}>
                {c.successBody}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-10"
          noValidate
        >

          {/* Name + Email */}
          <div className="grid sm:grid-cols-2 gap-8">
            <Field label={c.fields.fullName} error={errors.full_name} isRTL={isRTL}>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder={c.placeholders.fullName}
                dir={isRTL ? 'rtl' : 'ltr'}
                className={inputClass}
              />
            </Field>
            <Field label={c.fields.email} error={errors.email} isRTL={isRTL}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder={c.placeholders.email}
                dir="ltr"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Startup stage */}
          <Field label={c.fields.stage} error={errors.stage} isRTL={isRTL}>
            <div className={cn('flex flex-wrap gap-2 mt-3', isRTL && 'justify-end')}>
              {c.stages.map((s) => {
                const active = form.stage === s.v;
                return (
                  <button
                    key={s.v}
                    type="button"
                    onClick={() => set('stage', s.v)}
                    className={cn(
                      'px-4 py-2 border rounded-full text-xs transition-all duration-200',
                      isRTL && 'font-arabic text-sm',
                      active
                        ? 'border-ember/50 bg-ember/8 text-white'
                        : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white/80'
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Biggest pain point */}
          <Field
            label={c.fields.painPoint}
            hint={c.fields.painPointHint}
            error={errors.pain_point}
            isRTL={isRTL}
          >
            <textarea
              rows={5}
              value={form.pain_point}
              onChange={(e) => set('pain_point', e.target.value)}
              placeholder={c.placeholders.painPoint}
              dir={isRTL ? 'rtl' : 'ltr'}
              className={cn(inputClass, 'resize-none pt-3')}
            />
          </Field>

          {/* Promo code */}
          <Field label={c.promoCode} isRTL={isRTL}>
            <div className="relative">
              <Tag className="absolute start-0 top-1/2 -translate-y-1/2 size-3.5 text-white/20 pointer-events-none" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setPromoInput(v);
                  setPromoResult(null);
                  validatePromo(v);
                }}
                placeholder={c.promoPlaceholder}
                dir="ltr"
                className={cn(inputBase, 'ps-6 font-mono tracking-widest text-sm')}
              />
            </div>
            {promoValidating && (
              <p className={cn('mt-2 text-xs text-white/35', isRTL && 'font-arabic text-right')}>
                {c.promoValidating}
              </p>
            )}
            {!promoValidating && promoResult?.valid && (
              <p className={cn('mt-2 text-xs text-recovery flex items-center gap-1.5', isRTL && 'font-arabic flex-row-reverse text-right')}>
                <CheckCircle2 className="size-3 shrink-0" />
                {c.promoApplied}
                {promoResult.title && ` — ${promoResult.title}`}
                {promoResult.discountType === 'percentage' && ` (${promoResult.discountValue}%)`}
                {promoResult.discountType === 'fixed_amount' && ` ($${promoResult.discountValue})`}
                {promoResult.discountType === 'free' && ' (مجاني)'}
              </p>
            )}
            {!promoValidating && promoInput && promoResult && !promoResult.valid && (
              <p className={cn('mt-2 text-xs text-ember', isRTL && 'font-arabic text-right')}>
                {c.promoInvalid}
              </p>
            )}
          </Field>

          {/* Privacy notice */}
          <p className={cn(
            'text-[11px] text-white/30 border-t border-white/[0.06] pt-6',
            isRTL ? 'font-arabic text-right text-sm leading-[2]' : 'tracking-wide'
          )}>
            {c.privacy}
          </p>

          {/* Server error */}
          {serverError && (
            <div className={cn(
              'flex items-start gap-3 p-4 bg-red-950/30 border border-red-800/30 rounded-lg',
              isRTL && 'flex-row-reverse text-right'
            )}>
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className={cn('text-sm text-red-300', isRTL && 'font-arabic')}>{serverError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'w-full flex items-center justify-center gap-3 py-5 bg-ember hover:bg-ember-dim text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-none',
              isRTL ? 'font-arabic text-base' : 'text-[11px] tracking-[0.3em] uppercase'
            )}
          >
            {submitting ? (
              <>
                <span className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {c.submitting}
              </>
            ) : (
              c.submit
            )}
          </button>

        </motion.form>
      </div>
    </div>
  );
}
