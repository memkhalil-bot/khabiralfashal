import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AuthDebugOverlay } from '@/components/admin/AuthDebugOverlay';
import { recordRedirect } from '@/lib/adminAuthDebugLog';

function VerifyingSpinner() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-ember border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-xs tracking-[0.3em] uppercase">Verifying Access</p>
      </div>
    </div>
  );
}

function RoleCheckErrorScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-10 h-10 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center">
          <span className="text-amber-400 text-lg">!</span>
        </div>
        <div className="space-y-2">
          <p className="text-white/70 text-sm">Could not verify admin access</p>
          <p className="text-white/30 text-xs leading-relaxed">
            A temporary error occurred while checking your role. Your session is still valid.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-[10px] tracking-[0.3em] uppercase border border-white/10 text-white/50
                     hover:text-white/80 hover:border-white/20 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Wraps admin routes. Redirects to /admin/login only after auth state is
 * fully settled AND the outcome is definitively "not authenticated / not admin."
 *
 * Gate logic:
 *   - loading=true            → spinner (auth not yet resolved)
 *   - roleChecking=true       → spinner (DB query in-flight)
 *   - !sessionChecked         → spinner (INITIAL_SESSION not yet fired)
 *   - session exists but !roleChecked → spinner (role not yet determined)
 *   - roleCheckError=true     → role-check error screen (not a login redirect)
 *   - !user || !isAdmin       → redirect (definitive, settled result)
 *   - user && isAdmin         → render children
 */
export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const {
    user, isAdmin, loading, session,
    sessionChecked, roleChecked, roleChecking, roleCheckError,
    lastAuthEvent, lastRoleError, lastRoleCheckAt, tokenRefreshCount,
  } = useAdminAuth();
  const location = useLocation();

  // Auth is settled only when:
  // 1. loading is false
  // 2. INITIAL_SESSION has fired (sessionChecked)
  // 3. If there IS a session, role check has completed (roleChecked)
  const authSettled = !loading && sessionChecked && (!session || roleChecked);

  if (!authSettled || roleChecking) {
    return (
      <>
        <VerifyingSpinner />
        <AuthDebugOverlay />
      </>
    );
  }

  // Transient DB error with no prior admin status — do not redirect to login.
  if (roleCheckError) {
    return (
      <>
        <RoleCheckErrorScreen />
        <AuthDebugOverlay />
      </>
    );
  }

  if (!user || !isAdmin) {
    const reason = !user ? 'no-user' : 'not-admin';
    recordRedirect('ProtectedAdminRoute.tsx', {
      reason,
      route: location.pathname,
      user: user?.email ?? null,
      session: !!session,
      isAdmin,
      loading,
      roleChecked,
      sessionChecked,
      roleCheckError,
      lastAuthEvent,
      lastRoleError,
      lastRoleCheckAt: lastRoleCheckAt
        ? new Date(lastRoleCheckAt).toLocaleTimeString()
        : null,
      tokenRefreshCount,
    });
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
