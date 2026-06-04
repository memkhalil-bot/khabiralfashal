import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PRIORITY_TIMELINES = {
  high: {
    en: [
      { period: '30 Days', items: ['Stop all non-critical spending', 'Have the conversation you have been avoiding', 'Get an honest assessment of your runway'] },
      { period: '60 Days', items: ['Restructure or remove the highest-risk dependency', 'Make the team composition decision', 'Establish a weekly crisis review cadence'] },
      { period: '90 Days', items: ['Assess whether the current model is viable', 'Make the pivot or continue decision with full information', 'Establish new operating baseline'] },
    ],
    ar: [
      { period: '٣٠ يوماً', items: ['أوقف كل الإنفاق غير الجوهري', 'أجرِ المحادثة التي تجنبتها', 'احصل على تقييم صادق لرصيدك التشغيلي'] },
      { period: '٦٠ يوماً', items: ['أعد هيكلة أو أزل أعلى تبعية خطرة', 'اتخذ قرار تشكيل الفريق', 'أسّس إيقاعاً أسبوعياً لمراجعة الأزمات'] },
      { period: '٩٠ يوماً', items: ['قيّم ما إذا كان النموذج الحالي قابلاً للحياة', 'اتخذ قرار التحول أو الاستمرار بمعلومات كاملة', 'أسّس قاعدة تشغيل جديدة'] },
    ],
  },
  medium: {
    en: [
      { period: '30 Days', items: ['Identify and document your top 3 risk signals', 'Have one honest conversation per week with a trusted advisor', 'Establish clearer decision ownership in the team'] },
      { period: '60 Days', items: ['Address the highest-priority blind spot directly', 'Review financial assumptions in the operating model', 'Implement a monthly risk review'] },
      { period: '90 Days', items: ['Assess whether interventions have reduced exposure', 'Make strategic decisions that have been delayed', 'Strengthen the information flow from team to founder'] },
    ],
    ar: [
      { period: '٣٠ يوماً', items: ['حدد ووثّق أعلى 3 إشارات خطر لديك', 'أجرِ محادثة صادقة أسبوعياً مع مستشار موثوق', 'أرسِ ملكية قرارات أوضح في الفريق'] },
      { period: '٦٠ يوماً', items: ['عالج نقطة العمى ذات الأولوية القصوى مباشرةً', 'راجع الافتراضات المالية في النموذج التشغيلي', 'طبّق مراجعة مخاطر شهرية'] },
      { period: '٩٠ يوماً', items: ['قيّم ما إذا كانت التدخلات قلّلت التعرض', 'اتخذ القرارات الاستراتيجية المؤجلة', 'عزّز تدفق المعلومات من الفريق إلى المؤسس'] },
    ],
  },
  low: {
    en: [
      { period: '30 Days', items: ['Document your current risk profile in writing', 'Identify the one area that could shift from stable to exposed', 'Share this assessment with one trusted partner'] },
      { period: '60 Days', items: ['Build monitoring systems for the early warning signals', 'Establish a quarterly risk review rhythm', 'Invest in the relationship infrastructure that prevents isolation'] },
      { period: '90 Days', items: ['Assess whether your stable indicators are structural or situational', 'Prepare contingency frameworks before they are needed', 'Develop the leadership depth that reduces founder dependency'] },
    ],
    ar: [
      { period: '٣٠ يوماً', items: ['وثّق ملف مخاطرك الحالي كتابياً', 'حدد المجال الواحد الذي يمكن أن ينتقل من مستقر إلى مكشوف', 'شارك هذا التقييم مع شريك موثوق'] },
      { period: '٦٠ يوماً', items: ['ابنِ أنظمة رصد لإشارات الإنذار المبكر', 'أسّس إيقاعاً ربع سنوي لمراجعة المخاطر', 'استثمر في البنية العلائقية التي تمنع العزلة'] },
      { period: '٩٠ يوماً', items: ['قيّم ما إذا كانت مؤشراتك المستقرة هيكلية أم ظرفية', 'أعدّ أطر طوارئ قبل الحاجة إليها', 'طوّر عمق القيادة الذي يقلل الاعتماد على المؤسس'] },
    ],
  },
};

const ADVISORY_LEVELS = {
  high: {
    en: { level: 'Advisory Recommended', body: 'Your risk profile indicates multiple active failure signals. An external advisory session would provide the structured diagnosis needed before decisions compound further.' },
    ar: { level: 'الاستشارة موصى بها', body: 'يشير ملف مخاطرك إلى إشارات فشل متعددة نشطة. ستوفر جلسة استشارية خارجية التشخيص المنظم اللازم قبل أن تتراكم القرارات أكثر.' },
  },
  medium: {
    en: { level: 'Attention Required', body: 'Your risk profile shows emerging patterns that, if unaddressed, will escalate. A diagnostic session would help clarify whether these patterns are situational or structural.' },
    ar: { level: 'مطلوب الانتباه', body: 'يُظهر ملف مخاطرك أنماطاً ناشئة ستتصاعد إن لم تُعالَج. ستساعد جلسة تشخيصية في توضيح ما إذا كانت هذه الأنماط ظرفية أم هيكلية.' },
  },
  low: {
    en: { level: 'Monitor', body: 'Your current indicators are relatively stable. Continued self-monitoring and a preventive session within the next quarter would maintain this position.' },
    ar: { level: 'رصد', body: 'مؤشراتك الحالية مستقرة نسبياً. الرصد الذاتي المستمر وجلسة وقائية خلال الربع القادم سيحافظان على هذا المسار.' },
  },
};

