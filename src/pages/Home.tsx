import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

/**
 * Home — خبير الفشل | Khabir Al Fashal
 * Cinematic dark landing: startup autopsy / failure intelligence platform.
 */

const patterns = [
  {
    n: '01',
    title: 'Founder Denial Loop',
    body:
      'The story you tell investors becomes the story you tell yourself. Eighteen months later, the spreadsheet finally disagrees.',
  },
  {
    n: '02',
    title: 'Green Dashboard Collapse',
    body:
      'Every metric is up and to the right while the company is already dying underneath. The signal was never in the dashboard.',
  },
  {
    n: '03',
    title: 'Co-founder Drift',
    body:
      'You stopped having the hard conversation in month four. By month sixteen the company is paying for a silence neither of you owns.',
  },
  {
    n: '04',
    title: 'Premature Scaling',
    body:
      'You hired ahead of clarity. The org chart is now defending a strategy nobody believes in but everyone is paid to execute.',
  },
];

const stats = [
  { k: '317', v: 'Post-mortems studied' },
  { k: '12', v: 'Recurring failure patterns' },
  { k: '6mo', v: 'Average warning window ignored' },
  { k: '01', v: 'Honest conversation required' },
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="dark bg-black text-white font-sans-ui">
      <SEOHead
        title="خبير الفشل — Startup Failure Intelligence"
        description="A forensic study of why startups die. No coaching. No clichés. Founder psychology, decision autopsies, and pattern intelligence from hundreds of post-mortems."
      />

      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-32 pb-12 px-6 lg:px-12"
      >
        {/* Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,hsl(18_92%_55%/0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,black_0%,transparent_25%,transparent_70%,black_100%)] pointer-events-none" />
        {/* Subtle horizontal lines */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
             style={{
               backgroundImage:
                 'repeating-linear-gradient(0deg, white 0, white 1px, transparent 1px, transparent 80px)',
             }} />

        {/* Top meta strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between text-[10px] tracking-[0.4em] uppercase text-white/30"
        >
          <span>Case Files · Open</span>
          <span className="hidden md:inline">Riyadh · 24.7136° N</span>
          <span>v.001 · 2026</span>
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
            <div className="flex items-center gap-3 mb-10">
              <span className="h-px w-12 bg-ember" />
              <span className="text-xs tracking-[0.35em] uppercase text-ember font-medium">
                Startup Failure Intelligence
              </span>
            </div>

            <h1 className="font-serif-display text-[15vw] md:text-[10vw] lg:text-[8.5vw] leading-[0.92] tracking-tight">
              We don&apos;t teach
              <br />
              you how to{' '}
              <span className="italic text-white/40">win.</span>
              <br />
              We show you{' '}
              <span className="text-ember italic">why</span>
              <br />
              you are{' '}
              <span className="italic">losing.</span>
            </h1>

            <div className="mt-12 grid md:grid-cols-[1fr_auto] gap-8 md:gap-16 items-end max-w-4xl">
              <p className="text-base md:text-lg text-white/55 leading-relaxed font-light max-w-xl">
                <span className="font-arabic text-white/80 text-xl">خبير الفشل</span> — a forensic
                practice studying the psychology, decisions, and blind spots
                that kill companies long before the funding runs out.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/contact"
                  className="group inline-flex items-center justify-between gap-8 px-7 py-4 bg-ember text-black hover:bg-white transition-colors duration-500"
                >
                  <span className="text-xs tracking-[0.25em] uppercase font-semibold">
                    Book a Risk Session
                  </span>
                  <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" />
                </Link>
                <Link
                  to="/about"
                  className="group inline-flex items-center justify-between gap-8 px-7 py-4 border border-white/15 hover:border-white/50 transition-colors duration-500"
                >
                  <span className="text-xs tracking-[0.25em] uppercase font-medium text-white/80">
                    The Case File
                  </span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
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
          <span>Scroll · انزل</span>
          <span className="hidden md:inline">Subject: The Founder</span>
        </motion.div>
      </section>

      {/* ============ MANIFESTO STRIP ============ */}
      <section className="relative border-y border-white/5 overflow-hidden">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap py-8 font-serif-display text-3xl md:text-5xl italic text-white/15"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="px-12 flex items-center gap-12">
              No fake gurus.
              <span className="text-ember">·</span>
              No motivational theater.
              <span className="text-ember">·</span>
              Only what the data refuses to soften.
              <span className="text-ember">·</span>
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
            <p className="text-xs tracking-[0.35em] uppercase text-ember mb-6">
              Thesis · الفرضية
            </p>
            <p className="font-serif-display text-3xl md:text-4xl italic text-white/40 leading-snug">
              The company didn&apos;t fail.
              <br />
              The founder stopped seeing.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, delay: 0.15 }}
            className="md:col-span-8 space-y-8 text-lg md:text-xl text-white/65 font-light leading-[1.8]"
          >
            <p>
              Markets are blamed. Timing is blamed. Investors are blamed.
              But underneath almost every collapse is a founder running a
              quiet, private cognitive failure — months before anyone names
              it out loud.
            </p>
            <p>
              <span className="text-white">خبير الفشل</span> is a discipline
              built on the autopsies of hundreds of dead companies. We map
              the decisions, the denial, the distortions — and we name them
              before they repeat inside you.
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
              <p className="text-xs tracking-[0.35em] uppercase text-ember mb-6">
                Pattern Library · Excerpt
              </p>
              <h2 className="font-serif-display text-5xl md:text-7xl leading-[0.95] tracking-tight max-w-3xl">
                The collapse always{' '}
                <span className="italic text-white/50">rhymes.</span>
              </h2>
            </div>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              Four of twelve recurring patterns we trace inside founders we
              study. The full library is for private sessions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-px bg-white/5 border border-white/5">
            {patterns.map((p, i) => (
              <motion.article
                key={p.n}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.8, delay: i * 0.08 }}
                className="group relative bg-black p-10 md:p-14 hover:bg-ember/[0.04] transition-colors duration-700"
              >
                <div className="flex items-start justify-between mb-10">
                  <span className="text-xs tracking-[0.3em] text-ember">
                    Pattern · {p.n}
                  </span>
                  <ArrowUpRight className="size-4 text-white/20 group-hover:text-ember group-hover:rotate-45 transition-all duration-500" />
                </div>
                <h3 className="font-serif-display text-3xl md:text-4xl mb-6 leading-tight">
                  {p.title}
                </h3>
                <p className="text-base text-white/50 font-light leading-relaxed max-w-md">
                  {p.body}
                </p>
              </motion.article>
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
          <p className="font-serif-display text-4xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight">
            By the time the numbers
            <br />
            tell the truth,
            <br />
            <span className="italic text-ember">the company is already gone.</span>
          </p>
          <p className="mt-12 text-[10px] tracking-[0.4em] uppercase text-white/30">
            — Field Note · 2023 · Riyadh
          </p>
        </motion.blockquote>
      </section>

      {/* ============ STATS ============ */}
      <section className="border-t border-white/5 py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/5">
          {stats.map((s, i) => (
            <motion.div
              key={s.k}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="bg-black p-8 md:p-10"
            >
              <div className="font-serif-display text-5xl md:text-6xl text-ember mb-3">
                {s.k}
              </div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">
                {s.v}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

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
          <p className="text-xs tracking-[0.35em] uppercase text-ember mb-10">
            Intake Open · Limited Cases
          </p>
          <h2 className="font-serif-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-12">
            Something already
            <br />
            <span className="italic text-white/60">feels off.</span>
            <br />
            Let&apos;s name it.
          </h2>
          <p className="text-base md:text-lg text-white/50 font-light max-w-xl mx-auto leading-relaxed mb-14">
            One conversation. Private. Direct. No fake optimism. No startup
            clichés. Just the truth your team is too close to tell you.
          </p>

          <Link
            to="/contact"
            className="group inline-flex items-center gap-8 px-10 py-6 bg-ember text-black hover:bg-white transition-colors duration-500"
          >
            <span className="text-sm tracking-[0.25em] uppercase font-semibold">
              Request the Session
            </span>
            <ArrowUpRight className="size-5 transition-transform group-hover:rotate-45" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
