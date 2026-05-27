/**
 * useT — returns the full translation object for the active language.
 *
 * Usage:
 *   const t = useT();
 *   <h1>{t.home.heroLine1}</h1>
 */

import { translations } from '@/i18n/translations';
import { useLanguage } from '@/contexts/LanguageContext';

export function useT() {
  const { lang } = useLanguage();
  return translations[lang];
}
