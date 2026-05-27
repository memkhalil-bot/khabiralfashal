import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/**
 * Wraps any admin route — redirects to /admin/login if:
 * - Not authenticated, OR
 * - Authenticated but not in the admin role
 */
export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-ember border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase">Verifying Access</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
