import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowUpRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SEOHead } from '@/components/seo/SEOHead';
import bookCallPhone from '@/assets/book-call-phone.png';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  company: z.string().trim().max(120).optional(),
  stage: z.enum(['idea', 'pre-seed', 'seed', 'series-a', 'post-failure']),
  context: z.string().trim().min(20).max(1500),
});
type FormValues = z.infer<typeof schema>;

const stages = [
  { v: 'idea', label: 'Idea / Pre-build' },
  { v: 'pre-seed', label: 'Pre-seed' },
  { v: 'seed', label: 'Seed' },
  { v: 'series-a', label: 'Series A+' },
  { v: 'post-failure', label: 'Post-failure / Pivot' },
];

export default function Contact() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedStage = watch('stage');

  const onSubmit = async (_data: FormValues) => {
    await new Promise((r) => setTimeout(r, 900));
    setDone(true);
    reset();
    setTimeout(() => setDone(false), 6000);
  };

  return (
    <div className="dark bg-obsidian text-white font-sans-ui min-h-screen">
      <SEOHead
        title="Book a Risk Session — خبير الفشل"
        description="A private, honest conversation about your company, your decisions, and the risks ahead. No coaching. No clichés."
      />

      {/* HERO */}
      <section className="relative pt-32 md:pt-40 pb-20 px-6 lg:px-12 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(26_100%_51%/0.12),transparent_65%)]" />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1"
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-12 bg-ember" />
              <span className="text-xs tracking-[0.3em] uppercase text-ember font-medium">
                Private Session · جلسة مغلقة
              </span>
            </div>
            <h1 className="font-serif-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              Book a
              <br />
              <span className="italic text-ember">Risk Session.</span>
            </h1>
            <p className="mt-10 text-lg md:text-xl text-white/55 max-w-xl leading-relaxed font-light">
              No fake optimism. No startup clichés. Just an honest conversation
              about your company, your decisions, and the risks already moving
              underneath them.
            </p>
            <p
              dir="rtl"
              className="mt-6 font-arabic text-base md:text-lg text-white/40 leading-relaxed max-w-xl"
            >
              خطوة واحدة قد تغير مسار شركتك.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="order-1 lg:order-2 relative"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(26_100%_51%/0.18),transparent_70%)] blur-2xl" />
            <img
              src={bookCallPhone}
              alt="Orange phone receiver — book a risk session"
              className="relative w-full h-auto max-w-lg mx-auto select-none pointer-events-none"
              draggable={false}
            />
          </motion.div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="px-6 lg:px-12 py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {[
            { k: 'Private', v: 'Nothing leaves the room. No notes shared.' },
            { k: 'Direct', v: 'I will tell you what your team will not.' },
            { k: 'Honest', v: 'No clichés. No theater. Just the truth on the table.' },
          ].map((b) => (
            <div key={b.k} className="bg-obsidian p-8">
              <div className="font-serif-display text-3xl text-ember mb-3">
                {b.k}
              </div>
              <p className="text-sm text-white/50 font-light leading-relaxed">
                {b.v}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* FORM */}
      <section className="px-6 lg:px-12 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-ember/30 bg-ember/5 p-12 text-center"
            >
              <CheckCircle2 className="size-12 mx-auto text-ember mb-6" />
              <h3 className="font-serif-display text-3xl mb-3">
                Request received.
              </h3>
              <p className="text-white/60 font-light max-w-md mx-auto leading-relaxed">
                I read every submission personally. If your case fits, you'll
                hear from me directly.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-10"
            >
              <div className="mb-12">
                <p className="text-xs tracking-[0.3em] uppercase text-ember mb-4">
                  Intake · استمارة
                </p>
                <h2 className="font-serif-display text-3xl md:text-4xl tracking-tight">
                  Tell me what's actually happening.
                </h2>
              </div>

              {/* Name + Email */}
              <div className="grid md:grid-cols-2 gap-8">
                <Field label="Your name" error={errors.name?.message}>
                  <input
                    {...register('name')}
                    className="w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-lg font-light transition-colors"
                    placeholder="Mohamed K."
                  />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-lg font-light transition-colors"
                    placeholder="you@company.com"
                  />
                </Field>
              </div>

              <Field label="Company / Project (optional)">
                <input
                  {...register('company')}
                  className="w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-lg font-light transition-colors"
                  placeholder="Name or stealth"
                />
              </Field>

              {/* Stage */}
              <Field label="Stage" error={errors.stage?.message}>
                <div className="flex flex-wrap gap-2 pt-2">
                  {stages.map((s) => {
                    const active = selectedStage === s.v;
                    return (
                      <button
                        type="button"
                        key={s.v}
                        onClick={() =>
                          setValue('stage', s.v as FormValues['stage'], {
                            shouldValidate: true,
                          })
                        }
                        className={`px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-all ${
                          active
                            ? 'border-ember bg-ember/10 text-ember'
                            : 'border-white/15 text-white/50 hover:border-white/40 hover:text-white/80'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field
                label="What's the situation?"
                hint="Be direct. The more honest the intake, the sharper the session."
                error={errors.context?.message}
              >
                <textarea
                  {...register('context')}
                  rows={6}
                  className="w-full bg-transparent border-b border-white/20 focus:border-ember outline-none py-3 text-base font-light leading-relaxed resize-none transition-colors"
                  placeholder="The numbers say one thing. My gut says another. We're..."
                />
              </Field>

              <div className="pt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full md:w-auto inline-flex items-center justify-between gap-12 px-10 py-6 bg-ember text-black hover:bg-white transition-all duration-500 disabled:opacity-50"
                >
                  <span className="text-sm tracking-[0.25em] uppercase font-semibold">
                    {isSubmitting ? 'Submitting…' : 'Request the Session'}
                  </span>
                  {isSubmitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <ArrowUpRight className="size-5 transition-transform group-hover:rotate-45" />
                  )}
                </button>

                <p className="mt-6 text-xs text-white/30 tracking-wide font-light max-w-md">
                  Submitting does not guarantee a session. I take a limited
                  number of cases each month based on fit.
                </p>
              </div>
            </motion.form>
          )}
        </div>
      </section>

      {/* CLOSING */}
      <section className="border-t border-white/5 py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-serif-display text-2xl md:text-4xl italic text-white/40 leading-snug">
            "Save it <span className="text-ember">before</span> it becomes
            <br />
            another case study."
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---------- small field primitive ---------- */
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] tracking-[0.25em] uppercase text-white/40 mb-2">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-2 text-xs text-white/30 font-light">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-xs text-ember font-light">{error}</p>
      )}
    </div>
  );
}
