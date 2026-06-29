import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import portrait from '@/assets/khabir-portrait.png';
import portraitWebp from '@/assets/khabir-portrait.webp';
import { EmergencyBriefings } from '@/components/newsletter/EmergencyBriefings';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * About — cinematic, documentary-style founder story
 * Brand: خبير الفشل | Khabir Al Fashal. Fully bilingual.
 */
export default function About() {
  const t = useT();
  const a = t.about;
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className={cn('dark bg-black text-white', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={a.metaTitle} description={a.metaDesc} />

      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-32 pb-12 px-6 lg:px-12"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(18_92%_55%/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_70%,black_100%)]" />

        <div className="relative z-10 max-w-5xl mx-auto w-full">
          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(isRTL && 'text-right')}
          >
            <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
              <span className="h-px w-12 bg-ember" />
              <span className={cn(
                'text-xs uppercase text-ember font-medium',
                isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
              )}>
                {a.eyebrow}
              </span>
            </div>

            <h1 className={cn(
              'leading-[0.95] tracking-tight mb-14',
              isRTL
                ? 'font-arabic font-bold text-4xl md:text-6xl lg:text-7xl leading-[1.3]'
                : 'font-serif-display text-5xl md:text-7xl lg:text-8xl'
            )}>
              {a.heroLine1}
              <br />
              <span className={cn('text-white/70', !isRTL && 'italic')}>{a.heroLine2}</span>
              <br />
              {a.heroLine3}
              <br />
              {a.heroLine4}
            </h1>

            {/* Dossier metadata strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-white/10">
              {[a.dossierSubject, a.dossierStatus, a.dossierDiagnosis].map((entry, i) => {
                const sepIdx = entry.indexOf(':');
                const label = sepIdx > -1 ? entry.slice(0, sepIdx).trim() : entry;
                const value = sepIdx > -1 ? entry.slice(sepIdx + 1).trim() : '';
                return (
                  <div
                    key={i}
                    className={cn(
                      'py-6 sm:py-7 sm:px-6 first:sm:px-0 border-t sm:border-t-0 first:border-t-0',
                      i > 0 && 'sm:border-l border-white/10',
                      isRTL && 'text-right'
                    )}
                  >
                    <div className={cn(
                      'text-[10px] uppercase text-white/35 mb-2',
                      isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
                    )}>
                      {label}
                    </div>
                    <div className={cn(
                      'text-sm md:text-base uppercase',
                      isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.1em]',
                      i === 1 ? 'text-ember' : 'text-white/80'
                    )}>
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-center text-[10px] tracking-[0.4em] uppercase text-white/30">
          {a.scrollLabel}
        </div>
      </section>

      {/* ============ NARRATIVE / SUBJECT PHOTO ============ */}
      <section className="relative py-32 md:py-40 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className={cn('md:col-span-5', isRTL ? 'md:order-1' : 'md:order-2')}
          >
            <div className="relative border border-white/15 [box-shadow:0_40px_80px_-20px_rgba(0,0,0,0.6)]">
              <span className={cn(
                'absolute top-0 z-10 px-3 py-1.5 bg-black border-b border-white/15 text-[10px] tracking-[0.3em] uppercase text-ember',
                isRTL ? 'right-0 border-l' : 'left-0 border-r'
              )}>
                Exhibit_01
              </span>
              <picture>
                <source srcSet={portraitWebp} type="image/webp" />
                <img
                  src={portrait}
                  alt="Mohamed Khalil"
                  className="w-full aspect-[4/5] object-cover grayscale contrast-110"
                  loading="lazy"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className={cn(
              'md:col-span-7',
              isRTL ? 'md:order-2 text-right' : 'md:order-1'
            )}
          >
            <p className={cn(
              'text-lg md:text-xl text-white/50 max-w-xl leading-relaxed font-light',
              isRTL && 'leading-[2.2]'
            )}>
              {a.heroBio}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ CHAPTERS ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(18_92%_55%/0.04),transparent_70%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto space-y-32 md:space-y-48">
          {a.chapters.map((c) => (
            <motion.article
              key={c.eyebrow}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'grid gap-6 md:gap-12 md:grid-cols-[64px_1fr]',
                isRTL && 'text-right'
              )}
            >
              <div className="md:pt-4">
                <div className={cn(
                  'text-4xl italic text-ember',
                  isRTL ? 'font-arabic text-right' : 'font-serif-display'
                )}>
                  {c.eyebrow}
                </div>
                <div className={cn('mt-2 h-px w-12 bg-white/20', isRTL && 'mr-auto')} />
              </div>
              <div className="min-w-0">
                <h2 className={cn(
                  'tracking-tight mb-8 leading-[1.05]',
                  isRTL
                    ? 'font-arabic font-bold text-3xl md:text-5xl leading-[1.4]'
                    : 'font-serif-display text-4xl md:text-6xl'
                )}>
                  {c.title}
                </h2>
                <p className={cn(
                  'text-lg md:text-xl text-white/60 font-light w-full min-w-0 break-words',
                  isRTL ? 'leading-[2.2]' : 'leading-[1.8]'
                )}>
                  {c.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ============ PULL QUOTE ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(18_92%_55%/0.08),transparent_70%)]" />
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="relative max-w-5xl mx-auto text-center"
        >
          <div className={cn(
            'text-7xl text-ember/40 leading-none mb-8',
            isRTL ? 'font-arabic' : 'font-serif-display'
          )}>
            {a.quoteOpen}
          </div>
          <p className={cn(
            'text-3xl md:text-5xl lg:text-6xl leading-[1.15] tracking-tight text-white/90',
            isRTL ? 'font-arabic font-bold leading-[1.8]' : 'font-serif-display'
          )}>
            {a.quoteBody1}
            <br />
            <span className={cn('text-white/50', !isRTL && 'italic')}>
              {a.quoteBody2}
            </span>
          </p>
          <p className={cn(
            'mt-12 text-xs uppercase text-white/30',
            isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
          )}>
            {a.quoteAttr}
          </p>
        </motion.blockquote>
      </section>

      {/* ============ CLINICAL OBSERVATIONS ============ */}
      <section className="py-32 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className={cn(
            'text-xs uppercase text-ember mb-16',
            isRTL ? 'font-arabic tracking-normal text-sm text-right' : 'tracking-[0.35em]'
          )}>
            {a.pillarsLabel}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {a.pillars.map((p, i) => (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08 }}
                className={cn(
                  'relative bg-black p-10 md:p-12 transition-colors duration-300 hover:bg-ember/[0.04]',
                  isRTL && 'text-right'
                )}
              >
                <div className={cn(
                  'text-[10px] text-ember mb-6 tabular-nums',
                  isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.35em] uppercase font-medium'
                )}>
                  {`OBS_0${i + 1}`}
                </div>
                <h3 className={cn(
                  'text-2xl mb-3',
                  isRTL ? 'font-arabic font-bold' : 'font-serif-display'
                )}>
                  {p.k}
                </h3>
                <p className={cn(
                  'text-sm text-white/50 leading-relaxed font-light',
                  isRTL && 'leading-[2]'
                )}>
                  {p.v}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CASE SNIPPETS ============ */}
      <section className="py-20 px-6 lg:px-12 border-t border-white/5">
        <div className={cn('max-w-4xl mx-auto', isRTL && 'text-right')}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className={cn(
              'text-[10px] uppercase text-white/30 mb-8',
              isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.4em]'
            )}>
              {(a as any).caseSnippetsLabel}
            </p>
            <div className={cn('flex flex-col gap-3', isRTL && 'items-end')}>
              {(a as any).caseSnippets.map((s: { id: string; sector: string; stage: string; pattern: string }) => (
                <div
                  key={s.id}
                  className={cn(
                    'inline-flex flex-wrap items-center gap-3 text-[11px] text-white/35 border border-white/[0.06] px-4 py-2.5',
                    isRTL ? 'font-arabic flex-row-reverse text-sm' : 'tracking-[0.15em] uppercase'
                  )}
                >
                  <span className="text-ember/60">{s.id}</span>
                  <span className="text-white/20">·</span>
                  <span>{s.sector}</span>
                  <span className="text-white/20">·</span>
                  <span>{s.stage}</span>
                  <span className="text-white/20">·</span>
                  <span className={isRTL ? 'tracking-normal normal-case' : undefined}>{s.pattern}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ EMERGENCY BRIEFINGS NEWSLETTER ============ */}
      <EmergencyBriefings isRTL={isRTL} />

      {/* ============ CLOSING + CTA ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          <p className={cn(
            'text-3xl md:text-5xl leading-tight text-white/90',
            isRTL ? 'font-arabic font-bold leading-[1.8]' : 'font-serif-display'
          )}>
            {a.closingBody}
          </p>
          <p className={cn(
            'text-base md:text-lg text-white/50 font-light max-w-xl mx-auto leading-relaxed',
            isRTL && 'leading-[2.2]'
          )}>
            {a.closingSub}
          </p>

          <Link
            to={getPath('/contact')}
            className="group inline-flex items-center gap-4 px-8 py-5 border border-white/20 hover:border-ember hover:bg-ember/5 transition-all duration-500"
          >
            <span className={cn(
              'text-sm uppercase font-medium',
              isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]'
            )}>
              {a.ctaButton}
            </span>
            <ArrowRight className={cn('size-4 transition-transform group-hover:translate-x-1', isRTL && 'rotate-180')} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
