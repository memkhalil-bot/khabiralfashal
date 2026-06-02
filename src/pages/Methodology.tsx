import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * Methodology — the framework behind خبير الفشل
 * Bilingual, cinematic dark aesthetic matching About.tsx.
 */
export default function Methodology() {
  const t = useT();
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const metaTitle = isRTL ? 'المنهجية — خبير الفشل' : 'Methodology — خبير الفشل';
  const metaDesc = isRTL
    ? 'إطار منهجي صارم قائم على الأدلة لتحديد الأنماط التي تسبق فشل الشركات الناشئة.'
    : 'A rigorous, evidence-based framework for identifying the patterns that precede startup failure.';

  const sections = [
    {
      en: {
        title: '1,400+ Documented Failures',
        body: 'The framework draws from a structured corpus of post-mortem analyses, founder interviews, investor notes, and acquisition failure reports spanning 2012–2024. Sources include CB Insights, Crunchbase Failure Reports, Y Combinator retrospectives, and direct founder testimony collected over seven years.',
      },
      ar: {
        title: 'أكثر من ١٤٠٠ حالة فشل موثقة',
        body: 'يستند الإطار إلى مجموعة منظمة من تحليلات ما بعد الإغلاق، ومقابلات المؤسسين، وملاحظات المستثمرين، وتقارير فشل الاستحواذ من 2012 إلى 2024. تشمل المصادر CB Insights وتقارير Crunchbase وندوات Y Combinator وشهادات مؤسسين مباشرة جُمعت خلال سبع سنوات.',
      },
    },
    {
      en: {
        title: 'Behavioral Signal Detection',
        body: 'Most failure predictors are not financial — they are behavioral. The framework identifies cognitive and organizational signals that consistently appear 6–18 months before collapse: decision avoidance, information isolation, identity fusion, and cash denial. These are weighted and scored against validated failure trajectories.',
      },
      ar: {
        title: 'اكتشاف الإشارات السلوكية',
        body: 'معظم مؤشرات الفشل ليست مالية — بل سلوكية. يرصد الإطار الإشارات المعرفية والتنظيمية التي تظهر باستمرار بين 6 و18 شهراً قبل الانهيار: تجنّب القرارات، وعزل المعلومات، والاندماج مع الهوية، وإنكار السيولة. يتم ترجيح هذه الإشارات وتسجيلها مقارنةً بمسارات الفشل المُتحققة.',
      },
    },
    {
      en: {
        title: '12 Calibrated Questions',
        body: 'The diagnostic instrument is built from 12 questions derived through iterative refinement across 400+ founder sessions. Each question targets a specific failure signal, weighted by its observed correlation with actual collapse events. Questions undergo annual recalibration based on new case data.',
      },
      ar: {
        title: '١٢ سؤالاً معايَراً',
        body: 'تتكوّن أداة التشخيص من 12 سؤالاً مُستَخلصاً من صياغة تكرارية عبر أكثر من 400 جلسة مع مؤسسين. يستهدف كل سؤال إشارة فشل محددة، مرجّحةً بارتباطها الملحوظ بأحداث الانهيار الفعلية. تخضع الأسئلة لإعادة معايرة سنوية استناداً إلى بيانات الحالات الجديدة.',
      },
    },
    {
      en: {
        title: 'Five Primary Failure Modes',
        body: 'Research identifies five dominant failure modes that account for 78% of documented startup collapses: financial denial, leadership isolation, strategic paralysis, identity fusion, and concentration risk. Each mode has a distinct behavioral signature, predictable escalation pattern, and documented intervention window. The framework maps founder responses to these signatures in real time.',
      },
      ar: {
        title: 'خمسة أنماط فشل رئيسية',
        body: 'تحدد الأبحاث خمسة أنماط فشل رئيسية تُفسّر 78% من حالات الانهيار الموثقة: إنكار الوضع المالي، وعزلة القيادة، وشلل الاستراتيجية، والاندماج مع الهوية، ومخاطر التركّز. لكل نمط بصمة سلوكية متميزة، ومسار تصعيد متوقع، ونافذة تدخل موثقة. يُرسم الإطار استجابات المؤسس لهذه البصمات في الوقت الفعلي.',
      },
    },
  ];

  return (
    <div className={cn('dark bg-black text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={metaTitle} description={metaDesc} />

      {/* ============ HERO ============ */}
      <section className="relative pt-36 md:pt-48 pb-24 px-6 lg:px-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.10),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black)]" />
        <div className={cn('relative max-w-5xl mx-auto', isRTL && 'text-right')}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className={cn(
              'text-ember mb-6',
              isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.42em]'
            )}>
              {isRTL ? 'الإطار المنهجي' : 'The Framework'}
            </p>
            <h1 className={cn(
              'tracking-tight mb-8',
              isRTL
                ? 'font-arabic font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.3]'
                : 'font-serif-display text-4xl md:text-6xl lg:text-7xl leading-[1.0]'
            )}>
              {isRTL ? 'منهجية / خبير الفشل™' : 'Khabeer Al Fashal™ / Methodology'}
            </h1>
            <p className={cn(
              'text-white/55 max-w-2xl',
              isRTL
                ? 'font-arabic text-base md:text-lg leading-[2.1]'
                : 'text-base md:text-xl leading-relaxed font-light'
            )}>
              {isRTL
                ? 'إطار منهجي صارم قائم على الأدلة لتحديد الأنماط التي تسبق فشل الشركات الناشئة.'
                : 'A rigorous, evidence-based framework for identifying the patterns that precede startup failure.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ METHODOLOGY SECTIONS ============ */}
      <section className="relative py-24 md:py-32 px-6 lg:px-12 bg-black">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-0 divide-y divide-white/[0.06]">
            {sections.map((sec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
                className={cn('py-16 md:py-20', isRTL && 'text-right')}
              >
                <div className={cn('flex items-start gap-8 md:gap-16', isRTL && 'flex-row-reverse')}>
                  <span className={cn(
                    'flex-shrink-0 text-ember tabular-nums',
                    isRTL ? 'font-arabic text-sm' : 'text-[10px] uppercase tracking-[0.4em] pt-1'
                  )}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h2 className={cn(
                      'mb-6 tracking-tight',
                      isRTL
                        ? 'font-arabic font-bold text-2xl md:text-4xl leading-[1.5]'
                        : 'font-serif-display text-2xl md:text-4xl leading-[1.15]'
                    )}>
                      {isRTL ? sec.ar.title : sec.en.title}
                    </h2>
                    <p className={cn(
                      'text-white/55 font-light leading-relaxed',
                      isRTL
                        ? 'font-arabic text-base md:text-lg leading-[2.1]'
                        : 'text-base md:text-lg'
                    )}>
                      {isRTL ? sec.ar.body : sec.en.body}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSING / CTA ============ */}
      <section className="relative py-28 md:py-40 px-6 lg:px-12 border-t border-white/5 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(18_92%_55%/0.08),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn('relative max-w-3xl mx-auto', isRTL && 'text-right')}
        >
          <p className={cn(
            'text-xl md:text-3xl text-white/75 mb-12 leading-relaxed',
            isRTL ? 'font-arabic leading-[1.9]' : 'font-serif-display italic leading-[1.4]'
          )}>
            {isRTL
              ? 'التشخيص هو نقطة البداية. الجلسة هي حيث تتحول الأنماط إلى استراتيجية.'
              : 'The diagnostic is a starting point. The session is where patterns become strategy.'}
          </p>
          <Link
            to={getPath('/contact')}
            className={cn(
              'group inline-flex items-center gap-5 px-8 py-5 bg-ember text-black hover:bg-white transition-all duration-500',
              isRTL && 'flex-row-reverse'
            )}
          >
            <span className={cn(
              'text-sm font-semibold',
              isRTL ? 'font-arabic tracking-normal text-base' : 'uppercase tracking-[0.28em]'
            )}>
              {isRTL ? 'احجز جلسة' : 'Book a Session'}
            </span>
            <ArrowRight className={cn('size-4 group-hover:translate-x-1 transition-transform', isRTL && 'rotate-180')} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
