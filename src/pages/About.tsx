import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import portrait from '@/assets/khabir-portrait.png';

/**
 * About — cinematic, documentary-style founder story
 * Brand: خبير الفشل | Khabir Al Fashal
 */
const chapters = [
  {
    eyebrow: 'I',
    title: 'The Collapse',
    body:
      'I built something I believed in. Then I watched it die — slowly, quietly, while every dashboard still looked green. By the time the numbers told the truth, the company was already gone. The autopsy started long before the funeral.',
  },
  {
    eyebrow: 'II',
    title: 'The Realization',
    body:
      'Most startups don\'t fail because of the market. They fail because the founder stopped seeing clearly. I stopped seeing clearly. The blind spots were not in the spreadsheet — they were in me.',
  },
  {
    eyebrow: 'III',
    title: 'Birth of خبير الفشل',
    body:
      'I went back to every collapse — mine, and hundreds of others. I read the post-mortems. I sat with the founders. I mapped the patterns nobody wanted to name. خبير الفشل is what came out of that obsession: a discipline, not a brand.',
  },
  {
    eyebrow: 'IV',
    title: 'The Work',
    body:
      'I study the psychology of founders who broke. The cognitive distortions. The denial loops. The decisions that looked rational at the time and detonated eighteen months later. This is not coaching. This is forensic analysis of the human inside the company.',
  },
];

export default function About() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="dark bg-obsidian text-white font-sans-ui">
      <SEOHead
        title="About — خبير الفشل"
        description="The founder behind خبير الفشل. A study of startup collapse, founder psychology, and the blind spots that kill companies long before they shut down."
      />

      {/* ============ HERO ============ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-end overflow-hidden"
      >
        {/* Grain + glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(26_100%_51%/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_55%,black_100%)]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute right-0 top-0 h-full w-full md:w-[55%] opacity-40 md:opacity-60"
        >
          <img
            src={portrait}
            alt="Mohamed Khalil"
            className="h-full w-full object-cover grayscale contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/40 to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pb-24 md:pb-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-ember" />
              <span className="text-xs tracking-[0.3em] uppercase text-ember font-medium">
                Case File · 001
              </span>
            </div>

            <h1 className="font-serif-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8">
              Some startups die
              <br />
              <span className="italic text-white/70">long before</span>
              <br />
              they officially
              <br />
              shut down.
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed font-light">
              I'm Mohamed Khalil. I study the death of companies — not to mourn them, but to understand the founder who didn't see it coming. Usually, that founder was me.
            </p>
          </motion.div>
        </div>

        {/* Bottom marker */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] uppercase text-white/30">
          Scroll · شاهد
        </div>
      </section>

      {/* ============ CHAPTERS ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-32 md:space-y-48">
          {chapters.map((c, i) => (
            <motion.article
              key={c.eyebrow}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-12"
            >
              <div className="md:pt-4">
                <div className="font-serif-display text-4xl italic text-ember">
                  {c.eyebrow}
                </div>
                <div className="mt-2 h-px w-12 bg-white/20" />
              </div>
              <div>
                <h2 className="font-serif-display text-4xl md:text-6xl tracking-tight mb-8 leading-[1.05]">
                  {c.title}
                </h2>
                <p className="text-lg md:text-xl text-white/60 leading-[1.8] font-light max-w-2xl">
                  {c.body}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ============ PULL QUOTE ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12 border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(26_100%_51%/0.08),transparent_70%)]" />
        <motion.blockquote
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5 }}
          className="relative max-w-5xl mx-auto text-center"
        >
          <div className="font-serif-display text-7xl text-ember/40 leading-none mb-8">
            "
          </div>
          <p className="font-serif-display text-3xl md:text-5xl lg:text-6xl leading-[1.15] tracking-tight text-white/90">
            I am not here to motivate you.
            <br />
            <span className="italic text-white/50">
              I am here to tell you what you refuse to see.
            </span>
          </p>
          <p className="mt-12 text-xs tracking-[0.3em] uppercase text-white/30">
            — Mohamed Khalil · مؤسس خبير الفشل
          </p>
        </motion.blockquote>
      </section>

      {/* ============ MISSION ============ */}
      <section className="py-32 px-6 lg:px-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-12 md:gap-16">
          {[
            {
              n: '01',
              k: 'No fake gurus',
              v: 'No motivational theater. No LinkedIn philosophy. The data is brutal enough on its own.',
            },
            {
              n: '02',
              k: 'Founder psychology',
              v: 'Every collapse has a human signature. We trace the decision back to the cognitive state that produced it.',
            },
            {
              n: '03',
              k: 'Pattern intelligence',
              v: 'Hundreds of post-mortems. Cross-referenced. The patterns repeat. We name them before they repeat in you.',
            },
          ].map((p) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="border-t border-white/10 pt-6"
            >
              <div className="text-xs tracking-[0.3em] text-ember mb-4">{p.n}</div>
              <h3 className="font-serif-display text-2xl mb-3">{p.k}</h3>
              <p className="text-sm text-white/50 leading-relaxed font-light">
                {p.v}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ CLOSING + CTA ============ */}
      <section className="relative py-32 md:py-48 px-6 lg:px-12 border-t border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-4xl mx-auto text-center space-y-12"
        >
          <p className="font-serif-display text-3xl md:text-5xl leading-tight text-white/90">
            If you've read this far,
            <br />
            <span className="italic text-ember">
              something already feels off
            </span>
            <br />
            inside your company.
          </p>
          <p className="text-base md:text-lg text-white/50 font-light max-w-xl mx-auto leading-relaxed">
            Trust that feeling. Most founders meet me six months too late.
          </p>

          <Link
            to="/contact"
            className="group inline-flex items-center gap-4 px-8 py-5 border border-white/20 hover:border-ember hover:bg-ember/5 transition-all duration-500"
          >
            <span className="text-sm tracking-[0.25em] uppercase font-medium">
              Request an Autopsy
            </span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
