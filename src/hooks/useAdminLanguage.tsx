import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { adminT } from '@/i18n/adminTranslations';
import { adminTEn } from '@/i18n/adminTranslationsEn';

export type AdminLanguage = 'ar' | 'en';
export type AdminDir = 'rtl' | 'ltr';

interface AdminLanguageState {
  language: AdminLanguage;
  dir: AdminDir;
  setLanguage: (lang: AdminLanguage) => void;
  toggleLanguage: () => void;
  t: typeof adminT;
}

const STORAGE_KEY = 'admin-language';

const AdminLanguageContext = createContext<AdminLanguageState | null>(null);

function getInitialLanguage(): AdminLanguage {
  if (typeof window === 'undefined') return 'ar';
  return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar';
}

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>(getInitialLanguage);

  const setLanguage = useCallback((lang: AdminLanguage) => {
    setLanguageState(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  const dir: AdminDir = language === 'ar' ? 'rtl' : 'ltr';

  const t = language === 'ar' ? adminT : (adminTEn as unknown as typeof adminT);

  return (
    <AdminLanguageContext.Provider value={{ language, dir, setLanguage, toggleLanguage, t }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  const ctx = useContext(AdminLanguageContext);
  if (!ctx) throw new Error('useAdminLanguage must be used inside AdminLanguageProvider');
  return ctx;
}