interface DiagnosticReportProps {
  verdict: { level: string; title: string; tone: string; insight: string };
  scorePct: number;
  blindSpots: string[];
  dominantBlindSpot?: string | null;
  riskBucket: 'low' | 'medium' | 'high';
  consequence: string;
  recovery: string;
  founderName?: string | null;
  isRTL: boolean;
  accentHsl: string;
}

export function DiagnosticReport({
  verdict,
  scorePct,
  blindSpots,
  dominantBlindSpot,
  riskBucket,
  consequence,
  recovery,
  founderName,
  isRTL,
}: DiagnosticReportProps) {
  const [expanded, setExpanded] = useState(false);
  const timeline = PRIORITY_TIMELINES[riskBucket][isRTL ? 'ar' : 'en'];
  const advisory = ADVISORY_LEVELS[riskBucket][isRTL ? 'ar' : 'en'];

  const accent =
    riskBucket === 'high' ? 'text-red-400'
    : riskBucket === 'medium' ? 'text-ember'
    : 'text-emerald-400';

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-56px' }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
      className={cn('border-t border-white/[0.07] pt-16 pb-20', isRTL && 'text-right')}
    >
      {/* Report toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className={cn(
          'mb-8 inline-flex items-center gap-3 group',
          isRTL && 'flex-row-reverse'
        )}
      >
        <p className={cn('text-[10px] uppercase text-white/28 group-hover:text-white/50 transition-colors', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.42em]')}>
          {isRTL ? 'التقرير التشخيصي' : 'Diagnostic Report'}
        </p>
        <span className={cn('text-white/25 text-xs transition-transform duration-300 inline-block', expanded && 'rotate-180')}>▾</span>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="border border-white/[0.08] bg-white/[0.01] overflow-hidden"
        >
          {/* Report header */}
          <div className={cn('px-8 py-6 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between', isRTL && 'flex-row-reverse')}>
            <div className={isRTL ? 'text-right' : undefined}>
              <p className={cn('text-[9px] uppercase text-white/25 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.35em]')}>
                {isRTL ? 'تقرير خبير الفشل™' : 'Khabeer Al Fashal™ Report'}
              </p>
              <p className={cn('text-sm text-white/55', isRTL && 'font-arabic')}>
                {founderName ?? (isRTL ? 'مجهول' : 'Confidential')} · {new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className={cn('text-right', isRTL && 'text-left')}>
              <p className={cn('text-[9px] uppercase text-white/25 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.35em]')}>
                {isRTL ? 'مستوى المخاطرة' : 'Risk level'}
              </p>
              <p className={cn('text-sm font-semibold', accent, isRTL && 'font-arabic')}>{verdict.level}</p>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-12">
            {/* 1. Executive Summary */}
            <ReportSection n="01" title={isRTL ? 'الملخص التنفيذي' : 'Executive Summary'} isRTL={isRTL}>
              <p className={cn('text-base text-white/65 font-light leading-relaxed', isRTL ? 'font-arabic leading-[2]' : undefined)}>
                {verdict.insight}
              </p>
            </ReportSection>

            {/* 2. Risk Score */}
            <ReportSection n="02" title={isRTL ? 'نقاط الخطر' : 'Startup Risk Score'} isRTL={isRTL}>
              <div className={cn('flex items-baseline gap-3', isRTL && 'flex-row-reverse')}>
                <span className={cn('text-5xl leading-none tabular-nums', accent, isRTL ? 'font-arabic font-bold' : 'font-serif-display italic')}>{scorePct}</span>
                <span className="text-white/25 text-xl">/100</span>
              </div>
            </ReportSection>

            {/* 3. Dominant Failure Mode */}
            <ReportSection n="03" title={isRTL ? 'نمط الفشل السائد' : 'Dominant Failure Mode'} isRTL={isRTL}>
              <p className={cn('text-base font-semibold', accent, isRTL && 'font-arabic')}>
                {dominantBlindSpot ?? (isRTL ? 'أنماط متعددة' : 'Multiple Patterns')}
              </p>
            </ReportSection>

            {/* 4. Top Risk Drivers */}
            <ReportSection n="04" title={isRTL ? 'أبرز محركات الخطر' : 'Top Risk Drivers'} isRTL={isRTL}>
              {blindSpots.length > 0 ? (
                <ul className="space-y-2">
                  {blindSpots.map((b, i) => (
                    <li key={b} className={cn('flex items-baseline gap-3 text-sm text-white/60', isRTL && 'flex-row-reverse')}>
                      <span className={cn('text-white/20 tabular-nums text-xs flex-shrink-0', isRTL ? 'font-arabic' : 'font-serif-display')}>{String(i + 1).padStart(2, '0')}</span>
                      <span className={cn('font-light', isRTL && 'font-arabic leading-[2]')}>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn('text-sm text-white/40 font-light', isRTL && 'font-arabic')}>{isRTL ? 'لا توجد نقاط عمى بارزة' : 'No prominent blind spots detected'}</p>
              )}
            </ReportSection>

            {/* 5. Blind Spots — consequence */}
            <ReportSection n="05" title={isRTL ? 'نقاط العمى' : 'Blind Spots'} isRTL={isRTL}>
              <p className={cn('text-base text-white/60 font-light leading-relaxed', isRTL ? 'font-arabic leading-[2]' : undefined)}>{consequence}</p>
            </ReportSection>

            {/* 6. Recommended Actions */}
            <ReportSection n="06" title={isRTL ? 'الإجراءات الموصى بها' : 'Recommended Actions'} isRTL={isRTL}>
              <p className={cn('text-base text-white/60 font-light leading-relaxed', isRTL ? 'font-arabic leading-[2]' : undefined)}>{recovery}</p>
            </ReportSection>

            {/* 7. Priority Timeline */}
            <ReportSection n="07" title={isRTL ? 'الجدول الزمني للأولويات' : 'Priority Timeline'} isRTL={isRTL}>
              <div className="grid md:grid-cols-3 gap-6">
                {timeline.map(t => (
                  <div key={t.period} className={cn('border border-white/[0.06] p-5', isRTL && 'text-right')}>
                    <p className={cn('text-xs text-ember mb-4', isRTL ? 'font-arabic tracking-normal text-sm' : 'uppercase tracking-[0.25em] font-medium')}>{t.period}</p>
                    <ul className="space-y-2">
                      {t.items.map((item, i) => (
                        <li key={i} className={cn('flex items-start gap-2 text-xs text-white/50 font-light', isRTL && 'flex-row-reverse')}>
                          <span className="text-ember/30 mt-0.5 flex-shrink-0">·</span>
                          <span className={cn(isRTL ? 'font-arabic leading-[2]' : 'leading-relaxed')}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* 8. Advisory Recommendation */}
            <ReportSection n="08" title={isRTL ? 'توصية الاستشارة' : 'Advisory Recommendation'} isRTL={isRTL}>
              <div className={cn('flex items-start gap-4', isRTL && 'flex-row-reverse')}>
                <span className={cn(
                  'text-xs font-semibold px-2 py-1 border flex-shrink-0',
                  accent,
                  riskBucket === 'high' ? 'border-red-400/30 bg-red-400/5'
                  : riskBucket === 'medium' ? 'border-ember/30 bg-ember/5'
                  : 'border-emerald-400/30 bg-emerald-400/5',
                  isRTL ? 'font-arabic tracking-normal text-sm' : 'uppercase tracking-[0.15em]'
                )}>
                  {advisory.level}
                </span>
              </div>
              <p className={cn('mt-4 text-sm text-white/55 font-light leading-relaxed', isRTL ? 'font-arabic leading-[2]' : undefined)}>
                {advisory.body}
              </p>
            </ReportSection>
          </div>

          {/* Report footer */}
          <div className={cn('px-8 py-5 border-t border-white/[0.06] bg-white/[0.02]', isRTL && 'text-right')}>
            <p className={cn('text-[9px] text-white/18', isRTL ? 'font-arabic text-xs' : 'uppercase tracking-[0.3em]')}>
              {isRTL
                ? 'هذا التقرير سري ومُنشأ بناءً على إجاباتك التشخيصية. خبير الفشل™'
                : 'This report is confidential and generated from your diagnostic responses. Khabeer Al Fashal™'}
            </p>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}

function ReportSection({ n, title, isRTL, children }: { n: string; title: string; isRTL: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('grid gap-4', isRTL ? 'md:grid-cols-[1fr_80px]' : 'md:grid-cols-[80px_1fr]')}>
      <div className={cn('md:pt-1', isRTL && 'order-last md:order-first')}>
        <span className={cn('text-[10px] text-white/20', isRTL ? 'font-arabic tracking-normal text-xs' : 'font-serif-display italic')}>{n}</span>
      </div>
      <div className={isRTL ? 'text-right' : undefined}>
        <p className={cn('text-[9px] uppercase text-white/25 mb-3', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>{title}</p>
        {children}
      </div>
    </div>
  );
}
