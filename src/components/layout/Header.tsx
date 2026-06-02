import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useLanguage } from '@/contexts/LanguageContext';
import { useT } from '@/hooks/useT';
import { cn } from '@/lib/utils';

/**
 * Header — Khabir Al Fashal
 * Always dark. Minimal. Cinematic.
 * Language-aware: shows active lang, links to /en/* or /ar/* equivalents.
 */
export function Header() {
  const location = useLocation();
  const { isScrolled } = useScrollPosition();
  const [open, setOpen] = useState(false);
  const { lang, getPath, switchPath } = useLanguage();
  const t = useT();

  // Build nav links from translations (base paths without lang prefix)
  const navLinks = [
    { name: t.nav.home,        basePath: '/' },
    { name: t.nav.caseFile,    basePath: '/about' },
    { name: t.nav.valley,      basePath: '/valley-of-death' },
    { name: t.nav.methodology, basePath: '/methodology' },
    { name: t.nav.session,     basePath: '/contact' },
  ];

  const isRTL = lang === 'ar';

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={getPath('/')} className="group flex items-center gap-3">
            <span className="h-px w-8 bg-ember transition-all duration-500 group-hover:w-12" />
            <span className={cn(
              'text-[11px] tracking-[0.35em] uppercase text-white font-medium',
              isRTL && 'font-arabic tracking-normal'
            )}>
              خبير الفشل
            </span>
            <span className="hidden sm:inline text-[10px] tracking-[0.3em] uppercase text-white/30">
              / Khabir Al Fashal
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className={cn('hidden md:flex items-center gap-10', isRTL && 'flex-row-reverse')}>
            {navLinks.map((link) => {
              const href = getPath(link.basePath);
              const active = location.pathname === href || (link.basePath === '/' && /^\/(en|ar)\/?$/.test(location.pathname));
              return (
                <Link
                  key={link.basePath}
                  to={href}
                  className={cn(
                    'relative group text-[11px] uppercase text-white/60 hover:text-white transition-colors duration-300',
                    isRTL ? 'font-arabic tracking-normal text-sm' : 'tracking-[0.3em]'
                  )}
                >
                  <span className={cn(active && 'text-white')}>
                    {link.name}
                  </span>
                  <span
                    className={cn(
                      'absolute -bottom-2 h-px bg-ember transition-all duration-500',
                      isRTL ? 'right-0' : 'left-0',
                      active ? 'w-full' : 'w-0 group-hover:w-full'
                    )}
                  />
                </Link>
              );
            })}

            {/* Language toggle */}
            <Link
              to={switchPath(lang === 'en' ? 'ar' : 'en')}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 py-2 border-2 border-ember/50 hover:border-ember bg-ember/5 hover:bg-ember/15 text-ember hover:text-white text-[11px] tracking-[0.3em] uppercase font-semibold transition-all duration-300"
              aria-label={lang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
            >
              {t.nav.langToggle}
            </Link>
          </nav>

          {/* Mobile trigger */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden size-10 flex items-center justify-center text-white"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black border-t border-white/5"
          >
            <nav className="flex flex-col px-6 py-8 gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.basePath}
                  to={getPath(link.basePath)}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between text-white border-b border-white/5 pb-4"
                >
                  <span className={cn(
                    'font-serif-display text-3xl',
                    isRTL && 'font-arabic'
                  )}>
                    {link.name}
                  </span>
                </Link>
              ))}
              {/* Mobile language toggle */}
              <Link
                to={switchPath(lang === 'en' ? 'ar' : 'en')}
                onClick={() => setOpen(false)}
                className="inline-flex self-start items-center justify-center min-h-[44px] gap-2 text-[11px] tracking-[0.3em] uppercase text-ember font-semibold border-2 border-ember/50 hover:border-ember bg-ember/5 hover:bg-ember/15 px-4 py-2 transition-all duration-300"
              >
                {t.nav.langToggle}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
