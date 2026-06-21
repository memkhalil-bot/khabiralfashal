import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Flame, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Hard ceiling on the whole sign-in attempt (signInWithPassword + role check).
// Races against signIn() itself — must exceed useAdminAuth's own worst-case
// RPC retry budget (~13.5s) so a slow-but-successful check isn't cut off.
const SUBMIT_TIMEOUT_MS = 16_000;

const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log('[AdminLogin]', ...args);
};

export default function AdminLogin() {
  const { signIn, user, isAdmin, loading, authError } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  // ── Redirect when authenticated as admin ────────────────────────────────────
  useEffect(() => {
    if (!loading && user && isAdmin) {
      devLog('navigation start → /admin (user:', user.email, ')');
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  // ── Surface "not admin" error from context ──────────────────────────────────
  // BUG FIX: original code had `!submitting` in the condition, so the error
  // was never shown while the form was in the submitting state.
  useEffect(() => {
    if (!loading && authError) {
      devLog('authError effect →', authError);
      setError(authError);
      setSubmitting(false);
    }
  }, [authError, loading]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  //
  // signIn() always settles with a definitive { error } result (see
  // useAdminAuth.tsx), but as a hard backstop this races it against
  // SUBMIT_TIMEOUT_MS so the button can never be stuck on "Signing In…"
  // indefinitely, even if something upstream regresses.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    devLog('submit → calling signIn for:', email);

    const timeout = new Promise<{ error: string }>((resolve) => {
      setTimeout(() => {
        resolve({ error: 'Authentication is taking too long. Check your network connection and try again.' });
      }, SUBMIT_TIMEOUT_MS);
    });

    const { error: signInError } = await Promise.race([signIn(email, password), timeout]);
    devLog('submit settled → error:', signInError ?? 'none');

    if (signInError) {
      setError(signInError);
      setSubmitting(false);
      return;
    }

    // Success: the redirect effect above will navigate once isAdmin/user
    // are reflected in context (typically already true by this point).
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ember/4 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-12">
          <Flame className="size-5 text-ember" />
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-white font-medium">
              خبير الفشل
            </p>
            <p className="text-[9px] tracking-[0.25em] uppercase text-white/25 mt-0.5">
              Admin Access
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-serif-display text-white">
            Sign In
          </h1>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/35 mt-2">
            Restricted area — authorized personnel only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.3em] uppercase text-white/40">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="cinematic-input"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.3em] uppercase text-white/40">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                className="cinematic-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-800/30 rounded-lg"
            >
              <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-300 leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-3.5 bg-ember hover:bg-ember-dim text-[#fff] text-[11px] tracking-[0.3em] uppercase font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting || loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 border-2 border-[#fff] border-t-transparent rounded-full animate-spin" />
                Signing In…
              </span>
            ) : (
              'Enter Dashboard'
            )}
          </button>
        </form>

        {/* Back link */}
        <p className="mt-8 text-center text-[10px] tracking-[0.2em] uppercase text-white/20">
          <a href="/" className="hover:text-white/50 transition-colors">
            ← Back to site
          </a>
        </p>
      </motion.div>
    </div>
  );
}
