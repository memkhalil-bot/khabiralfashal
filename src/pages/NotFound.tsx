import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { useT } from "@/hooks/useT";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * 404 Not Found — dark cinematic Khabir Al Fashal style.
 * Bilingual: uses useT() for strings, useLanguage() for the home path.
 */
const NotFound = () => {
  const t = useT();
  const n = t.notFound;
  const { getPath, lang } = useLanguage();
  const isRTL = lang === 'ar';

  return (
    <>
      <SEOHead title={n.metaTitle} description={n.metaDesc} />

      <main className="dark bg-black text-white min-h-[calc(100vh-8rem)] flex items-center justify-center px-6">
        <motion.div
          className="max-w-2xl w-full text-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 404 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="font-serif-display text-[120px] md:text-[180px] font-extralight tracking-wider leading-none text-white/10">
              404
            </h1>
          </motion.div>

          {/* Content */}
          <div className="space-y-4 -mt-8">
            <motion.h2
              className={cn(
                'text-3xl md:text-5xl font-light tracking-wide text-white',
                isRTL && 'font-arabic font-bold'
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {n.heading}
            </motion.h2>

            <motion.p
              className={cn(
                'text-base md:text-lg text-white/50 font-light leading-relaxed max-w-md mx-auto',
                isRTL && 'font-arabic leading-[2]'
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {n.body}
            </motion.p>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Link
              to={getPath('/')}
              className="inline-flex items-center gap-3 px-8 py-5 border border-white/20 hover:border-ember hover:bg-ember/5 text-white transition-all duration-500 group"
            >
              <ArrowLeft className={cn(
                'size-5 transition-transform group-hover:-translate-x-1',
                isRTL && 'rotate-180'
              )} />
              <span className={cn(
                'text-sm uppercase font-medium',
                isRTL ? 'font-arabic tracking-normal' : 'tracking-[0.25em]'
              )}>
                {n.ctaButton}
              </span>
            </Link>
          </motion.div>

          <motion.div
            className="pt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <div className="h-px w-24 mx-auto bg-white/10" />
          </motion.div>
        </motion.div>
      </main>
    </>
  );
};

export default NotFound;
