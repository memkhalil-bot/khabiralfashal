import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Home', path: '/', ar: 'الرئيسية' },
  { name: 'Case File', path: '/about', ar: 'الملف' },
  { name: 'Session', path: '/contact', ar: 'الجلسة' },
];

/**
 * Header — Khabir Al Fashal
 * Always dark. Minimal. Cinematic.
 */
export function Header() {
  const location = useLocation();
  const { isScrolled } = useScrollPosition();
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-obsidian/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <span className="h-px w-8 bg-ember transition-all duration-500 group-hover:w-12" />
            <span className="text-[11px] tracking-[0.35em] uppercase text-white font-medium">
              خبير الفشل
            </span>
            <span className="hidden sm:inline text-[10px] tracking-[0.3em] uppercase text-white/30">
              / Khabir Al Fashal
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="relative group text-[11px] tracking-[0.3em] uppercase text-white/60 hover:text-white transition-colors duration-300"
                >
                  <span className={cn(active && 'text-white')}>
                    {link.name}
                  </span>
                  <span
                    className={cn(
                      'absolute -bottom-2 left-0 h-px bg-ember transition-all duration-500',
                      active ? 'w-full' : 'w-0 group-hover:w-full'
                    )}
                  />
                </Link>
              );
            })}
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
            className="md:hidden bg-obsidian border-t border-white/5"
          >
            <nav className="flex flex-col px-6 py-8 gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between text-white border-b border-white/5 pb-4"
                >
                  <span className="font-serif-display text-3xl">
                    {link.name}
                  </span>
                  <span className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                    {link.ar}
                  </span>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
