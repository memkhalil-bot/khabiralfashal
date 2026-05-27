import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { FounderAssessment } from '@/components/valley/FounderAssessment';
import { ValleyCurve } from '@/components/valley/ValleyCurve';


export default function ValleyOfDeath() {
  return (
    <div className="dark bg-black text-white font-sans-ui min-h-screen">
      <SEOHead
        title="Valley of Death — The Founder Test | خبير الفشل"
        description="A brutal self-diagnostic for founders. No motivation. Just the truth about how close your company is to the edge."
      />

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 lg:px-12 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(18_92%_55%/0.12),transparent_65%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,black)]" />
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-ember" />
              <span className="text-xs tracking-[0.3em] uppercase text-ember font-medium">
                The Founder Test · اختبار المؤسس
              </span>
            </div>
            <h1 className="font-serif-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              Valley
              <br />
              <span className="italic text-ember">of Death.</span>
            </h1>
            <p className="mt-10 text-lg md:text-xl text-white/55 max-w-2xl leading-relaxed font-light">
              No motivation. No coaching. Answer honestly —
              the only person you can lie to here is yourself.
            </p>
            <p
              dir="rtl"
              className="mt-4 font-arabic text-base md:text-lg text-white/40 leading-relaxed max-w-xl"
            >
              اختبار صريح يكشف لك أين أنت فعلاً.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Animated Valley of Death curve diagram */}
      <ValleyCurve />

      {/* Cinematic in-site founder diagnostic */}
      <FounderAssessment />

    </div>
  );
}
