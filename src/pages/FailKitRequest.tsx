import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { cn } from '@/lib/utils';
import type { ReportRequestContext } from '@/components/valley/AssessmentResult';
import { failKitT, FAIL_KIT_CATEGORY_LABELS } from '@/i18n/failKitTranslations';
import { MINI_ASSESSMENT_QUESTIONS } from '@/data/failKitMiniAssessment';
import {
  mapFailureModeToCategory,
  mapRiskToSeverity,
  mapRiskToUrgency,
  getRecommendedService,
} from '@/lib/failKitMapping';

const FAIL_KIT_PRICE = 19;

const inputBase =
  'w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-base font-light transition-colors duration-200 placeholder:text-white/25 min-h-[48px]';

function Field({
  label, error, isRTL, children,
}: {
  label: string; error?: string; isRTL: boolean; children: React.ReactNode;
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
      {error && <p className={cn('mt-2 text-xs text-ember', isRTL && 'font-arabic')}>{error}</p>}
    </div>
  );
}

interface ContactForm {
  full_name: string;
  email: string;
  country: string;
}

interface PromoResult {
  valid: boolean;
  promoCodeId: string | null;
  discountType: string | null;
  discountValue: number | null;
  title: string | null;
}

export default function FailKitRequest() {
  const { lang, getPath } = useLanguage();
  const isRTL = lang === 'ar';
  const t = failKitT[lang];
  const location = useLocation();
  const navigate = useNavigate();

  const reportContext = (location.state ?? null) as ReportRequestContext | null;

  // ── Derived diagnostic mapping (read-only — does not touch Valley scoring) ──
  const category = useMemo(
    () => mapFailureModeToCategory(reportContext?.primaryFailureMode),
    [reportContext?.primaryFailureMode]
  );
  const severity = useMemo(
    () => mapRiskToSeverity(reportContext?.riskScore, reportContext?.riskLevel),
    [reportContext?.riskScore, reportContext?.riskLevel]
  );
  const urgency = useMemo(
    () => mapRiskToUrgency(reportContext?.riskScore, reportContext?.riskLevel),
    [reportContext?.riskScore, reportContext?.riskLevel]
  );
  const recommendedService = useMemo(() => getRecommendedService(urgency), [urgency]);
  const questions = MINI_ASSESSMENT_QUESTIONS[category];
  const categoryLabel = FAIL_KIT_CATEGORY_LABELS[category]?.[lang] ?? category;

  // ── Wizard state ────────────────────────────────────────────────────────────
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(0);

  const [miniAnswers, setMiniAnswers] = useState<Record<string, number>>({});
  const [contact, setContact] = useState<ContactForm>({
    full_name: reportContext?.fullName ?? '',
    email:     reportContext?.email ?? '',
    country:   reportContext?.country ?? '',
  });
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});

  const [promoInput, setPromoInput] = useState('');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const promoDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ requestNumber: string | null } | null>(null);

  const setContactField = (field: keyof ContactForm, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    if (contactErrors[field]) setContactErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const validatePromo = (code: string) => {
    if (!code.trim()) { setPromoResult(null); return; }
    if (promoDebounce.current) clearTimeout(promoDebounce.current);
    promoDebounce.current = setTimeout(async () => {
      setPromoValidating(true);
      try {
        const { data } = await (supabase as any).rpc('validate_promo_code', {
          input_code:        code.trim().toUpperCase(),
          input_service_key: 'fail_kit',
          input_email:       contact.email.trim() || null,
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

  // ── Pricing ─────────────────────────────────────────────────────────────────
  const discountValue = useMemo(() => {
    if (!promoResult?.valid) return 0;
    if (promoResult.discountType === 'percentage') {
      return +(FAIL_KIT_PRICE * ((promoResult.discountValue ?? 0) / 100)).toFixed(2);
    }
    if (promoResult.discountType === 'fixed_amount') {
      return Math.min(promoResult.discountValue ?? 0, FAIL_KIT_PRICE);
    }
    if (promoResult.discountType === 'free') return FAIL_KIT_PRICE;
    return 0;
  }, [promoResult]);

  const finalPrice = +(FAIL_KIT_PRICE - discountValue).toFixed(2);
  const isFree = finalPrice <= 0;

  // ── Step validation / navigation ────────────────────────────────────────────
  const validateContact = (): boolean => {
    const e: Partial<Record<keyof ContactForm, string>> = {};
    if (!contact.full_name.trim()) e.full_name = t.contact.fullNameRequired;
    if (!contact.email.trim()) e.email = t.contact.emailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) e.email = t.contact.emailInvalid;
    if (!contact.country.trim()) e.country = t.contact.countryRequired;
    setContactErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateContact()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setServerError(null);
    try {
      const finalDiscount = discountValue > 0 ? discountValue : null;
      const paymentStatus = isFree ? 'free' : 'pending';

      const answersPayload = questions.map((q) => {
        const choiceIdx = miniAnswers[q.id];
        const option = choiceIdx != null ? q.options[choiceIdx] : null;
        return {
          id: q.id,
          question: { en: q.en, ar: q.ar },
          answer: option ? { en: option.en, ar: option.ar } : null,
        };
      });

      const payload = {
        full_name:               contact.full_name.trim(),
        email:                   contact.email.trim(),
        country:                 contact.country.trim(),
        assessment_id:           reportContext?.assessmentId ?? null,
        valley_lead_id:          reportContext?.valleyLeadId ?? null,
        risk_score:              reportContext?.riskScore ?? null,
        failure_category:        category,
        severity,
        urgency_level:           urgency,
        status:                  'requested',
        recommended_service:     recommendedService,
        payment_status:          paymentStatus,
        price:                   FAIL_KIT_PRICE,
        discount:                finalDiscount,
        final_price:             finalPrice,
        mini_assessment_answers: { category, answers: answersPayload },
        promo_code:              promoResult?.valid ? promoInput.trim().toUpperCase() : null,
        promo_code_id:           promoResult?.valid ? promoResult.promoCodeId : null,
        admin_notes:             null,
      };

      const { data: inserted, error } = await (supabase as any)
        .from('fail_kit_requests')
        .insert(payload)
        .select('id, request_number')
        .single();

      if (error) throw error;

      // Record promo redemption + bump used_count (graceful — never blocks the request itself)
      if (inserted?.id && promoResult?.valid && promoResult.promoCodeId) {
        (async () => {
          try {
            await (supabase as any).from('promo_code_redemptions').insert({
              promo_code_id:  promoResult.promoCodeId,
              code:           promoInput.trim().toUpperCase(),
              email:          contact.email.trim(),
              service_key:    'fail_kit',
              related_type:   'fail_kit_request',
              related_id:     inserted.id,
              discount_type:  promoResult.discountType,
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

      setSuccess({ requestNumber: inserted?.request_number ?? null });
    } catch (err) {
      console.error('Fail Kit request submission failed:', err);
      setServerError(t.payment.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = cn(inputBase, isRTL && 'font-arabic text-right');

  // ── No diagnostic context — guide the founder back to the assessment ────────
  if (!reportContext?.assessmentId || reportContext?.riskScore == null) {
    return (
      <div className={cn('dark bg-[#080808] text-white min-h-screen flex items-center justify-center px-6', isRTL ? 'font-arabic' : 'font-sans-ui')}>
        <SEOHead title={t.page.metaTitle} description={t.page.metaDesc} />
        <div className={cn('max-w-md text-center', isRTL && 'font-arabic leading-[2]')}>
          <p className="text-white/60 mb-8">
            {isRTL
              ? 'لا يمكن إعداد حقيبة فشل مخصصة دون نتيجة تشخيص. أكمل تقييم وادي الموت أولاً.'
              : 'A customized Fail Kit requires a diagnosis first. Complete the Valley Assessment to continue.'}
          </p>
          <Link
            to={getPath('/valley-of-death')}
            className="inline-flex items-center gap-3 px-7 py-4 bg-ember text-black hover:bg-white transition-colors duration-300 text-sm uppercase tracking-[0.25em]"
          >
            {isRTL ? 'ابدأ التقييم' : 'Start the Assessment'}
            <ArrowRight className={cn('size-4', isRTL && 'rotate-180')} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('dark bg-[#080808] text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={t.page.metaTitle} description={t.page.metaDesc} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-ember/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 py-20 md:py-32">

        {/* Heading + diagnostic context */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={cn('mb-12', isRTL && 'text-right')}
        >
          <p className={cn(
            'text-[10px] uppercase text-ember mb-4',
            isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]'
          )}>
            {t.page.eyebrow}
          </p>
          <h1 className={cn(
            'leading-tight mb-4',
            isRTL ? 'font-arabic font-bold text-4xl md:text-5xl leading-[1.4]' : 'font-serif-display text-4xl md:text-6xl'
          )}>
            {t.page.heading}
          </h1>
          <p className={cn('text-base text-white/50 font-light mb-8', isRTL && 'leading-[2]')}>
            {t.page.sub}
          </p>

          <div className={cn(
            'inline-flex flex-wrap gap-x-8 gap-y-3 p-5 border border-white/[0.08] bg-white/[0.02]',
            isRTL && 'flex-row-reverse text-right'
          )}>
            <div>
              <p className={cn('text-[9px] uppercase text-white/28 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
                {t.page.contextLabel}
              </p>
              <p className={cn('text-sm text-white/75', isRTL && 'font-arabic')}>
                {reportContext.fullName ?? '—'}
              </p>
            </div>
            <div>
              <p className={cn('text-[9px] uppercase text-white/28 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
                {t.page.categoryLabel}
              </p>
              <p className="text-sm text-ember font-medium">{categoryLabel}</p>
            </div>
            <div>
              <p className={cn('text-[9px] uppercase text-white/28 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
                {t.page.riskLabel}
              </p>
              <p className="text-sm text-white/75 tabular-nums">{reportContext.riskScore}/100</p>
            </div>
          </div>
        </motion.div>

        {/* Success state */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn('p-8 border border-recovery/20 bg-recovery/5 rounded-2xl', isRTL && 'text-right')}
            >
              <div className={cn('flex items-center gap-4 mb-4', isRTL && 'flex-row-reverse')}>
                <div className="size-10 rounded-full bg-recovery/15 border border-recovery/25 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5 text-recovery" />
                </div>
                <h2 className={cn('text-lg text-white font-medium', isRTL ? 'font-arabic' : 'font-serif-display')}>
                  {t.success.heading}
                </h2>
              </div>
              <p className={cn('text-white/55 font-light mb-6', isRTL && 'leading-[2]')}>
                {t.success.body}
              </p>
              {success.requestNumber && (
                <p className={cn('text-sm text-white/40 mb-8', isRTL && 'font-arabic')}>
                  {t.success.requestNumber}: <span className="text-white/70 font-mono tracking-wider">{success.requestNumber}</span>
                </p>
              )}
              <Link
                to={getPath('/')}
                className={cn(
                  'inline-flex items-center gap-3 text-[11px] uppercase text-white/40 hover:text-white/70 transition-colors',
                  isRTL ? 'font-arabic tracking-normal text-sm flex-row-reverse' : 'tracking-[0.25em]'
                )}
              >
                <ArrowRight className={cn('size-3.5', isRTL ? 'rotate-180' : 'rotate-180 scale-x-[-1]')} />
                {t.success.backHome}
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Step indicator */}
              <p className={cn(
                'text-[10px] uppercase text-white/30 mb-8',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
              )}>
                {t.page.stepLabel} {step + 1} {t.page.of} {TOTAL_STEPS}
              </p>

              {/* ── Step 0 — Mini assessment ──────────────────────────── */}
              {step === 0 && (
                <div className="space-y-10">
                  <div className={isRTL ? 'text-right' : undefined}>
                    <h2 className={cn('text-xl md:text-2xl mb-2', isRTL ? 'font-arabic font-bold' : 'font-serif-display')}>
                      {t.miniAssessment.heading}
                    </h2>
                    <p className={cn('text-sm text-white/45 font-light', isRTL && 'leading-[2]')}>
                      {t.miniAssessment.sub}
                    </p>
                  </div>

                  {questions.map((q, qi) => (
                    <div key={q.id} className={isRTL ? 'text-right' : undefined}>
                      <p className={cn(
                        'text-sm md:text-base text-white/80 mb-4',
                        isRTL ? 'font-arabic leading-[1.9]' : 'font-light leading-relaxed'
                      )}>
                        <span className="text-ember/50 me-2 tabular-nums">{String(qi + 1).padStart(2, '0')}</span>
                        {isRTL ? q.ar : q.en}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oi) => {
                          const active = miniAnswers[q.id] === oi;
                          return (
                            <button
                              key={oi}
                              type="button"
                              onClick={() => setMiniAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                              className={cn(
                                'px-4 py-3 border text-sm transition-all duration-200',
                                isRTL ? 'text-right font-arabic' : 'text-left',
                                active
                                  ? 'border-ember/50 bg-ember/8 text-white'
                                  : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/75'
                              )}
                            >
                              {isRTL ? opt.ar : opt.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Step 1 — Contact details ──────────────────────────── */}
              {step === 1 && (
                <div className="space-y-8">
                  <Field label={t.contact.fullName} error={contactErrors.full_name} isRTL={isRTL}>
                    <input
                      type="text"
                      value={contact.full_name}
                      onChange={(e) => setContactField('full_name', e.target.value)}
                      placeholder={t.contact.fullNamePlaceholder}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t.contact.email} error={contactErrors.email} isRTL={isRTL}>
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContactField('email', e.target.value)}
                      placeholder={t.contact.emailPlaceholder}
                      dir="ltr"
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t.contact.country} error={contactErrors.country} isRTL={isRTL}>
                    <input
                      type="text"
                      value={contact.country}
                      onChange={(e) => setContactField('country', e.target.value)}
                      placeholder={t.contact.countryPlaceholder}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {/* ── Step 2 — Payment placeholder + promo + submit ─────── */}
              {step === 2 && (
                <div className="space-y-8">
                  <h2 className={cn(
                    'text-xl md:text-2xl mb-1',
                    isRTL ? 'font-arabic font-bold text-right' : 'font-serif-display'
                  )}>
                    {t.payment.heading}
                  </h2>

                  {/* Price summary */}
                  <div className={cn('p-6 border border-white/[0.08] bg-white/[0.02]', isRTL && 'text-right')}>
                    <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                      <span className={cn('text-sm text-white/50', isRTL ? 'font-arabic' : 'tracking-wide')}>
                        {t.payment.priceLabel}
                      </span>
                      <span className="text-lg text-white font-mono tabular-nums">${FAIL_KIT_PRICE.toFixed(2)}</span>
                    </div>
                    {discountValue > 0 && (
                      <>
                        <div className={cn('flex items-center justify-between mt-2', isRTL && 'flex-row-reverse')}>
                          <span className={cn('text-sm text-white/40', isRTL ? 'font-arabic' : 'tracking-wide')}>
                            {t.payment.discount}
                          </span>
                          <span className="text-sm text-recovery font-mono tabular-nums">−${discountValue.toFixed(2)}</span>
                        </div>
                        <div className={cn('flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]', isRTL && 'flex-row-reverse')}>
                          <span className={cn('text-sm text-white/60 font-medium', isRTL ? 'font-arabic' : 'tracking-wide')}>
                            {t.payment.finalPrice}
                          </span>
                          <span className="text-lg text-ember font-mono tabular-nums">
                            {isFree ? t.payment.free : `$${finalPrice.toFixed(2)}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment placeholder notice */}
                  <p className={cn(
                    'text-sm text-white/45 leading-relaxed p-5 border border-white/[0.06] bg-white/[0.015]',
                    isRTL ? 'font-arabic leading-[2] text-right' : 'font-light'
                  )}>
                    {t.payment.notice}
                  </p>

                  {/* Promo code */}
                  <Field label={t.payment.promoLabel} isRTL={isRTL}>
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
                        placeholder={t.payment.promoPlaceholder}
                        dir="ltr"
                        className={cn(inputBase, 'ps-6 font-mono tracking-widest text-sm')}
                      />
                    </div>
                    {promoValidating && (
                      <p className={cn('mt-2 text-xs text-white/35', isRTL && 'font-arabic text-right')}>
                        {t.payment.promoValidating}
                      </p>
                    )}
                    {!promoValidating && promoResult?.valid && (
                      <p className={cn('mt-2 text-xs text-recovery flex items-center gap-1.5', isRTL && 'font-arabic flex-row-reverse text-right')}>
                        <CheckCircle2 className="size-3 shrink-0" />
                        {t.payment.promoApplied}
                        {promoResult.title && ` — ${promoResult.title}`}
                        {promoResult.discountType === 'percentage' && ` (${promoResult.discountValue}%)`}
                        {promoResult.discountType === 'fixed_amount' && ` ($${promoResult.discountValue})`}
                        {promoResult.discountType === 'free' && ` — ${t.payment.freeNotice}`}
                      </p>
                    )}
                    {!promoValidating && promoInput && promoResult && !promoResult.valid && (
                      <p className={cn('mt-2 text-xs text-ember', isRTL && 'font-arabic text-right')}>
                        {t.payment.promoInvalid}
                      </p>
                    )}
                  </Field>

                  {serverError && (
                    <p className={cn('text-sm text-ember', isRTL && 'font-arabic text-right')}>{serverError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={cn(
                      'w-full inline-flex items-center justify-center gap-3 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <span className={cn('text-sm uppercase font-semibold', isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]')}>
                      {submitting ? t.payment.submitting : t.payment.submit}
                    </span>
                  </button>
                </div>
              )}

              {/* Navigation */}
              {step < 2 && (
                <div className={cn('mt-12 flex items-center justify-between', isRTL && 'flex-row-reverse')}>
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={goBack}
                      className={cn(
                        'text-[11px] uppercase text-white/35 hover:text-white/60 transition-colors',
                        isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.25em]'
                      )}
                    >
                      {t.page.back}
                    </button>
                  ) : <span />}

                  <button
                    type="button"
                    onClick={goNext}
                    className={cn(
                      'group inline-flex items-center gap-4 px-7 py-4 bg-ember text-black hover:bg-white transition-all duration-300',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    <span className={cn('text-sm uppercase font-semibold', isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]')}>
                      {t.page.next}
                    </span>
                    <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className={cn('mt-8', isRTL ? 'text-right' : undefined)}>
                  <button
                    type="button"
                    onClick={goBack}
                    className={cn(
                      'text-[11px] uppercase text-white/35 hover:text-white/60 transition-colors',
                      isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.25em]'
                    )}
                  >
                    {t.page.back}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
