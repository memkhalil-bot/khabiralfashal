import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import {
  Users,
  MessageSquareQuote,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// ── Queries ──────────────────────────────────────────────────────────────────

function useStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const [assessmentsRes, testimonialsRes, recentRes] = await Promise.all([
        supabase.from('founder_assessments').select('id, risk_score, risk_level, created_at', { count: 'exact' }),
        supabase.from('testimonials').select('id, published', { count: 'exact' }),
        supabase
          .from('founder_assessments')
          .select('id, name, email, company, risk_score, risk_level, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const assessments = assessmentsRes.data ?? [];
      const testimonials = testimonialsRes.data ?? [];

      const avgRisk =
        assessments.length > 0
          ? Math.round(assessments.reduce((acc, a) => acc + a.risk_score, 0) / assessments.length)
          : 0;

      const highRisk = assessments.filter(
        (a) => a.risk_level === 'COLLAPSE PROXIMITY' || a.risk_level === 'INSIDE THE VALLEY'
      ).length;

      return {
        totalSubmissions: assessmentsRes.count ?? 0,
        totalTestimonials: testimonialsRes.count ?? 0,
        publishedTestimonials: testimonials.filter((t) => t.published).length,
        avgRisk,
        highRisk,
        recent: recentRes.data ?? [],
      };
    },
    staleTime: 60_000,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const riskColors: Record<string, string> = {
  STABLE: 'text-emerald-400',
  EXPOSED: 'text-yellow-400',
  'INSIDE THE VALLEY': 'text-orange-400',
  'COLLAPSE PROXIMITY': 'text-red-400',
};

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-white/30">—</span>;
  return (
    <span className={`text-[10px] tracking-[0.15em] uppercase font-medium ${riskColors[level] ?? 'text-white/60'}`}>
      {level}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data, isLoading, error } = useStats();

  const stats = [
    {
      label: 'Total Submissions',
      value: data?.totalSubmissions ?? '—',
      icon: Users,
      to: '/admin/submissions',
      accent: 'text-ember',
    },
    {
      label: 'Avg Risk Score',
      value: data ? `${data.avgRisk}%` : '—',
      icon: TrendingUp,
      to: '/admin/submissions',
      accent: 'text-yellow-400',
    },
    {
      label: 'High Risk Founders',
      value: data?.highRisk ?? '—',
      icon: AlertTriangle,
      to: '/admin/submissions',
      accent: 'text-red-400',
    },
    {
      label: 'Published Testimonials',
      value: data ? `${data.publishedTestimonials} / ${data.totalTestimonials}` : '—',
      icon: MessageSquareQuote,
      to: '/admin/testimonials',
      accent: 'text-sky-400',
    },
  ];

  return (
    <AdminLayout title="Overview" subtitle="Khabir Al Fashal — Admin">

      {error && (
        <div className="mb-6 p-4 bg-red-950/30 border border-red-800/30 rounded-lg text-red-300 text-sm">
          <strong>Access error:</strong> Make sure you've applied the admin migration in Supabase
          and added your user ID to the <code className="font-mono text-xs bg-red-900/30 px-1 rounded">user_roles</code> table.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={s.to}
                className="block p-5 bg-[#0d0d0d] border border-white/6 rounded-xl hover:border-white/12 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className={`size-5 ${s.accent}`} />
                  <ArrowRight className="size-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                </div>
                <div className={`text-3xl font-serif-display ${s.accent} mb-1`}>
                  {isLoading ? (
                    <span className="inline-block w-12 h-7 bg-white/8 rounded animate-pulse" />
                  ) : (
                    s.value
                  )}
                </div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/35">{s.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent submissions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#0d0d0d] border border-white/6 rounded-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Activity className="size-4 text-ember" />
            <h2 className="text-[11px] tracking-[0.25em] uppercase text-white/60">
              Recent Submissions
            </h2>
          </div>
          <Link
            to="/admin/submissions"
            className="text-[10px] tracking-[0.2em] uppercase text-ember/60 hover:text-ember transition-colors"
          >
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-white/4 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.recent.length ? (
          <div className="px-6 py-12 text-center">
            <p className="text-white/25 text-sm">No submissions yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.recent.map((row) => (
              <Link
                key={row.id}
                to={`/admin/submissions?id=${row.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">
                    {row.name ?? row.email}
                  </p>
                  {row.company && (
                    <p className="text-[11px] text-white/35 truncate">{row.company}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-white/70">
                    {row.risk_score}
                    <span className="text-white/30 text-xs ml-0.5">/100</span>
                  </p>
                  <RiskBadge level={row.risk_level} />
                </div>
                <div className="text-right shrink-0 text-[10px] text-white/25 hidden sm:block">
                  {format(new Date(row.created_at), 'MMM d')}
                </div>
                <ArrowRight className="size-3.5 text-white/15 group-hover:text-ember/60 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
