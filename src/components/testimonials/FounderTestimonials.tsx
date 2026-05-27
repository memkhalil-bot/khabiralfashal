import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

/**
 * FounderTestimonials
 * Dark cinematic, minimal, founder-to-founder testimonial rotator.
 * Pulls from public.testimonials (published = true), ordered by order_index.
 */

type Testimonial = {
  id: string;
  quote: string;
  author_name: string;
  author_role: string | null;
  company: string | null;
};

interface Props {
  /** Optional kicker label above the section */
  eyebrow?: string;
  /** Optional heading rendered in serif display */
  heading?: string;
  /** Rotation interval in ms */
  intervalMs?: number;
}

export function FounderTestimonials({
  eyebrow = 'Founder Field Notes',
  heading = 'What founders said\nafter the session.',
  intervalMs = 7000,
}: Props) {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let active = true;
    supabase
      .from('testimonials')
      .select('id, quote, author_name, author_role, company')
      .eq('published', true)
      .order('order_index', { ascending: true })
      .then(({ data }) => {
        if (active && data) setItems(data as Testimonial[]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [paused, items.length, intervalMs]);

  if (items.length === 0) return null;
  const current = items[index];

  return (
    <section
      className="relative border-t border-white/5 bg-black text-white py-32 md:py-44 px-6 lg:px-12 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,hsl(18_92%_55%/0.10),transparent_60%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 80px)',
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9 }}
          className="mb-16 md:mb-24"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-10 bg-ember" />
            <span className="text-[10px] tracking-[0.4em] uppercase text-ember font-medium">
              {eyebrow}
            </span>
          </div>
          <h2 className="font-serif-display text-4xl md:text-6xl leading-[1.05] tracking-tight whitespace-pre-line max-w-3xl">
            {heading.split('\n').map((line, i, arr) => (
              <span key={i}>
                {i === arr.length - 1 ? (
                  <span className="italic text-white/55">{line}</span>
                ) : (
                  line
                )}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h2>
        </motion.div>

        {/* Quote stage */}
        <div className="relative min-h-[280px] md:min-h-[260px]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={current.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Oversized quotation mark */}
              <div
                aria-hidden
                className="absolute -top-10 -left-2 font-serif-display text-[8rem] md:text-[10rem] leading-none text-ember/15 select-none pointer-events-none"
              >
                &ldquo;
              </div>

              <blockquote className="relative font-serif-display text-2xl md:text-4xl leading-[1.35] text-white/90 max-w-4xl">
                {current.quote}
              </blockquote>

              <figcaption className="mt-10 flex items-center gap-4 text-sm">
                <span className="h-px w-8 bg-ember" />
                <span className="text-white/80 font-medium">
                  {current.author_name}
                </span>
                {current.author_role && (
                  <span className="text-white/40">· {current.author_role}</span>
                )}
                {current.company && (
                  <span className="text-white/30 hidden md:inline">
                    · {current.company}
                  </span>
                )}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* Controls */}
        {items.length > 1 && (
          <div className="mt-16 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              {items.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Show testimonial ${i + 1}`}
                  className="group relative h-px w-10 bg-white/15 overflow-hidden"
                >
                  <span
                    className={`absolute inset-0 origin-left bg-ember transition-transform duration-500 ${
                      i === index ? 'scale-x-100' : 'scale-x-0'
                    } group-hover:scale-x-100`}
                  />
                </button>
              ))}
            </div>
            <span className="text-[10px] tracking-[0.4em] uppercase text-white/30">
              {String(index + 1).padStart(2, '0')} /{' '}
              {String(items.length).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export default FounderTestimonials;
