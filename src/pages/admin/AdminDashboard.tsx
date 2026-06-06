import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminT } from '@/i18n/adminTranslations';
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
  CalendarDays,
  Skull,
  CalendarPlus,
  Inbox,
  ChevronLeft,
  ChevronRight,
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
        sessionsThisMonthRes,
        highRiskRes,
        criticalRes,
        totalBookingsRes,
        pendingBookingsRes,
        scheduledBookingsRes,
        completedBookingsRes,
        recentBookingsRes,
        valleyTotalRes,
        valleyCompletedRes,
        valleyAbandonedRes,
        reportPendingRes,
        recentReportQueueRes,
      ] = await Promise.all([
        supabase.from('advisory_sessions').select('id', { count: 'exact' }).in('status', ['pending', 'confirmed']),
        supabase.from('follow_ups').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('advisory_sessions').select('id', { count: 'exact' }).gte('created_at', monthStart),
        supabase.from('founder_assessments').select('id', { count: 'exact' }).eq('risk_level', 'INSIDE THE VALLEY'),
        supabase.from('founder_assessments').select('id', { count: 'exact' }).eq('risk_level', 'COLLAPSE PROXIMITY'),
        (supabase as any).from('booking_requests').select('id', { count: 'exact' }),
        (supabase as any).from('booking_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        (supabase as any).from('booking_requests').select('id', { count: 'exact' }).eq('status', 'scheduled'),
        (supabase as any).from('booking_requests').select('id', { count: 'exact' }).eq('status', 'completed'),
        (supabase as any)
          .from('booking_requests')
          .select('id, full_name, email, session_type, status, created_at')
          .order('created_at', { ascending: false })
          .limit(4),
        (supabase as any).from('valley_leads').select('id', { count: 'exact' }),
        (supabase as any).from('valley_leads').select('id', { count: 'exact' }).eq('completed', true),
        (supabase as any).from('valley_leads').select('id', { count: 'exact' }).eq('completed', false),
        (supabase as any).from('report_requests').select('id', { count: 'exact' }).eq('workflow_status', 'pending_review'),
        (supabase as any)
          .from('report_requests')
          .select('id, full_name, company, workflow_status, created_at')
          .order('created_at', { ascending: false })
          .limit(4),
      ]);

      return {
        totalSubmissions:    assessmentsRes.count ?? 0,
        totalTestimonials:   testimonialsRes.count ?? 0,
        publishedTestimonials: testimonials.filter((t) => t.published).length,
        avgRisk,
        highRisk,
        activeSessions:      activeSessionsRes.count ?? 0,
        pendingFollowUps:    pendingFollowUpsRes.count ?? 0,
        sessionsThisMonth:   sessionsThisMonthRes.count ?? 0,
        highRiskCases:       highRiskRes.count ?? 0,
        criticalCases:       criticalRes.count ?? 0,
        totalBookings:       totalBookingsRes.count ?? 0,
        pendingBookings:     pendingBookingsRes.count ?? 0,
        scheduledBookings:   scheduledBookingsRes.count ?? 0,
        completedBookings:   completedBookingsRes.count ?? 0,
        valleyTotal:         valleyTotalRes.count ?? 0,
        valleyCompleted:     valleyCompletedRes.count ?? 0,
        valleyAbandoned:     valleyAbandonedRes.count ?? 0,
        reportPending:       reportPendingRes.count ?? 0,
        recent:              recentRes.data ?? [],
        upcomingSessions:    sessionsRes.data ?? [],
        pendingFollowUpsList: followUpsRes.data ?? [],
        recentBookings:      recentBookingsRes.data ?? [],
        recentReportQueue:   recentReportQueueRes.data ?? [],
      };
    },
    staleTime: 60_000,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const riskColors: Record<string, string> = {
  STABLE:               'text-recovery',
  EXPOSED:              'text-yellow-400',
  'INSIDE THE VALLEY':  'text-orange-400',
  'COLLAPSE PROXIMITY': 'text-crimson',
};

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-white/30">—</span>;
  const label = adminT.risk[level] ?? level;
  return (
    <span className={`text-[10px] font-medium font-arabic ${riskColors[level] ?? 'text-white/60'}`}>
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-white/25 text-xs">—</span>;
  const styles: Record<string, string> = {
    initial:   'bg-sky-950/30 text-sky-400 border-sky-800/30',
    followup:  'bg-violet-950/30 text-violet-400 border-violet-800/30',
    intensive: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
    emergency: 'bg-crimson/10 text-crimson border-crimson/25',
  };
  const style = styles[type] ?? 'bg-white/8 text-white/50 border-white/10';
  const label = adminT.sessions.types[type] ?? type;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic ${style}`}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
  const styles: Record<string, string> = {
    urgent: 'bg-crimson/10 text-crimson border-crimson/25',
    high:   'bg-orange-950/30 text-orange-400 border-orange-800/30',
    medium: 'bg-yellow-950/30 text-yellow-400 border-yellow-800/30',
    low:    'bg-white/5 text-white/35 border-white/8',
  };
  const style = styles[priority] ?? 'bg-white/5 text-white/35 border-white/8';
  const label = adminT.followUps.priority[priority] ?? priority;
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border font-arabic ${style}`}>
      {label}
    </span>
  );
}

function WorkflowBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const styles: Record<string, string> = {
    pending_review: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
    draft_ready:    'bg-sky-950/30 text-sky-400 border-sky-800/30',
    approved:       'bg-violet-950/30 text-violet-400 border-violet-800/30',
    scheduled:      'bg-recovery/10 text-recovery border-recovery/25',
    sent:           'bg-white/5 text-white/35 border-white/8',
    rejected:       'bg-crimson/10 text-crimson border-crimson/25',
  };
  const style = styles[status] ?? 'bg-white/5 text-white/35 border-white/8';
  const label = adminT.reportQueue?.workflowStatus?.[status] ?? status;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic ${style}`}>
      {label}
    </span>
  );
}

// ── Valley Funnel Strip ───────────────────────────────────────────────────────

function FunnelStrip({ data, loading }: { data: ReturnType<typeof useStats>['data']; loading: boolean }) {
  const steps = [
    {
      label: adminT.dashboard.funnel.entries,
      value: data?.valleyTotal,
      color: 'text-ember',
      bg: 'bg-ember/8',
      border: 'border-ember/15',
    },
    {
      label: adminT.dashboard.funnel.completed,
      value: data?.valleyCompleted,
      color: 'text-sky-400',
      bg: 'bg-sky-400/8',
      border: 'border-sky-400/15',
    },
    {
      label: adminT.dashboard.funnel.reportRequests,
      value: data?.reportPending,
      color: 'text-violet-400',
      bg: 'bg-violet-400/8',
      border: 'border-violet-400/15',
    },
    {
      label: adminT.dashboard.funnel.completedSessions,
      value: data?.completedBookings,
      color: 'text-recovery',
      bg: 'bg-recovery/8',
      border: 'border-recovery/15',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 p-1 bg-[#161b22] border border-white/6 rounded-xl"
    >
      <div className="flex items-center">
        <div className="flex-1 px-4 py-2">
          <p className="text-[9px] tracking-[0.2em] uppercase text-white/25 mb-3 pr-1">
            {adminT.dashboard.funnel.title}
          </p>
          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className={`flex-1 px-4 py-3 rounded-lg ${step.bg} border ${step.border}`}>
                  <div className={`text-2xl font-serif-display tabular-nums ${step.color} mb-0.5`}>
                    {loading ? (
                      <span className="inline-block w-8 h-6 bg-white/6 rounded animate-pulse" />
                    ) : (
                      step.value ?? 0
                    )}
                  </div>
                  <p className="text-[10px] text-white/40 font-arabic">{step.label}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronLeft className="size-4 text-white/15 shrink-0 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data, isLoading, error } = useStats();

  const stats = [
    {
      label: adminT.dashboard.stats.valleyEntries,
      value: data?.valleyTotal ?? '—',
      icon: TrendingUp,
      to: '/admin/valley-leads',
      accent: 'text-ember',
    },
    {
      label: adminT.dashboard.stats.completedDiagnostics,
      value: data?.valleyCompleted ?? '—',
      icon: Activity,
      to: '/admin/valley-leads',
      accent: 'text-sky-400',
    },
    {
      label: adminT.dashboard.stats.abandonedLeads,
      value: data?.valleyAbandoned ?? '—',
      icon: AlertTriangle,
      to: '/admin/valley-leads',
      accent: 'text-amber-400',
    },
    {
      label: adminT.dashboard.stats.reportRequestsPending,
      value: data?.reportPending ?? '—',
      icon: Inbox,
      to: '/admin/report-queue',
      accent: 'text-violet-400',
    },
    {
      label: adminT.dashboard.stats.activeSessions,
      value: data?.activeSessions ?? '—',
      icon: CalendarClock,
      to: '/admin/sessions',
      accent: 'text-sky-300',
    },
    {
      label: adminT.dashboard.stats.pendingFollowUps,
      value: data?.pendingFollowUps ?? '—',
      icon: Bell,
      to: '/admin/follow-ups',
      accent: 'text-violet-400',
    },
    {
      label: adminT.dashboard.stats.totalBookings,
      value: data?.totalBookings ?? '—',
      icon: CalendarPlus,
      to: '/admin/bookings',
      accent: 'text-ember',
    },
    {
      label: adminT.dashboard.stats.pendingBookings,
      value: data?.pendingBookings ?? '—',
      icon: CalendarPlus,
      to: '/admin/bookings',
      accent: 'text-amber-400',
    },
    {
      label: adminT.dashboard.stats.scheduledBookings,
      value: data?.scheduledBookings ?? '—',
      icon: CalendarDays,
      to: '/admin/bookings',
      accent: 'text-recovery',
    },
    {
      label: adminT.dashboard.stats.highRiskCases,
      value: data?.highRiskCases ?? '—',
      icon: AlertTriangle,
      to: '/admin/founders',
      accent: 'text-orange-400',
    },
    {
      label: adminT.dashboard.stats.criticalCases,
      value: data?.criticalCases ?? '—',
      icon: Skull,
      to: '/admin/founders',
      accent: 'text-crimson',
    },
    {
      label: adminT.dashboard.stats.publishedTestimonials,
      value: data ? `${data.publishedTestimonials} / ${data.totalTestimonials}` : '—',
      icon: MessageSquareQuote,
      to: '/admin/testimonials',
      accent: 'text-white/50',
    },
  ];

  return (
    <AdminLayout title={adminT.dashboard.title} subtitle={adminT.dashboard.subtitle}>

      {error && (
        <div className="mb-6 p-4 bg-crimson/10 border border-crimson/25 rounded-lg text-crimson text-sm font-arabic">
          <strong>{adminT.common.error}:</strong> تأكد من تطبيق ترحيل قاعدة البيانات وإضافة معرّف المستخدم في جدول{' '}
          <code className="font-mono text-xs bg-crimson/15 px-1 rounded">user_roles</code>
        </div>
      )}

      {/* Valley Funnel Strip */}
      <FunnelStrip data={data} loading={isLoading} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={s.to}
                className="block p-5 bg-[#161b22] border border-white/6 rounded-xl hover:border-white/12 hover:bg-[#1c2128] transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className={`size-4 ${s.accent}`} />
                  <ChevronLeft className="size-3 text-white/12 group-hover:text-white/30 transition-colors" />
                </div>
                <div className={`text-2xl font-serif-display ${s.accent} mb-1 tabular-nums`}>
                  {isLoading ? (
                    <span className="inline-block w-10 h-6 bg-white/6 rounded animate-pulse" />
                  ) : (
                    s.value
                  )}
                </div>
                <p className="text-[10px] text-white/35 font-arabic">{s.label}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Panels row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Recent submissions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.30, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#161b22] border border-white/6 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Activity className="size-4 text-ember" />
              <h2 className="text-[11px] text-white/60 font-arabic">
                {adminT.dashboard.panels.recentSubmissions}
              </h2>
            </div>
            <Link to="/admin/founders" className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-arabic flex items-center gap-1">
              {adminT.common.viewAll}
              <ChevronLeft className="size-3" />
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
              <p className="text-white/25 text-sm font-arabic">{adminT.dashboard.empty.submissions}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.recent.map((row) => (
                <Link
                  key={row.id}
                  to={`/admin/submissions?id=${row.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{row.name ?? row.email}</p>
                    {row.company && (
                      <p className="text-[11px] text-white/35 truncate">{row.company}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-white/70">
                      {row.risk_score}<span className="text-white/30 text-xs ml-0.5">/100</span>
                    </p>
                    <RiskBadge level={row.risk_level} />
                  </div>
                  <ArrowRight className="size-3.5 text-white/12 group-hover:text-white/40 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Report Queue */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#161b22] border border-white/6 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Inbox className="size-4 text-violet-400" />
              <h2 className="text-[11px] text-white/60 font-arabic">
                {adminT.dashboard.panels.reportQueue}
              </h2>
            </div>
            <Link to="/admin/report-queue" className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-arabic flex items-center gap-1">
              {adminT.common.viewAll}
              <ChevronLeft className="size-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-white/4 rounded animate-pulse" />
              ))}
            </div>
          ) : !data?.recentReportQueue?.length ? (
            <div className="px-6 py-12 text-center">
              <p className="text-white/25 text-sm font-arabic">{adminT.dashboard.empty.reportQueue}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.recentReportQueue.map((r: any) => (
                <Link
                  key={r.id}
                  to="/admin/report-queue"
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate font-arabic">{r.full_name}</p>
                    {r.company && (
                      <p className="text-[11px] text-white/35 truncate font-arabic">{r.company}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <WorkflowBadge status={r.workflow_status} />
                    {r.created_at && (
                      <p className="text-[10px] text-white/25 block">
                        {format(new Date(r.created_at), 'MMM d')}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="size-3.5 text-white/12 group-hover:text-white/40 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#161b22] border border-white/6 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4 text-sky-400" />
              <h2 className="text-[11px] text-white/60 font-arabic">
                {adminT.dashboard.panels.upcomingSessions}
              </h2>
            </div>
            <Link to="/admin/sessions" className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-arabic flex items-center gap-1">
              {adminT.common.viewAll}
              <ChevronLeft className="size-3" />
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
              <p className="text-white/25 text-sm font-arabic">{adminT.dashboard.empty.sessions}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.upcomingSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-6 py-3.5">
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
          transition={{ delay: 0.42, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#161b22] border border-white/6 rounded-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <Bell className="size-4 text-violet-400" />
              <h2 className="text-[11px] text-white/60 font-arabic">
                {adminT.dashboard.panels.pendingFollowUps}
              </h2>
            </div>
            <Link to="/admin/follow-ups" className="text-[10px] text-white/30 hover:text-white/60 transition-colors font-arabic flex items-center gap-1">
              {adminT.common.viewAll}
              <ChevronLeft className="size-3" />
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
              <p className="text-white/25 text-sm font-arabic">{adminT.dashboard.empty.followUps}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.pendingFollowUpsList.map((f) => {
                const isOverdue = !!f.due_date && isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date));
                return (
                  <div key={f.id} className="flex items-center gap-4 px-6 py-3.5">
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
