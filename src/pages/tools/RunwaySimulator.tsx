import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type RiskLevel = 'critical' | 'high' | 'moderate' | 'stable' | null;

function parseAmount(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, '')) || 0;
}

function formatMonths(months: number, isRTL: boolean): string {
  const m = Math.floor(months);
  const d = Math.round((months - m) * 30);
  if (isRTL) {
    if (m === 0) return d > 0 ? `${d} يوم` : '—';
    return d > 0 ? `${m} شهر و${d} يوم` : `${m} شهر`;
  }
  if (m === 0) return d > 0 ? `${d} day${d !== 1 ? 's' : ''}` : '—';
  return d > 0 ? `${m}mo ${d}d` : `${m} month${m !== 1 ? 's' : ''}`;
}

function formatDate(date: Date, isRTL: boolean): string {
  return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

const RISK_CONFIG: Record<NonNullable<RiskLevel>, {
  color: string; bgColor: string; borderColor: string; glowColor: string;
  labelEn: string; labelAr: string;
  msgEn: string; msgAr: string;
}> = {
  critical: {
    color: 'text-red-400', bgColor: 'bg-red-400/5', borderColor: 'border-red-400/30',
    glowColor: 'hsl(0 84% 60%)',
    labelEn: 'CRITICAL', labelAr: 'حرج',
    msgEn: 'You have less than 3 months. Immediate action required.',
    msgAr: 'لديك أقل من 3 أشهر. مطلوب اتخاذ إجراء فوري.',
  },
  high: {
    color: 'text-ember', bgColor: 'bg-ember/5', borderColor: 'border-ember/30',
    glowColor: 'hsl(18 92% 55%)',
    labelEn: 'HIGH RISK', labelAr: 'مخاطرة عالية',
    msgEn: 'Less than 6 months. Plan your next move now.',
    msgAr: 'أقل من 6 أشهر. خطط لخطوتك التالية الآن.',
  },
  moderate: {
    color: 'text-amber-400', bgColor: 'bg-amber-400/5', borderColor: 'border-amber-400/30',
    glowColor: 'hsl(38 92% 55%)',
    labelEn: 'MODERATE', labelAr: 'متوسط',
    msgEn: '6–12 months remaining. Use this window to strengthen fundamentals.',
    msgAr: '٦–١٢ شهراً متبقية. استخدم هذه الفرصة لتعزيز الأسس.',
  },
  stable: {
    color: 'text-emerald-400', bgColor: 'bg-emerald-400/5', borderColor: 'border-emerald-400/30',
    glowColor: 'hsl(142 76% 55%)',
    labelEn: 'STABLE', labelAr: 'مستقر',
    msgEn: 'More than 12 months. Focus on growth and efficiency.',
    msgAr: 'أكثر من 12 شهراً. ركّز على النمو والكفاءة.',
  },
};

function NumberInput({
  value, onChange, placeholder, prefix, isRTL, label,
}: {
  value: string; onChange: (v: string) => void;
  placeholder: string; prefix?: string;
  isRTL: boolean; label: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    onChange(raw);
  };

  return (
    <div className={isRTL ? 'text-right' : undefined}>
      <label className={cn(
        'block text-[10px] uppercase text-white/35 mb-3',
        isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
      )}>
        {label}
      </label>
      <div className={cn('flex items-center gap-2 border-b border-white/20 focus-within:border-ember pb-3 transition-colors duration-200', isRTL && 'flex-row-reverse')}>
        {prefix && <span className="text-white/30 text-lg font-light flex-shrink-0">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          dir="ltr"
          className="flex-1 bg-transparent text-xl md:text-2xl font-light text-white outline-none placeholder:text-white/18 tabular-nums"
        />
      </div>
    </div>
  );
}

function RunwayBar({ pct, riskLevel }: { pct: number; riskLevel: NonNullable<RiskLevel> }) {
  const cfg = RISK_CONFIG[riskLevel];
  return (
    <div className="w-full">
      <div className="relative h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: cfg.glowColor,
            boxShadow: `0 0 8px 2px ${cfg.glowColor}60`,
          }}
        />
      </div>
    </div>
  );
}

