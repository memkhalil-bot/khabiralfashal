import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CheckAdminResult {
  isAdmin: boolean;
  /** true = network / timeout error; false = definitive DB answer */
  isError: boolean;
  errorDetail?: string;
}

export interface AdminAuthState {
  // ── Core auth ────────────────────────────────────────────────────────────────
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;

  // ── Gate flags used by ProtectedAdminRoute ──────────────────────────────────
  sessionChecked: boolean; // INITIAL_SESSION has fired
  roleChecked: boolean;    // checkAdmin completed (success or definitive failure)
  roleChecking: boolean;   // checkAdmin currently in-flight
  /** true when checkAdmin errored AND we had no prior isAdmin=true to fall back on */
  roleCheckError: boolean;

  // ── Debug telemetry ──────────────────────────────────────────────────────────
  lastAuthEvent: string | null;
  lastRoleError: string | null;
  lastRoleCheckAt: number | null;
  tokenRefreshCount: number;

  // ── Actions ──────────────────────────────────────────────────────────────────
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

// Per-attempt query timeout
const ROLE_CHECK_TIMEOUT_MS = 5_000;
// Retries on query errors before giving up
const MAX_RETRIES = 2;
// Delay between retries (multiplied by attempt number)
const RETRY_DELAY_MS = 1_500;

// ── Provider ───────────────────────────────────────────────────────────────────

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]             = useState<User | null>(null);
  const [session, setSession]       = useState<Session | null>(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [authError, setAuthError]   = useState<string | null>(null);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [roleChecked, setRoleChecked]       = useState(false);
  const [roleChecking, setRoleChecking]     = useState(false);
  const [roleCheckError, setRoleCheckError] = useState(false);

  const [lastAuthEvent, setLastAuthEvent]     = useState<string | null>(null);
  const [lastRoleError, setLastRoleError]     = useState<string | null>(null);
  const [lastRoleCheckAt, setLastRoleCheckAt] = useState<number | null>(null);
  const [tokenRefreshCount, setTokenRefreshCount] = useState(0);

  // Ref so async callbacks can read current isAdmin without stale closures.
  const isAdminRef = useRef(false);
  isAdminRef.current = isAdmin;

  // ── checkAdmin with retry + error / no-role distinction ──────────────────────
  const checkAdmin = useCallback(async (uid: string): Promise<CheckAdminResult> => {
    console.log('[AdminAuth] checkAdmin → uid:', uid);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAY_MS * attempt;
        console.log(`[AdminAuth] checkAdmin retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }

      const timeoutSignal = new Promise<'timeout'>(resolve =>
        setTimeout(() => resolve('timeout'), ROLE_CHECK_TIMEOUT_MS)
      );

      let result: unknown;
      try {
        result = await Promise.race([
          (supabase as any)
            .from('user_roles')
            .select('role')
            .eq('user_id', uid)
            .eq('role', 'admin')
            .maybeSingle(),
          timeoutSignal,
        ]);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.error(`[AdminAuth] checkAdmin attempt ${attempt} threw:`, detail);
        if (attempt < MAX_RETRIES) continue;
        return { isAdmin: false, isError: true, errorDetail: `threw: ${detail}` };
      }

      if (result === 'timeout') {
        console.warn(`[AdminAuth] checkAdmin attempt ${attempt} timed out after ${ROLE_CHECK_TIMEOUT_MS}ms`);
        if (attempt < MAX_RETRIES) continue;
        return { isAdmin: false, isError: true, errorDetail: 'timeout' };
      }

      const { data, error } = result as {
        data: unknown;
        error: { message: string; code: string } | null;
      };

      if (error) {
        console.error(`[AdminAuth] checkAdmin attempt ${attempt} query error:`, error.code, error.message);
        if (attempt < MAX_RETRIES) continue;
        return { isAdmin: false, isError: true, errorDetail: `${error.code}: ${error.message}` };
      }

      // Definitive answer from the DB
      const adminResult = data !== null;
      console.log(`[AdminAuth] checkAdmin attempt ${attempt} → isAdmin=${adminResult}`);
      return { isAdmin: adminResult, isError: false };
    }

    return { isAdmin: false, isError: true, errorDetail: 'exceeded retries' };
  }, []);

  // ── Single auth listener — no separate getSession() call ─────────────────────
  //
  // Using onAuthStateChange alone eliminates the race condition where both
  // getSession() and INITIAL_SESSION would call checkAdmin() concurrently and
  // the last-to-resolve would overwrite isAdmin (potentially with an error result).
  //
  // Event handling strategy:
  //   TOKEN_REFRESHED / USER_UPDATED → JWT rotated, role unchanged. Skip checkAdmin.
  //   SIGNED_OUT                     → clear all state immediately.
  //   INITIAL_SESSION / SIGNED_IN    → full role check with retry.
  //     - isError=true AND had prior isAdmin=true → preserve access (avoid spurious kick)
  //     - isError=true AND isAdmin was false      → roleCheckError=true (show error, not login redirect)
  //     - isError=false                           → use the definitive DB result
  //
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setLastAuthEvent(_event);
        console.log('[AdminAuth] event:', _event, '| user:', newSession?.user?.email ?? 'none',
          '| current isAdmin:', isAdminRef.current);

        // ── Fast path: token rotation does not change admin role ──────────────
        if (_event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (_event === 'TOKEN_REFRESHED') setTokenRefreshCount(c => c + 1);
          setLoading(false);
          console.log('[AdminAuth] TOKEN_REFRESHED — skipping role re-check, isAdmin preserved:', isAdminRef.current);
          return;
        }

        // ── Signed out ────────────────────────────────────────────────────────
        if (!newSession?.user) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          isAdminRef.current = false;
          setAuthError(null);
          setRoleCheckError(false);
          setSessionChecked(true);
          setRoleChecked(true);
          setRoleChecking(false);
          setLoading(false);
          console.log('[AdminAuth] SIGNED_OUT — all auth state cleared');
          return;
        }

        // ── INITIAL_SESSION / SIGNED_IN: full role check ──────────────────────
        //
        // loading=true gates ProtectedAdminRoute into the spinner state so it
        // cannot redirect while the DB query is in-flight.
        setLoading(true);
        setRoleChecking(true);
        setSession(newSession);
        setUser(newSession.user);
        setSessionChecked(true);

        console.log('[AdminAuth] running checkAdmin for event:', _event, '(prevIsAdmin:', isAdminRef.current, ')');
        const { isAdmin: adminResult, isError, errorDetail } = await checkAdmin(newSession.user.id);
        setLastRoleCheckAt(Date.now());

        if (isError) {
          const errMsg = `Role verification failed (${errorDetail ?? 'unknown error'}). `;
          setLastRoleError(errMsg + (new Date().toLocaleTimeString()));

          if (isAdminRef.current === true) {
            // User was already an authenticated admin — preserve their access.
            // A transient DB error must never kick out an active session.
            console.warn('[AdminAuth] checkAdmin error — preserving existing isAdmin=true for uid:', newSession.user.id);
            // isAdmin state intentionally not changed
          } else {
            // No prior confirmed admin status — cannot grant access.
            // Show roleCheckError screen instead of redirecting to login.
            console.error('[AdminAuth] checkAdmin error on initial check — cannot verify admin status');
            setRoleCheckError(true);
          }
        } else {
          // Definitive DB result
          setRoleCheckError(false);
          setLastRoleError(null);
          setIsAdmin(adminResult);
          isAdminRef.current = adminResult;
          if (!adminResult) {
            const msg = 'This account does not have admin access. Contact the site owner.';
            setAuthError(msg);
            console.warn('[AdminAuth] no admin role for uid:', newSession.user.id);
          } else {
            setAuthError(null);
          }
        }

        setRoleChecked(true);
        setRoleChecking(false);
        setLoading(false);
        console.log('[AdminAuth] event', _event, 'settled — isAdmin:', isAdminRef.current,
          'isError:', isError, 'roleCheckError:', isError && !isAdminRef.current);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdmin]);

  // ── signIn ────────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    console.log('[AdminAuth] signIn →', email);
    setLoading(true);
    setAuthError(null);
    setRoleChecked(false);
    setSessionChecked(false);
    setRoleCheckError(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }
    // loading cleared by SIGNED_IN event above
    return { error: null };
  };

  // ── signOut ───────────────────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    // SIGNED_OUT event will clean up the rest; these are immediate safeguards.
    setIsAdmin(false);
    isAdminRef.current = false;
    setAuthError(null);
  };

  const value: AdminAuthState = {
    user, session, isAdmin, loading, authError,
    sessionChecked, roleChecked, roleChecking, roleCheckError,
    lastAuthEvent, lastRoleError, lastRoleCheckAt, tokenRefreshCount,
    signIn, signOut,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
