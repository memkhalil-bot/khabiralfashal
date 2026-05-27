/**
 * LanguageContext — derives the active language from the URL prefix.
 *
 * URL convention
 *   /en        → English home
 *   /en/about  → English about
 *   /ar        → Arabic home
 *   /ar/about  → Arabic about
 *   /          → redirected to /en by App router
 *
 * The context is read-only; changing language is done by navigating to the
 * equivalent path under the other prefix (see switchPath()).
 */

import {
  createContext,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import type { Lang, Dir } from '@/i18n/translations';

interface LanguageContextValue {
  lang: Lang;
  dir: Dir;
  /**
   * Convert a base path (e.g. "/about") to the current-language path
   * (e.g. "/en/about" or "/ar/about").
   * Pass "/" for the homepage.
   */
  getPath: (basePath: string) => string;
  /**
   * Return the equivalent path in the target language.
   * Used by the language toggle in the Header.
   */
  switchPath: (targetLang: Lang) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  dir: 'ltr',
  getPath: (p) => `/en${p === '/' ? '' : p}`,
  switchPath: (l) => `/${l}`,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  // Derive language from the first path segment
  const lang: Lang = location.pathname.startsWith('/ar') ? 'ar' : 'en';
  const dir: Dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Strip the /en or /ar prefix to get the base path (e.g. "/about")
  const basePath = location.pathname.replace(/^\/(en|ar)/, '') || '/';

  const getPath = (path: string) => {
    const clean = path === '/' ? '' : path;
    return `/${lang}${clean}`;
  };

  const switchPath = (targetLang: Lang) => {
    const clean = basePath === '/' ? '' : basePath;
    return `/${targetLang}${clean}`;
  };

  // Sync <html dir> and <html lang> with the active language
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, dir, getPath, switchPath }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
