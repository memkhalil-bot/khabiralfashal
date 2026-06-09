import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AdminAuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

// If user_roles query takes longer than this, we stop waiting and treat as non-admin.
const ROLE_CHECK_TIMEOUT_MS = 8_000;

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkAdmin = useCallback(async (uid: string): Promise<boolean> => {
    console.log('[AdminAuth] checkAdmin → querying user_roles for uid:', uid);

    const timeoutPromise = new Promise<false>((resolve) =>
      setTimeout(() => {
        console.warn('[AdminAuth] checkAdmin → timed out after', ROLE_CHECK_TIMEOUT_MS, 'ms');
        resolve(false);
      }, ROLE_CHECK_TIMEOUT_MS)
    );

    const queryPromise = (supabase as any)
      .from('user_roles')
      .select('role')
      .eq('user_id', uid)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data, error }: { data: unknown; error: { message: string; code: string } | null }) => {
        if (error) {
          console.error('[AdminAuth] checkAdmin → role query error:', error.code, error.message);
          return false;
        }
        console.log('[AdminAuth] checkAdmin → role query result:', data ?? '(no matching row)');
        return data !== null;
      })
      .catch((err: unknown) => {
        console.error('[AdminAuth] checkAdmin → role query threw:', err);
        return false;
      });

    return Promise.race([queryPromise, timeoutPromise]);
  }, []);

  useEffect(() => {
    // ── Auth state changes ─────────────────────────────────────────────────────
    // We rely solely on onAuthStateChange (fires INITIAL_SESSION on mount with
    // the persisted localStorage session, then SIGNED_IN / SIGNED_OUT / etc.).
    // A separate getSession() call would run checkAdmin() concurrently and
    // create a race where the slower of the two overwrites isAdmin last.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('[AdminAuth] onAuthStateChange → event:', _event, '| user:', session?.user?.email ?? 'none');

        // TOKEN_REFRESHED / USER_UPDATED: the JWT rotated but the user and their
        // role are unchanged — skip the DB round-trip so a transient query error
        // can never flip isAdmin to false mid-session.
        if (_event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          return;
        }

        // All other events (INITIAL_SESSION, SIGNED_IN, SIGNED_OUT …) need a
        // fresh role check. Hold loading=true so ProtectedAdminRoute shows the
        // spinner rather than redirecting while checkAdmin is in-flight.
        setLoading(true);
        try {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            console.log('[AdminAuth] onAuthStateChange → running checkAdmin...');
            const admin = await checkAdmin(session.user.id);
            console.log('[AdminAuth] onAuthStateChange → isAdmin:', admin);
            setIsAdmin(admin);
            if (!admin) {
              setAuthError('This account does not have admin access. Contact the site owner.');
            } else {
              setAuthError(null);
            }
          } else {
            setIsAdmin(false);
            setAuthError(null);
          }
        } catch (err) {
          console.error('[AdminAuth] onAuthStateChange handler threw:', err);
          setIsAdmin(false);
          setAuthError('Unexpected error verifying admin role. Please try again.');
        } finally {
          // CRITICAL: always clear loading, even if checkAdmin hangs or throws.
          setLoading(false);
          console.log('[AdminAuth] onAuthStateChange → loading cleared');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdmin]);

  const signIn = async (email: string, password: string) => {
    console.log('[AdminAuth] signIn → calling signInWithPassword for:', email);
    setLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[AdminAuth] signIn → signInWithPassword resolved | error:', error?.message ?? 'none');

    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    // loading is cleared by onAuthStateChange (guaranteed by try/finally above).
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAuthError(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, session, isAdmin, loading, authError, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
