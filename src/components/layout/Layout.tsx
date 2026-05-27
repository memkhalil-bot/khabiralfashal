import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout wrapper component
 * Provides consistent header and footer across all pages.
 * Homepage (/ en | /ar) removes top padding to allow header overlay on hero.
 * RTL direction is applied to <html> by LanguageContext.
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  // Homepage paths: /en, /ar, /en/, /ar/
  const isHomepage = /^\/(en|ar)\/?$/.test(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        id="main-content"
        className={`flex-1 ${isHomepage ? '' : 'pt-16'}`}
        tabIndex={-1}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
