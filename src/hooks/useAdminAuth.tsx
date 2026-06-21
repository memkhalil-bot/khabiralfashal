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
import { recordSignOutCall } from '@/lib/adminAuthDebugLog';

// ── Types ─────────────────────────────────────────────────────────────

interface CheckAdminResult {
  isAdmin: boolean;
  /** true = network / timeout error; false = definitive DB answer */
  isError: boolean;
  errorDetail?: string;
}

export interface AdminAuthState {
  // ── Core auth ──────────────────────────────────────────────
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;

  // ── Gate flags used by ProtectedAdminRoute ────────────────────────────────
  sessionChecked: boolean; // INITIAL_SESSION has fired
  roleChecked: boolean;    // checkAdmin completed (success or definitive failure)
  roleChecking: boolean;   // checkAdmin currently in-flight
  /** true when checkAdmin errored AND we had no prior isAdmin=true to fall back on */
  roleCheckError: boolean;
  /** non-blocking: role check failed but a cached/prior admin result kept access alive */
  staleRoleWarning: string | null;

  // ── Debug telemetry ────────────────────────────────────────────────
  lastAuthEvent: string | null;
  lastRoleError: string | null;
  lastRoleCheckAt: number | null;
  tokenRefreshCount: number;

  // ── Actions ───────────────────────────────────────────────────────
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

// Per-attempt RPC timeout. The RPC (is_current_user_admin) is a single
// SECURITY DEFINER lookup keyed on auth.uid() — it should resolve in well
// under a second. This timeout is a safety net for genuine network stalls,
// not a substitute for a fast query.
const ROLE_CHECK_TIMEOUT_MS = 6_000;
// Retries on query errors before giving up
const MAX_RETRIES = 1;
// Delay between retries (multiplied by attempt number)
const RETRY_DELAY_MS = 1_500;

// Known admin account — trusted immediately on sign-in so the login screen
// never blocks waiting on the RPC. The RPC check still runs (for protected
// route gating and cache population) but cannot block this account's access.
const TRUSTED_ADMIN_EMAIL = 'admin@khabiralfashal.com';

// Dev-only step logging — no-ops in production builds.
const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log('[AdminAuth]', ...args);
};
const devWarn = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.warn('[AdminAuth]', ...args);
};
const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error('[AdminAuth]', ...args);
};

// In-memory cache of confirmed admin results for the active browser session.
// Keyed by user id. Populated on a definitive "is admin" RPC result, cleared
// on a definitive "not admin" result. Used as a fallback when a later role
// check errors/times out, so a transient DB blip never kicks out a session
// that was already confirmed admin.
const adminRoleCache = new Map<string, boolean>();

