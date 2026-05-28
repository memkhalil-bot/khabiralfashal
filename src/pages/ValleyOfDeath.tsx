import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { FounderAssessment } from '@/components/valley/FounderAssessment';
import { ValleyCurve } from '@/components/valley/ValleyCurve';
import { FounderTestimonials } from '@/components/testimonials/FounderTestimonials';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export default function ValleyOfDeath() {
  const t = useT();
  const v = t.valley;
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  return (
    <div className={cn('dark bg-black text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={v.metaTitle} description={v.metaDesc} />

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 lg:px-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.12),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black)]" />
        <div className={cn('relative max-w-5xl mx-auto', isRTL && 'text-right')}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
              <span className="h-px w-12 bg-ember" />
              <span className={cn(
                'text-xs uppercase text-ember font-medium',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
              )}>
                {v.eyebrow}
              </span>
            </div>
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

      {/* Cinematic lore — what the Valley of Death actually means */}
      <section className="relative border-b border-white/5 bg-black py-24 md:py-32 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(18_92%_55%/0.06),transparent_70%)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9 }}
          className={cn('relative max-w-3xl mx-auto', isRTL && 'text-right')}
        >
          <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
            <span className="h-px w-10 bg-ember" />
            <span className={cn(
              'text-[10px] uppercase text-ember font-medium',
              isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]'
            )}>
              {v.lore.eyebrow}
            </span>
          </div>
          <h2 className={cn(
            'text-3xl md:text-5xl leading-[1.1] tracking-tight max-w-3xl',
            isRTL ? 'font-arabic font-bold leading-[1.5]' : 'font-serif-display'
          )}>
            {v.lore.heading1}{' '}
            <span className={cn('text-white/55', !isRTL && 'italic')}>{v.lore.heading2}</span>
          </h2>
          <div className={cn(
            'mt-10 space-y-6 text-white/65 text-base md:text-lg max-w-2xl',
            isRTL ? 'font-arabic leading-[2.1]' : 'leading-relaxed font-light'
          )}>
            <p>{v.lore.p1}</p>
            <p>{v.lore.p2}</p>
            <p className="text-white/45">{v.lore.p3}</p>
          </div>
        </motion.div>
      </section>

      {/* Animated Valley of Death curve diagram */}
      <ValleyCurve />

      {/* Cinematic in-site founder diagnostic */}
      <FounderAssessment />

      {/* Founder-to-founder field notes */}
      <FounderTestimonials
        eyebrow={v.testimonialsEyebrow}
        heading={v.testimonialsHeading}
      />
    </div>
  );
}
