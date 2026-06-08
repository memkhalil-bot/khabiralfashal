import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type AdminTheme = 'focus' | 'day';

interface AdminThemeState {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'admin-theme';

const AdminThemeContext = createContext<AdminThemeState | null>(null);

function getInitialTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'focus';
  return window.localStorage.getItem(STORAGE_KEY) === 'day' ? 'day' : 'focus';
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(getInitialTheme);

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'focus' ? 'day' : 'focus');
  }, [theme, setTheme]);

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) throw new Error('useAdminTheme must be used inside AdminThemeProvider');
  return ctx;
}
