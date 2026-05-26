import { Link } from 'react-router-dom';

/**
 * Footer — Khabir Al Fashal
 * Minimal dark closing strip.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <p className="font-serif-display text-3xl md:text-5xl leading-[1.1] tracking-tight max-w-xl">
              Most founders meet me{' '}
              <span className="italic text-ember">six months</span> too late.
            </p>
            <Link
              to="/contact"
              className="inline-block mt-8 text-[11px] tracking-[0.3em] uppercase text-white/60 hover:text-ember transition-colors border-b border-white/20 hover:border-ember pb-1"
            >
              Don&apos;t be one of them →
            </Link>
          </div>

          <div className="md:col-span-2">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-5">
              Navigate
            </p>
            <ul className="space-y-3 text-sm text-white/70 font-light">
              <li><Link to="/" className="hover:text-ember transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-ember transition-colors">Case File</Link></li>
              <li><Link to="/contact" className="hover:text-ember transition-colors">Book a Session</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-5">
              Direct
            </p>
            <ul className="space-y-3 text-sm text-white/70 font-light">
              <li>
                <a href="mailto:case@khabiralfashal.com" className="hover:text-ember transition-colors">
                  case@khabiralfashal.com
                </a>
              </li>
              <li>Riyadh · Remote</li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-5">
              Social
            </p>
            <div className="flex items-center gap-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-white/50 hover:text-ember transition-colors duration-300">
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-white/50 hover:text-ember transition-colors duration-300">
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/50 hover:text-ember transition-colors duration-300">
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-white/50 hover:text-ember transition-colors duration-300">
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
                  <path d="M12.525.02c1.8-.1 3.74.521 4.92 2.04.85 1.1 1.03 2.55 1.06 3.93v7.86c-.02.24-.05.48-.08.72-.27 2.18-1.56 3.97-3.57 4.72-1.04.38-2.16.4-3.24.07-1.95-.57-3.38-2.13-3.81-4.12-.11-.52-.14-1.05-.1-1.58.07-1.01.37-1.98.88-2.83.82-1.4 2.13-2.33 3.72-2.58.24-.04.48-.06.72-.06v-3.8c-.1.01-.2.03-.3.04-1.7.28-3.29 1.1-4.47 2.31-1.8 1.85-2.57 4.42-2.09 6.97.37 1.97 1.53 3.71 3.18 4.75 1.45.91 3.15 1.27 4.82 1.02 1.77-.27 3.38-1.19 4.48-2.55.9-1.12 1.45-2.49 1.57-3.93.03-.35.04-.7.04-1.05V6.43h3.97c.02.14.04.28.06.42.1.78.32 1.53.64 2.24.75 1.63 2.02 2.93 3.57 3.66V8.28c-.54-.27-1.02-.63-1.43-1.06-.73-.77-1.24-1.73-1.47-2.78-.08-.37-.12-.75-.13-1.13V.02h-4.01z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-10 border-t border-white/5">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-ember" />
            <span className="text-[10px] tracking-[0.35em] uppercase text-white/50">
              خبير الفشل · Khabir Al Fashal
            </span>
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">
            © {year} · Case Files · All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