export default function RunwaySimulator() {
  const { lang, getPath } = useLanguage();
  const isRTL = lang === 'ar';

  const [cash, setCash] = useState('');
  const [burn, setBurn] = useState('');
  const [teamSize, setTeamSize] = useState('');

  const result = useMemo(() => {
    const cashNum = parseAmount(cash);
    const burnNum = parseAmount(burn);
    if (!cashNum || !burnNum) return null;
    const months = cashNum / burnNum;
    const survivalDate = new Date(Date.now() + months * 30.44 * 24 * 60 * 60 * 1000);
    const riskLevel: RiskLevel =
      months < 3 ? 'critical' :
      months < 6 ? 'high' :
      months < 12 ? 'moderate' : 'stable';
    const barPct = Math.min((months / 24) * 100, 100); // 24 months = 100%
    return { months, survivalDate, riskLevel, barPct };
  }, [cash, burn]);

  const riskCfg = result ? RISK_CONFIG[result.riskLevel] : null;

  return (
    <div className={cn('dark bg-black text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead
        title={isRTL ? 'محاكي الرصيد التشغيلي — خبير الفشل' : 'Runway Simulator — Khabeer Al Fashal'}
        description={isRTL ? 'احسب الرصيد التشغيلي لشركتك الناشئة وقيّم مستوى المخاطرة.' : 'Calculate your startup runway and assess your risk level.'}
      />

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-16 px-6 lg:px-12 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.08),transparent_65%)]" />
        <div className={cn('relative max-w-4xl mx-auto', isRTL && 'text-right')}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
              <span className="h-px w-10 bg-ember" />
              <span className={cn('text-[10px] uppercase text-ember font-medium', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]')}>
                {isRTL ? 'أداة تشخيصية' : 'Diagnostic Tool'}
              </span>
            </div>
            <h1 className={cn(
              'leading-tight tracking-tight mb-6',
              isRTL ? 'font-arabic font-bold text-4xl md:text-6xl leading-[1.3]' : 'font-serif-display text-5xl md:text-7xl'
            )}>
              {isRTL ? 'محاكي الرصيد' : 'Runway'}
              <br />
              <span className={cn('text-white/45', !isRTL && 'italic')}>
                {isRTL ? 'التشغيلي' : 'Simulator'}
              </span>
            </h1>
            <p className={cn('text-lg text-white/45 font-light max-w-xl leading-relaxed', isRTL && 'leading-[2]')}>
              {isRTL
                ? 'أدخل بياناتك الحالية لمعرفة المدة المتبقية وتقييم مستوى المخاطرة.'
                : 'Enter your current numbers to see how long you have — and what it means.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="px-6 lg:px-12 py-20 md:py-28">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-start">

            {/* Inputs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              <NumberInput
                label={isRTL ? 'النقد المتاح' : 'Cash on hand'}
                value={cash}
                onChange={setCash}
                placeholder="500,000"
                prefix="$"
                isRTL={isRTL}
              />
              <NumberInput
                label={isRTL ? 'معدل الإنفاق الشهري' : 'Monthly burn rate'}
                value={burn}
                onChange={setBurn}
                placeholder="45,000"
                prefix="$"
                isRTL={isRTL}
              />
              <NumberInput
                label={isRTL ? 'حجم الفريق' : 'Team size'}
                value={teamSize}
                onChange={setTeamSize}
                placeholder="8"
                isRTL={isRTL}
              />
              <p className={cn('text-[9px] text-white/18', isRTL ? 'font-arabic text-xs leading-[2]' : 'uppercase tracking-[0.25em] leading-relaxed')}>
                {isRTL
                  ? 'هذه الأداة للاستخدام التشخيصي فقط. لا تُحفظ أي بيانات.'
                  : 'For diagnostic use only. No data is stored or transmitted.'}
              </p>
            </motion.div>

            {/* Output */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
            >
              {result && riskCfg ? (
                <motion.div
                  key={result.riskLevel}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className={cn('border p-8 md:p-10', riskCfg.borderColor, riskCfg.bgColor, isRTL && 'text-right')}
                >
                  {/* Risk badge */}
                  <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
                    <span className={cn(
                      'text-[9px] font-semibold px-2.5 py-1 border',
                      riskCfg.color, riskCfg.borderColor,
                      isRTL ? 'font-arabic tracking-normal text-sm' : 'uppercase tracking-[0.3em]'
                    )}>
                      {isRTL ? riskCfg.labelAr : riskCfg.labelEn}
                    </span>
                  </div>

                  {/* Months remaining — big number */}
                  <div className="mb-2">
                    <p className={cn('text-[9px] uppercase text-white/28 mb-3', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
                      {isRTL ? 'الرصيد المتبقي' : 'Runway remaining'}
                    </p>
                    <p
                      className={cn(
                        'text-5xl md:text-7xl leading-none tabular-nums',
                        riskCfg.color,
                        isRTL ? 'font-arabic font-bold' : 'font-serif-display italic'
                      )}
                      style={{ textShadow: `0 0 40px ${riskCfg.glowColor}40` }}
                    >
                      {formatMonths(result.months, isRTL)}
                    </p>
                  </div>

                  {/* Bar */}
                  <div className="my-8">
                    <RunwayBar pct={result.barPct} riskLevel={result.riskLevel} />
                  </div>

                  {/* Survival date */}
                  <div className="mb-8">
                    <p className={cn('text-[9px] uppercase text-white/28 mb-2', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>
                      {isRTL ? 'تاريخ الانتهاء المقدّر' : 'Estimated runway end'}
                    </p>
                    <p className={cn('text-lg text-white/70 font-light', isRTL && 'font-arabic')}>
                      {formatDate(result.survivalDate, isRTL)}
                    </p>
                  </div>

                  {/* Risk message */}
                  <p className={cn('text-sm text-white/55 font-light leading-relaxed mb-8', isRTL ? 'font-arabic leading-[2]' : undefined)}>
                    {isRTL ? riskCfg.msgAr : riskCfg.msgEn}
                  </p>

                  {/* CTA — only show for high-risk */}
                  {(result.riskLevel === 'critical' || result.riskLevel === 'high') && (
                    <Link
                      to={getPath('/valley-of-death')}
                      className={cn(
                        'group inline-flex items-center gap-4 px-6 py-4 transition-all duration-300 text-sm',
                        result.riskLevel === 'critical'
                          ? 'bg-red-500 text-black hover:bg-white'
                          : 'bg-ember text-black hover:bg-white',
                        isRTL ? 'font-arabic flex-row-reverse' : 'uppercase tracking-[0.2em] font-semibold'
                      )}
                    >
                      {isRTL ? 'ادخل التشخيص الكامل' : 'Enter Full Diagnostic'}
                      <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
                    </Link>
                  )}
                </motion.div>
              ) : (
                <div className={cn('border border-white/[0.06] p-8 md:p-10', isRTL && 'text-right')}>
                  <p className={cn('text-[10px] uppercase text-white/22 mb-4', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]')}>
                    {isRTL ? 'النتيجة' : 'Result'}
                  </p>
                  <p className={cn('text-4xl md:text-6xl font-light text-white/12', isRTL ? 'font-arabic' : 'font-serif-display italic')}>
                    —
                  </p>
                  <p className={cn('mt-6 text-sm text-white/28 font-light leading-relaxed', isRTL ? 'font-arabic leading-[2]' : undefined)}>
                    {isRTL
                      ? 'أدخل النقد المتاح ومعدل الإنفاق لرؤية النتيجة.'
                      : 'Enter cash on hand and burn rate to see your result.'}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CONTEXT SECTION */}
      <section className="border-t border-white/5 px-6 lg:px-12 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.9 }}
            className={cn('grid md:grid-cols-3 gap-px bg-white/5 border border-white/5')}
          >
            {[
              { threshold: '< 3mo', labelEn: 'Critical', labelAr: 'حرج', bodyEn: 'Immediate restructuring required. Every decision affects survival.', bodyAr: 'إعادة هيكلة فورية مطلوبة. كل قرار يؤثر في البقاء.', color: 'text-red-400' },
              { threshold: '3–6mo', labelEn: 'High Risk', labelAr: 'مخاطرة عالية', bodyEn: 'Next fundraise or revenue milestone must be locked in now.', bodyAr: 'يجب تثبيت جولة التمويل القادمة أو الإيرادات الآن.', color: 'text-ember' },
              { threshold: '12mo+', labelEn: 'Stable', labelAr: 'مستقر', bodyEn: 'You have time. Use it to build systems, not just revenue.', bodyAr: 'لديك وقت. استخدمه لبناء الأنظمة وليس الإيرادات فقط.', color: 'text-emerald-400' },
            ].map(c => (
              <div key={c.threshold} className={cn('bg-black p-8', isRTL && 'text-right')}>
                <p className={cn('text-xs font-mono mb-3 text-white/25')}>{c.threshold}</p>
                <p className={cn('text-lg mb-3', c.color, isRTL ? 'font-arabic font-bold' : 'font-serif-display')}>{isRTL ? c.labelAr : c.labelEn}</p>
                <p className={cn('text-sm text-white/45 font-light leading-relaxed', isRTL && 'font-arabic leading-[2]')}>{isRTL ? c.bodyAr : c.bodyEn}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FULL DIAGNOSTIC CTA */}
      <section className="border-t border-white/5 px-6 lg:px-12 py-20 md:py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="max-w-2xl mx-auto"
        >
          <p className={cn('text-[10px] uppercase text-white/28 mb-6', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]')}>
            {isRTL ? 'الخطوة التالية' : 'Beyond the numbers'}
          </p>
          <h2 className={cn('tracking-tight mb-6', isRTL ? 'font-arabic font-bold text-3xl md:text-5xl leading-[1.4]' : 'font-serif-display text-3xl md:text-5xl')}>
            {isRTL ? 'الرصيد التشغيلي ليس التشخيص الكامل.' : 'Runway is not the full diagnosis.'}
          </h2>
          <p className={cn('text-base text-white/45 font-light leading-relaxed mb-10', isRTL && 'font-arabic leading-[2]')}>
            {isRTL
              ? 'معظم المؤسسين يتعاملون مع رقم الرصيد بينما يتجاهلون الأنماط السلوكية التي تسرّعه. التشخيص الكامل يكشف ما يختبئ خلف الرقم.'
              : 'Most founders optimize for the number while ignoring the behavioral patterns accelerating it. The full diagnostic reveals what is hiding behind the number.'}
          </p>
          <Link
            to={getPath('/valley-of-death')}
            className={cn(
              'group inline-flex items-center gap-5 px-8 py-5 border border-white/20 hover:border-ember hover:bg-ember/5 transition-all duration-500',
              isRTL && 'flex-row-reverse'
            )}
          >
            <span className={cn('text-sm font-medium text-white/70 group-hover:text-white transition-colors', isRTL ? 'font-arabic' : 'uppercase tracking-[0.25em]')}>
              {isRTL ? 'التشخيص الكامل' : 'Full Diagnostic'}
            </span>
            <ArrowRight className={cn('size-4 text-white/35 group-hover:text-ember group-hover:translate-x-1 transition-all', isRTL && 'rotate-180')} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
