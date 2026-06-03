import { useState } from 'react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { useT } from '@/hooks/useT';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const inView = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
} as const;

export default function CaseFiles() {
  const t = useT();
  const cf = t.caseFiles;
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filtered = activeFilter === 'all'
    ? cf.cases
    : cf.cases.filter(c => c.tags.includes(activeFilter));

  return (
    <div className={cn('dark bg-black text-white min-h-screen', isRTL ? 'font-arabic' : 'font-sans-ui')}>
      <SEOHead title={cf.metaTitle} description={cf.metaDesc} />

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 lg:px-12 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(18_92%_55%/0.08),transparent_60%)]" />
        <div className={cn('relative max-w-5xl mx-auto', isRTL && 'text-right')}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <div className={cn('flex items-center gap-3 mb-8', isRTL && 'flex-row-reverse')}>
              <span className="h-px w-12 bg-ember" />
              <span className={cn('text-xs uppercase text-ember font-medium', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]')}>
                {cf.eyebrow}
              </span>
            </div>
            <h1 className={cn(
              'leading-tight tracking-tight mb-6',
              isRTL ? 'font-arabic font-bold text-4xl md:text-6xl leading-[1.3]' : 'font-serif-display text-5xl md:text-7xl'
            )}>
              {cf.heading.split('\n').map((line, i) => (
                <span key={i}>{i > 0 && <br />}{i === 1 ? <span className={cn('text-white/50', !isRTL && 'italic')}>{line}</span> : line}</span>
              ))}
            </h1>
            <p className={cn('text-lg text-white/45 font-light max-w-2xl leading-relaxed mt-6', isRTL && 'leading-[2]')}>
              {cf.subheading}
            </p>
            <p className={cn('mt-8 text-[10px] text-white/20 border-t border-white/[0.06] pt-6', isRTL ? 'font-arabic text-xs text-right' : 'uppercase tracking-[0.35em]')}>
              {cf.confidentialNote}
            </p>
          </motion.div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="px-6 lg:px-12 py-10 border-b border-white/5 bg-black/50">
        <div className={cn('max-w-5xl mx-auto', isRTL && 'text-right')}>
          <p className={cn('text-[10px] uppercase text-white/30 mb-5', isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]')}>
            {cf.filterLabel}
          </p>
          <div className={cn('flex flex-wrap gap-2', isRTL && 'justify-end')}>
            <button
              onClick={() => setActiveFilter('all')}
              className={cn(
                'px-4 py-2 text-xs border transition-all duration-200',
                isRTL ? 'font-arabic text-sm' : 'uppercase tracking-[0.15em]',
                activeFilter === 'all'
                  ? 'border-ember bg-ember/10 text-ember'
                  : 'border-white/12 text-white/40 hover:border-white/35 hover:text-white/70'
              )}
            >
              {cf.allLabel}
            </button>
            {cf.filters.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  'px-4 py-2 text-xs border transition-all duration-200',
                  isRTL ? 'font-arabic text-sm' : 'uppercase tracking-[0.15em]',
                  activeFilter === f.id
                    ? 'border-ember bg-ember/10 text-ember'
                    : 'border-white/12 text-white/40 hover:border-white/35 hover:text-white/70'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CASE GRID */}
      <section className="px-6 lg:px-12 py-20 md:py-28">
        <div className="max-w-5xl mx-auto space-y-16">
          {filtered.length === 0 ? (
            <div className={cn('py-32 text-center', isRTL && 'font-arabic')}>
              <p className={cn('text-white/28 text-lg font-light', isRTL && 'leading-[2]')}>
                {isRTL ? 'لا توجد حالات لهذا التصنيف.' : 'No cases match this filter.'}
              </p>
            </div>
          ) : filtered.map((c, i) => (
            <motion.article
              key={c.id}
              {...inView}
              transition={{ ...inView.transition, delay: i * 0.06 }}
              className={cn('border border-white/[0.08] bg-white/[0.015] relative overflow-hidden', isRTL && 'text-right')}
            >
              {/* Classification badge */}
              <div className={cn('flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-white/[0.02]', isRTL && 'flex-row-reverse')}>
                <span className={cn('text-[9px] uppercase text-white/22', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.4em]')}>
                  {cf.classificationBadge}
                </span>
                <span className={cn('text-[9px] text-ember/60', isRTL ? 'font-arabic text-xs' : 'uppercase tracking-[0.3em] font-mono')}>
                  {c.id} · {c.year}
                </span>
              </div>

              <div className="p-8 md:p-10">
                {/* Meta row */}
                <div className={cn('flex flex-wrap gap-6 mb-8', isRTL && 'flex-row-reverse')}>
                  {[
                    { label: cf.industryLabel, value: c.industry },
                    { label: cf.stageLabel, value: c.stage },
                    { label: cf.failureModeLabel, value: c.failureMode },
                  ].map(item => (
                    <div key={item.label}>
                      <p className={cn('text-[9px] uppercase text-white/25 mb-1', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>{item.label}</p>
                      <p className={cn('text-sm text-ember/80', isRTL && 'font-arabic')}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Key mistake */}
                <div className="mb-8">
                  <p className={cn('text-[9px] uppercase text-white/25 mb-3', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>{cf.mistakeLabel}</p>
                  <p className={cn('text-base text-white/75 leading-relaxed font-light', isRTL ? 'font-arabic leading-[2]' : undefined)}>{c.keyMistake}</p>
                </div>

                {/* Redacted section if present */}
                {c.redactedSection && (
                  <div className="mb-8 p-4 bg-white/[0.03] border border-white/[0.05]">
                    <p className={cn('text-[9px] uppercase text-red-400/30 mb-2', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>{cf.redactedLabel}</p>
                    <p className={cn('text-sm leading-relaxed relative', isRTL && 'font-arabic leading-[2]')}>
                      {c.redactedSection.split(/(\[.*?\])/).map((part, idx) =>
                        part.startsWith('[') ? (
                          <span key={idx} className="inline-block bg-white/15 text-transparent select-none rounded-sm px-1 mx-0.5 align-middle" style={{ minWidth: '80px' }}>&nbsp;</span>
                        ) : (
                          <span key={idx} className="text-white/35">{part}</span>
                        )
                      )}
                    </p>
                  </div>
                )}

                {/* Lessons */}
                <div className="mb-8">
                  <p className={cn('text-[9px] uppercase text-white/25 mb-4', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>{cf.lessonsLabel}</p>
                  <ul className="space-y-3">
                    {c.lessons.map((lesson, li) => (
                      <li key={li} className={cn('flex items-start gap-4', isRTL && 'flex-row-reverse')}>
                        <span className={cn('text-ember/40 flex-shrink-0 tabular-nums text-xs mt-0.5', isRTL ? 'font-arabic' : 'font-serif-display')}>{String(li + 1).padStart(2, '0')}</span>
                        <p className={cn('text-sm text-white/60 leading-relaxed font-light', isRTL ? 'font-arabic leading-[2]' : undefined)}>{lesson}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Outcome */}
                <div className="pt-6 border-t border-white/[0.06]">
                  <p className={cn('text-[9px] uppercase text-white/25 mb-2', isRTL ? 'font-arabic tracking-normal text-xs' : 'tracking-[0.3em]')}>{cf.outcomeLabel}</p>
                  <p className={cn('text-sm text-white/50 font-light leading-relaxed', isRTL ? 'font-arabic leading-[2]' : 'italic')}>{c.outcome}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
