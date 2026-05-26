import { Link } from 'react-router-dom';

/**
 * Footer — Khabir Al Fashal
 * Minimal dark closing strip.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-obsidian text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-6">
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

          <div className="md:col-span-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-5">
              Navigate
            </p>
            <ul className="space-y-3 text-sm text-white/70 font-light">
              <li><Link to="/" className="hover:text-ember transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-ember transition-colors">Case File</Link></li>
              <li><Link to="/contact" className="hover:text-ember transition-colors">Book a Session</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
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
