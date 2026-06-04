import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { FounderTestimonials } from '@/components/testimonials/FounderTestimonials';
import { EmergencyBriefings } from '@/components/newsletter/EmergencyBriefings';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * Home — خبير الفشل | Khabir Al Fashal
 * Cinematic dark landing. Fully bilingual via useT() and useLanguage().
 */

function useCountUp(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const elRef = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const start = performance.now();
          const run = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - (1 - p) ** 3;
            setCount(Math.round(eased * end));
            if (p < 1) requestAnimationFrame(run);
          };
          requestAnimationFrame(run);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, elRef };
}

function StatCell({ k, isRTL: rtl }: { k: string; isRTL: boolean }) {
  const numeric = /^\d+$/.test(k);
  const target = numeric ? parseInt(k, 10) : 0;
  const padLen = k.length;
  const { count, elRef } = useCountUp(target);
  const display = numeric
    ? String(count).padStart(padLen, '0')
    : k;
  return (
    <span ref={numeric ? elRef : undefined} className={cn(
      'text-5xl md:text-6xl text-ember mb-3 block',
      rtl ? 'font-arabic font-bold' : 'font-serif-display'
    )}>
      {display}
    </span>
  );
}

export default function Home() {
  const t = useT();
  const h = t.home;
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [activeStatIdx, setActiveStatIdx] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className={cn('dark bg-black text-white', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={h.metaTitle} description={h.metaDesc} />

      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-32 pb-12 px-6 lg:px-12"
      >
        {/* Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,hsl(18_92%_55%/0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,black_0%,transparent_25%,transparent_70%,black_100%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
             style={{ backgroundImage: 'repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 80px)' }} />

        {/* Top meta strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/30"
        >
          {h.stripLeft && <span>{h.stripLeft}</span>}
          {h.stripCenter && <span className="hidden md:inline">{h.stripCenter}</span>}
          {h.stripRight && <span>{h.stripRight}</span>}
        </motion.div>

        {/* Main title block */}
        <motion.div
          style={{ y: titleY, opacity: titleOpacity }}
          className="relative z-10 max-w-7xl mx-auto w-full"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl"
          >
            <div className={cn('flex items-center gap-3 mb-10', isRTL && 'flex-row-reverse')}>
              <span className="h-px w-12 bg-ember" />
              <span className={cn(
                'text-xs uppercase text-ember font-medium',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.35em]'
              )}>
                {h.tagline}
              </span>
            </div>

            <h1 className={cn(
              'leading-[0.92] tracking-tight',
              isRTL
                ? 'font-arabic font-bold text-[12vw] md:text-[8vw] lg:text-[7vw] leading-[1.2]'
                : 'font-serif-display text-[15vw] md:text-[10vw] lg:text-[8.5vw]'
            )}>
              {isRTL ? (
                <>
                  {h.heroLine1}
                  <br />
                  {h.heroLine2}{' '}
                  <span className="italic text-white/40">{h.heroLine3}</span>
                  <br />
                  {h.heroLine4}{' '}
                  <span className={cn('text-ember', !isRTL && 'italic')}>{h.heroLine5}</span>
                </>
              ) : (
                <>
                  {h.heroLine1}
                  <br />
                  {h.heroLine2}{' '}
                  <span className="italic text-white/40">{h.heroLine3}</span>
                  <br />
                  {h.heroLine4}{' '}
                  <span className="text-ember italic">{h.heroLine5}</span>
                  <br />
                  {t.home.heroPitch.split('—')[0] && (
                    <span className="italic">you fail.</span>
                  )}
                </>
              )}
            </h1>

            <div className="mt-12 grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 items-end max-w-4xl">
              <p className={cn(
                'text-base md:text-lg text-white/55 leading-relaxed font-light max-w-xl',
                isRTL && 'text-right leading-[2]'
              )}>
                {isRTL ? (
                  h.heroPitch
                ) : (
                  <>
                    <span className="font-arabic text-white/80 text-xl">خبير الفشل</span>{' '}
                    — a forensic practice studying the psychology, decisions, and blind spots
                    that kill companies long before the funding runs out.
                  </>
                )}
              </p>

              <div className={cn('flex flex-col sm:flex-row gap-3', isRTL && 'sm:flex-row-reverse')}>
                <Link
                  to={getPath('/contact')}
                  className="group inline-flex items-center justify-between gap-8 px-7 py-4 bg-ember text-black hover:bg-white transition-colors duration-500"
                >
                  <span className={cn(
                    'text-xs uppercase font-semibold',
                    isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.25em]'
                  )}>
                    {h.ctaPrimary}
                  </span>
                  <ArrowUpRight className={cn('size-4 transition-transform group-hover:rotate-45', isRTL && 'rotate-180')} />
                </Link>
                <Link
                  to={getPath('/about')}
                  className="group inline-flex items-center justify-between gap-8 px-7 py-4 border border-white/15 hover:border-white/50 transition-colors duration-500"
                >
                  <span className={cn(
                    'text-xs uppercase font-medium text-white/80',
                    isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.25em]'
                  )}>
                    {h.ctaSecondary}
                  </span>
                  <ArrowRight className={cn('size-4 transition-transform group-hover:translate-x-1', isRTL && 'rotate-180')} />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom scroll marker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/30"
        >
          <span>{h.scrollLabel}</span>
          <span className="hidden md:inline">{h.scrollSubject}</span>
        </motion.div>
      </section>

      {/* ============ MANIFESTO STRIP ============ */}
      <section className="relative border-y border-white/5 overflow-hidden">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className={cn(
            'flex whitespace-nowrap py-8 text-3xl md:text-5xl italic text-white/15',
            isRTL ? 'font-arabic font-bold' : 'font-serif-display'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="px-12 flex items-center gap-12">
              {h.manifestoLoop}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ============ THESIS ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1 }}
            className="md:col-span-4"
          >
            <p className={cn(
              'text-xs uppercase text-ember mb-6',
              isRTL ? 'font-arabic tracking-normal text-sm text-right' : 'tracking-[0.35em]'
            )}>
              {h.thesisLabel}
            </p>
            <p className={cn(
              'text-3xl md:text-4xl italic text-white/40 leading-snug',
              isRTL ? 'font-arabic font-bold text-right leading-[1.8]' : 'font-serif-display'
            )}>
              {h.thesisQuote1}
              <br />
              {h.thesisQuote2}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, delay: 0.15 }}
            className={cn(
              'md:col-span-8 space-y-8 text-lg md:text-xl text-white/65 font-light leading-[1.8]',
              isRTL && 'text-right leading-[2.2]'
            )}
          >
            <p>{h.thesisPara1}</p>
            <p>
              {isRTL ? (
                h.thesisPara2
              ) : (
                <>
                  <span className="text-white">خبير الفشل</span>{' '}
                  {h.thesisPara2.replace('خبير الفشل ', '')}
                </>
              )}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ PATTERN INTELLIGENCE ============ */}
      <section className="relative py-32 md:py-40 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="flex items-end justify-between mb-20 flex-wrap gap-8"
          >
            <div>
              <p className={cn(
                'text-xs uppercase text-ember mb-6',
                isRTL ? 'font-arabic tracking-normal text-sm text-right' : 'tracking-[0.35em]'
              )}>
                {h.patternLabel}
              </p>
              <h2 className={cn(
                'text-5xl md:text-7xl leading-[0.95] tracking-tight max-w-3xl',
                isRTL ? 'font-arabic font-bold leading-[1.3] text-right' : 'font-serif-display'
              )}>
                {h.patternHeading1}{' '}
                <span className={cn('text-white/50', !isRTL && 'italic')}>{h.patternHeading2}</span>
              </h2>
            </div>
            <p className={cn(
              'text-sm text-white/40 max-w-xs leading-relaxed',
              isRTL && 'font-arabic text-right leading-[2]'
            )}>
              {h.patternSub}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-px bg-white/5 border border-white/5">
            {h.patterns.map((p, i) => (
              <Link key={p.n} to={getPath('/valley-of-death')} className="block">
                <motion.article
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.8, delay: i * 0.08 }}
                  className="group relative bg-black p-10 md:p-14 hover:bg-ember/[0.04] hover:scale-[1.02] transition-all duration-500 cursor-pointer"
                >
                  <div className={cn('flex items-start justify-between mb-10', isRTL && 'flex-row-reverse')}>
                    <span className="text-xs tracking-[0.3em] text-ember">
                      Pattern · {p.n}
                    </span>
                    <ArrowUpRight className="size-4 text-white/20 group-hover:text-ember group-hover:rotate-45 transition-all duration-500" />
                  </div>
                  <h3 className={cn(
                    'text-3xl md:text-4xl mb-6 leading-tight',
                    isRTL ? 'font-arabic font-bold text-right leading-[1.5]' : 'font-serif-display'
                  )}>
                    {p.title}
                  </h3>
                  <p className={cn(
                    'text-base text-white/50 font-light leading-relaxed max-w-md',
                    isRTL && 'font-arabic text-right leading-[2]'
                  )}>
                    {p.body}
                  </p>
                </motion.article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PULL QUOTE ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(18_92%_55%/0.10),transparent_70%)]" />
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6 }}
          className="relative max-w-5xl mx-auto text-center"
        >
          <p className={cn(
            'text-4xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight',
            isRTL ? 'font-arabic font-bold leading-[1.6]' : 'font-serif-display'
          )}>
            {h.pullQuote1}
            <br />
            {h.pullQuote2}
            <br />
            <span className={cn('text-ember', !isRTL && 'italic')}>{h.pullQuote3}</span>
          </p>
          {h.fieldNote && (
            <p className={cn(
              'mt-12 text-[10px] uppercase text-white/30',
              isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]'
            )}>
              {h.fieldNote}
            </p>
          )}
        </motion.blockquote>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-t border-white/5 py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5">
          {h.stats.map((s, i) => (
            <motion.button
              key={s.k}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              onClick={() => setActiveStatIdx(activeStatIdx === i ? null : i)}
              className={cn(
                'bg-black p-8 md:p-10 text-left w-full transition-colors duration-300 cursor-pointer',
                isRTL && 'text-right',
                activeStatIdx === i && 'bg-ember/[0.05]'
              )}
            >
              <StatCell k={s.k} isRTL={isRTL} />
              <div className={cn('text-[10px] uppercase text-white/40', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]')}>
                {s.v}
              </div>
              <AnimatePresence>
                {activeStatIdx === i && (s as any).i && (
                  <motion.p
                    key="insight"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      'mt-4 text-xs text-white/55 leading-relaxed overflow-hidden',
                      isRTL ? 'font-arabic leading-[2]' : 'font-light'
                    )}
                  >
                    {(s as any).i}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ============ FOUNDER TESTIMONIALS ============ */}
      <FounderTestimonials
        eyebrow={t.testimonials.defaultEyebrow}
        heading={t.testimonials.defaultHeading}
      />

      {/* ============ CLOSING CTA ============ */}
      <section className="relative py-40 md:py-56 px-6 lg:px-12 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(18_92%_55%/0.12),transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <p className={cn(
            'text-xs uppercase text-ember mb-10',
            isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.35em]'
          )}>
            {h.ctaLabel}
          </p>
          <h2 className={cn(
            'text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-12',
            isRTL ? 'font-arabic font-bold leading-[1.4]' : 'font-serif-display'
          )}>
            {h.ctaHeading1}
            <br />
            <span className={cn('text-white/60', !isRTL && 'italic')}>{h.ctaHeading2}</span>
            <br />
            {h.ctaHeading3}
          </h2>
          <p className={cn(
            'text-base md:text-lg text-white/50 font-light max-w-xl mx-auto leading-relaxed mb-14',
            isRTL && 'font-arabic leading-[2.2]'
          )}>
            {h.ctaBody}
          </p>

          <div className="relative inline-block">
            <motion.span
              className="absolute inset-0 pointer-events-none"
              animate={{
                boxShadow: [
                  '0 0 0 0px hsl(18 92% 55% / 0.35)',
                  '0 0 0 20px hsl(18 92% 55% / 0.00)',
                ],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
            />
            <Link
              to={getPath('/contact')}
              className="group inline-flex items-center gap-8 px-10 py-6 bg-ember text-black hover:bg-white transition-colors duration-500"
            >
              <span className={cn(
                'text-sm uppercase font-semibold',
                isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]'
              )}>
                {h.ctaButton}
              </span>
              <ArrowUpRight className={cn('size-5 transition-transform group-hover:rotate-45', isRTL && 'rotate-180')} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ============ EMERGENCY BRIEFINGS NEWSLETTER ============ */}
      <EmergencyBriefings isRTL={isRTL} />
    </div>
  );
}
