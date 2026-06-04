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
  CalendarClock,
  Bell,
  DollarSign,
  CalendarDays,
  Skull,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isPast, isToday, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

// ── Queries ──────────────────────────────────────────────────────────────────

function useStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const [assessmentsRes, testimonialsRes, recentRes, sessionsRes, followUpsRes] = await Promise.all([
        supabase.from('founder_assessments').select('id, risk_score, risk_level, created_at', { count: 'exact' }),
        supabase.from('testimonials').select('id, published', { count: 'exact' }),
        supabase
          .from('founder_assessments')
          .select('id, name, email, company, risk_score, risk_level, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('advisory_sessions')
          .select('id, founder_name, company, session_type, scheduled_at, status')
          .in('status', ['pending', 'confirmed'])
          .order('scheduled_at', { ascending: true, nullsFirst: false })
          .limit(4),
        supabase
          .from('follow_ups')
          .select('id, title, founder_name, priority, due_date, status')
          .eq('status', 'pending')
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(4),
      ]);

      const assessments = assessmentsRes.data ?? [];
      const testimonials = testimonialsRes.data ?? [];

      const avgRisk =
        assessments.length > 0
          ? Math.round(assessments.reduce((acc, a) => acc + (a.risk_score ?? 0), 0) / assessments.length)
          : 0;

      const highRisk = assessments.filter(
        (a) => a.risk_level === 'COLLAPSE PROXIMITY' || a.risk_level === 'INSIDE THE VALLEY'
      ).length;

      const monthStart = startOfMonth(new Date()).toISOString();

      const [
        activeSessionsRes,
        pendingFollowUpsRes,
        paidSessionsRes,
        sessionsThisMonthRes,
        highRiskRes,
        criticalRes,
      ] = await Promise.all([
        supabase.from('advisory_sessions').select('id', { count: 'exact' }).in('status', ['pending', 'confirmed']),
        supabase.from('follow_ups').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('advisory_sessions').select('session_value').eq('payment_status', 'paid'),
        supabase.from('advisory_sessions').select('id', { count: 'exact' }).gte('created_at', monthStart),
        supabase.from('founder_assessments').select('id', { count: 'exact' }).eq('risk_level', 'INSIDE THE VALLEY'),
        supabase.from('founder_assessments').select('id', { count: 'exact' }).eq('risk_level', 'COLLAPSE PROXIMITY'),
      ]);

      const totalRevenue = (paidSessionsRes.data ?? []).reduce(
        (sum, s) => sum + (s.session_value ?? 0),
        0
      );

      return {
        totalSubmissions: assessmentsRes.count ?? 0,
        totalTestimonials: testimonialsRes.count ?? 0,
        publishedTestimonials: testimonials.filter((t) => t.published).length,
        avgRisk,
        highRisk,
        activeSessions: activeSessionsRes.count ?? 0,
        pendingFollowUps: pendingFollowUpsRes.count ?? 0,
        totalRevenue,
        sessionsThisMonth: sessionsThisMonthRes.count ?? 0,
        highRiskCases: highRiskRes.count ?? 0,
        criticalCases: criticalRes.count ?? 0,
        recent: recentRes.data ?? [],
        upcomingSessions: sessionsRes.data ?? [],
        pendingFollowUpsList: followUpsRes.data ?? [],
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

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-white/25 text-xs">—</span>;
  const styles: Record<string, string> = {
    initial:   'bg-sky-950/30 text-sky-400 border-sky-800/30',
    followup:  'bg-violet-950/30 text-violet-400 border-violet-800/30',
    intensive: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
    emergency: 'bg-red-950/30 text-red-400 border-red-800/30',
  };
  const style = styles[type] ?? 'bg-white/8 text-white/50 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] tracking-[0.1em] uppercase font-medium border ${style}`}>
      {type}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
  const styles: Record<string, string> = {
    urgent: 'bg-red-950/30 text-red-400 border-red-800/30',
    high:   'bg-orange-950/30 text-orange-400 border-orange-800/30',
    medium: 'bg-yellow-950/30 text-yellow-400 border-yellow-800/30',
    low:    'bg-white/5 text-white/35 border-white/8',
  };
  const style = styles[priority] ?? 'bg-white/5 text-white/35 border-white/8';
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] tracking-[0.1em] uppercase font-medium border ${style}`}>
      {priority}
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
      to: '/admin/founders',
      accent: 'text-ember',
    },
    {
      label: 'Avg Risk Score',
      value: data ? `${data.avgRisk}%` : '—',
      icon: TrendingUp,
      to: '/admin/founders',
      accent: 'text-yellow-400',
    },
    {
      label: 'High Risk Founders',
      value: data?.highRisk ?? '—',
      icon: AlertTriangle,
      to: '/admin/founders',
      accent: 'text-red-400',
    },
    {
      label: 'Published Testimonials',
      value: data ? `${data.publishedTestimonials} / ${data.totalTestimonials}` : '—',
      icon: MessageSquareQuote,
      to: '/admin/testimonials',
      accent: 'text-sky-400',
    },
    {
      label: 'Active Sessions',
      value: data?.activeSessions ?? '—',
      icon: CalendarClock,
      to: '/admin/sessions',
      accent: 'text-sky-400',
    },
    {
      label: 'Pending Follow-ups',
      value: data?.pendingFollowUps ?? '—',
      icon: Bell,
      to: '/admin/follow-ups',
      accent: 'text-violet-400',
    },
    {
      label: 'Total Revenue',
      value: data ? `$${data.totalRevenue.toLocaleString()}` : '—',
      icon: DollarSign,
      to: '/admin/sessions',
      accent: 'text-emerald-400',
    },
    {
      label: 'Sessions This Month',
      value: data?.sessionsThisMonth ?? '—',
      icon: CalendarDays,
      to: '/admin/sessions',
      accent: 'text-sky-300',
    },
    {
      label: 'High-Risk Cases',
      value: data?.highRiskCases ?? '—',
      icon: AlertTriangle,
      to: '/admin/founders',
      accent: 'text-orange-400',
    },
    {
      label: 'Critical Cases',
      value: data?.criticalCases ?? '—',
      icon: Skull,
      to: '/admin/founders',
      accent: 'text-red-500',
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

      {/* Stat cards — 2×3 on xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
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

      {/* Panels row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent submissions — spans 1 col on xl */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                    <p className="text-sm text-white/80 truncate">{row.name ?? row.email}</p>
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
                    {row.created_at && format(new Date(row.created_at), 'MMM d')}
                  </div>
                  <ArrowRight className="size-3.5 text-white/15 group-hover:text-ember/60 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0d0d0d] border border-white/6 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4 text-sky-400" />
              <h2 className="text-[11px] tracking-[0.25em] uppercase text-white/60">
                Upcoming Sessions
              </h2>
            </div>
            <Link
              to="/admin/sessions"
              className="text-[10px] tracking-[0.2em] uppercase text-ember/60 hover:text-ember transition-colors"
            >
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-white/4 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.upcomingSessions.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-white/25 text-sm">No upcoming sessions.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.upcomingSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{s.founder_name}</p>
                    {s.company && (
                      <p className="text-[11px] text-white/35 truncate">{s.company}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <TypeBadge type={s.session_type} />
                    {s.scheduled_at && (
                      <p className="text-[10px] text-white/25 block">
                        {format(new Date(s.scheduled_at), 'MMM d, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Follow-ups */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.50, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0d0d0d] border border-white/6 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Bell className="size-4 text-violet-400" />
              <h2 className="text-[11px] tracking-[0.25em] uppercase text-white/60">
                Pending Follow-ups
              </h2>
            </div>
            <Link
              to="/admin/follow-ups"
              className="text-[10px] tracking-[0.2em] uppercase text-ember/60 hover:text-ember transition-colors"
            >
              View all →
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-white/4 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.pendingFollowUpsList.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-white/25 text-sm">No pending follow-ups.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.pendingFollowUpsList.map((f) => {
                const isOverdue = !!f.due_date && isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date));
                return (
                  <div key={f.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{f.title}</p>
                      {f.founder_name && (
                        <p className="text-[11px] text-white/35 truncate">{f.founder_name}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <PriorityBadge priority={f.priority} />
                      {f.due_date && (
                        <p className={cn('text-[10px] block', isOverdue ? 'text-red-400' : 'text-white/25')}>
                          {format(new Date(f.due_date), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
}