// ── Provider ──────────────────────────────────────────────────────

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
  const [staleRoleWarning, setStaleRoleWarning] = useState<string | null>(null);

  const [lastAuthEvent, setLastAuthEvent]     = useState<string | null>(null);
  const [lastRoleError, setLastRoleError]     = useState<string | null>(null);
  const [lastRoleCheckAt, setLastRoleCheckAt] = useState<number | null>(null);
  const [tokenRefreshCount, setTokenRefreshCount] = useState(0);

  // Ref so async callbacks can read current isAdmin without stale closures.
  const isAdminRef = useRef(false);
  isAdminRef.current = isAdmin;

  // Same reason as isAdminRef: the onAuthStateChange closure below is created
  // once (its effect deps never change) so it would otherwise see roleChecked
  // frozen at its initial `false` value forever.
  const roleCheckedRef = useRef(false);
  roleCheckedRef.current = roleChecked;

  // Set while signIn() is driving its own explicit role check, so the
  // onAuthStateChange SIGNED_IN handler doesn't run a second, redundant
  // (and potentially racy) check for the same login.
  const signInInProgressRef = useRef(false);

  // ── checkAdmin: calls the is_current_user_admin() RPC, with retry ─────────
  //
  // This replaces the old `.from('user_roles').select(...)` query, which was
  // timing out repeatedly in production and cascading into login/dashboard
  // redirect loops. The RPC runs server-side with SECURITY DEFINER against
  // auth.uid(), so it needs no client-supplied user id and returns a single
  // boolean.
  const checkAdmin = useCallback(async (): Promise<CheckAdminResult> => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_DELAY_MS * attempt;
        devLog(`rpc retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }

      devLog(`rpc start → is_current_user_admin (attempt ${attempt})`);
      const timeoutSignal = new Promise<'timeout'>(resolve =>
        setTimeout(() => resolve('timeout'), ROLE_CHECK_TIMEOUT_MS)
      );

      let result: unknown;
      try {
        result = await Promise.race([
          supabase.rpc('is_current_user_admin'),
          timeoutSignal,
        ]);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        devError(`rpc failure (attempt ${attempt}):`, detail);
        if (attempt < MAX_RETRIES) continue;
        return { isAdmin: false, isError: true, errorDetail: `threw: ${detail}` };
      }

      if (result === 'timeout') {
        devWarn(`rpc timeout (attempt ${attempt}) after ${ROLE_CHECK_TIMEOUT_MS}ms`);
        if (attempt < MAX_RETRIES) continue;
        return { isAdmin: false, isError: true, errorDetail: 'timeout' };
      }

      const { data, error } = result as {
        data: boolean | null;
        error: { message: string; code: string } | null;
      };

      if (error) {
        devError(`rpc failure (attempt ${attempt}):`, error.code, error.message);
        if (attempt < MAX_RETRIES) continue;
        return { isAdmin: false, isError: true, errorDetail: `${error.code}: ${error.message}` };
      }

      devLog(`rpc success (attempt ${attempt}) → isAdmin=${data === true}`);
      return { isAdmin: data === true, isError: false };
    }

    return { isAdmin: false, isError: true, errorDetail: 'exceeded retries' };
  }, []);

  // ── runRoleCheck: shared by the auth listener and signIn() ─────────────
  //
  // Outcomes:
  //   - RPC succeeds                    → definitive result, cache it
  //   - RPC fails AND cache has uid=true → keep admin access, show warning
  //   - RPC fails AND isAdmin was true   → keep admin access, show warning
  //   - RPC fails AND no prior admin     → roleCheckError (error screen, not redirect)
  const runRoleCheck = useCallback(async (uid: string, eventLabel: string): Promise<CheckAdminResult> => {
    devLog('role check start for event:', eventLabel, '(prevIsAdmin:', isAdminRef.current, ')');
    const { isAdmin: adminResult, isError, errorDetail } = await checkAdmin();
    setLastRoleCheckAt(Date.now());

    if (isError) {
      const errMsg = `Role verification failed (${errorDetail ?? 'unknown error'}). `;
      setLastRoleError(errMsg + new Date().toLocaleTimeString());

      const cached = adminRoleCache.get(uid);
      if (cached === true) {
        devWarn('cached admin used — rpc failed, falling back to cached role for uid:', uid);
        setIsAdmin(true);
        isAdminRef.current = true;
        setRoleCheckError(false);
        setStaleRoleWarning(`Role check failed (${errorDetail}); using cached admin status.`);
      } else if (isAdminRef.current === true) {
        devWarn('rpc failed — preserving existing isAdmin=true for uid:', uid);
        setStaleRoleWarning(`Role check failed (${errorDetail}); preserving existing session.`);
      } else {
        devError('rpc failed on initial check — cannot verify admin status');
        setRoleCheckError(true);
      }
    } else {
      setRoleCheckError(false);
      setLastRoleError(null);
      setStaleRoleWarning(null);
      setIsAdmin(adminResult);
      isAdminRef.current = adminResult;
      if (adminResult) {
        adminRoleCache.set(uid, true);
        setAuthError(null);
      } else {
        adminRoleCache.delete(uid);
        setAuthError('This account does not have admin access. Contact the site owner.');
        devWarn('no admin role for uid:', uid);
      }
    }

    setRoleChecked(true);
    setRoleChecking(false);
    devLog('role check for', eventLabel, 'settled — isAdmin:', isAdminRef.current, 'isError:', isError);
    return { isAdmin: adminResult, isError, errorDetail };
  }, [checkAdmin]);

  // ── Single auth listener — no separate getSession() call ─────────────
  //
  // Using onAuthStateChange alone eliminates the race condition where both
  // getSession() and INITIAL_SESSION would call checkAdmin() concurrently and
  // the last-to-resolve would overwrite isAdmin (potentially with an error result).
  //
  // Event handling strategy:
  //   TOKEN_REFRESHED / USER_UPDATED → JWT rotated, role unchanged. Skip checkAdmin.
  //   SIGNED_OUT                     → clear all state immediately.
  //   SIGNED_IN (from signIn())      → role check already run explicitly by signIn(); skip.
  //   First verification this session → full, blocking role check.
  //   Re-fired event after admin access already confirmed (e.g. Supabase
  //     re-emitting SIGNED_IN/INITIAL_SESSION on tab refocus) → background
  //     revalidation only. loading/roleChecking are NOT touched, otherwise
  //     ProtectedAdminRoute would flash back to "Verifying Access" for a
  //     session that was already granted.
  //
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setLastAuthEvent(_event);
        devLog('event:', _event, '| user:', newSession?.user?.email ?? 'none',
          '| current isAdmin:', isAdminRef.current);
        devLog('session', newSession ? 'found' : 'missing', '| user id:', newSession?.user?.id ?? 'none');

        // ── Fast path: token rotation does not change admin role ────────────
        if (_event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          if (_event === 'TOKEN_REFRESHED') setTokenRefreshCount(c => c + 1);
          setLoading(false);
          devLog('TOKEN_REFRESHED — skipping role re-check, isAdmin preserved:', isAdminRef.current);
          return;
        }

        // ── Signed out ─────────────────────────────────────────
        if (!newSession?.user) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          isAdminRef.current = false;
          setAuthError(null);
          setRoleCheckError(false);
          setStaleRoleWarning(null);
          setSessionChecked(true);
          setRoleChecked(true);
          setRoleChecking(false);
          setLoading(false);
          devLog('SIGNED_OUT — all auth state cleared');
          return;
        }

        // ── signIn() is already running its own explicit role check ──────────
        if (_event === 'SIGNED_IN' && signInInProgressRef.current) {
          setSession(newSession);
          setUser(newSession.user);
          setSessionChecked(true);
          devLog('SIGNED_IN — skipping duplicate role check (handled by signIn())');
          return;
        }

        setSession(newSession);
        setUser(newSession.user);
        setSessionChecked(true);

        // ── Revalidation: admin access was already confirmed this session ────
        //
        // Run the RPC in the background without blocking the UI. Failures are
        // already handled non-destructively by runRoleCheck (cache/ref
        // fallback + staleRoleWarning), so a timeout here cannot send the user
        // back to "Verifying Access".
        if (roleCheckedRef.current && isAdminRef.current) {
          const revalidatingEmail = newSession.user.email;
          devLog('revalidation started (event:', _event, ') — admin already granted, not blocking UI');
          void runRoleCheck(newSession.user.id, `${_event}_BACKGROUND_REVALIDATE`).then(result => {
            if (revalidatingEmail === TRUSTED_ADMIN_EMAIL && !result.isAdmin) {
              devWarn('trusted admin email — keeping access stable despite revalidation result');
              setIsAdmin(true);
              isAdminRef.current = true;
              adminRoleCache.set(newSession.user.id, true);
              setAuthError(null);
              setRoleCheckError(false);
            }
            devLog('revalidation result (event:', _event, ') — isAdmin:', result.isAdmin, 'isError:', result.isError);
          });
          return;
        }

        // ── First verification this session: full, blocking role check ─────
        //
        // loading=true gates ProtectedAdminRoute into the spinner state so it
        // cannot redirect while the RPC is in-flight.
        devLog('admin access not yet confirmed — running blocking role check (event:', _event, ')');
        setLoading(true);
        setRoleChecking(true);
        await runRoleCheck(newSession.user.id, _event);
        setLoading(false);
        devLog('admin access check settled (event:', _event, ') — isAdmin:', isAdminRef.current);
      }
    );

    return () => subscription.unsubscribe();
  }, [runRoleCheck]);

  // ── signIn ───────────────────────────────────────────────────────
  //
  // Does not wait on onAuthStateChange to determine admin status: once
  // signInWithPassword succeeds, it runs the role-check RPC directly and
  // resolves as soon as that completes, so the login screen isn't blocked
  // on an event that might be delayed or never fire.
  //
  // Trusted-admin fast path: the fixed admin@khabiralfashal.com account is
  // granted access immediately on a successful sign-in, without waiting on
  // the RPC. The RPC still runs in the background (cache + telemetry), but
  // it can no longer block this account's login. Any other account still
  // goes through the full RPC-gated check below, bounded by checkAdmin's
  // own timeout/retry budget, and signIn() always settles with a definitive
  // error string on failure (bad credentials, RPC failure, or non-admin).
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    devLog('signIn start →', email);
    setLoading(true);
    setAuthError(null);
    setRoleChecked(false);
    setSessionChecked(false);
    setRoleCheckError(false);
    setStaleRoleWarning(null);

    signInInProgressRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        devError('signIn failure:', error.message);
        setLoading(false);
        return { error: error.message };
      }

      const signedInUser = data.user;
      if (!signedInUser || !data.session) {
        devError('signIn failure: session missing after sign-in');
        setLoading(false);
        return { error: 'Sign in succeeded but no session was returned.' };
      }
      devLog('signIn success →', signedInUser.email, '| session found');

      setSession(data.session);
      setUser(signedInUser);
      setSessionChecked(true);

      if (signedInUser.email === TRUSTED_ADMIN_EMAIL) {
        devLog('trusted admin email matched — granting access without waiting on RPC');
        setIsAdmin(true);
        isAdminRef.current = true;
        adminRoleCache.set(signedInUser.id, true);
        setAuthError(null);
        setRoleCheckError(false);
        setRoleChecked(true);
        setRoleChecking(false);
        setLoading(false);
        // Fire-and-forget: keeps the RPC check + cache alive for protected
        // routes without blocking this login.
        void runRoleCheck(signedInUser.id, 'SIGN_IN_BACKGROUND_CONFIRM');
        return { error: null };
      }

      setRoleChecking(true);
      devLog('rpc start (explicit, blocking login) for', signedInUser.email);
      const result = await runRoleCheck(signedInUser.id, 'SIGN_IN_EXPLICIT');
      setLoading(false);

      if (result.isError) {
        devError('rpc failure on sign-in:', result.errorDetail);
        return { error: `Could not verify admin access (${result.errorDetail ?? 'unknown error'}). Please try again.` };
      }
      if (!result.isAdmin) {
        devWarn('signIn: account is not an admin');
        return { error: 'This account does not have admin access. Contact the site owner.' };
      }
      devLog('rpc success on sign-in — admin confirmed');
      return { error: null };
    } finally {
      signInInProgressRef.current = false;
    }
  };

  // ── signOut ───────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    recordSignOutCall('useAdminAuth.tsx:signOut');
    if (user) adminRoleCache.delete(user.id);
    await supabase.auth.signOut();
    // SIGNED_OUT event will clean up the rest; these are immediate safeguards.
    setIsAdmin(false);
    isAdminRef.current = false;
    setAuthError(null);
  };

  const value: AdminAuthState = {
    user, session, isAdmin, loading, authError,
    sessionChecked, roleChecked, roleChecking, roleCheckError, staleRoleWarning,
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
