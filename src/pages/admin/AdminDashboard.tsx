import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
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
  Zap,
  Tag,
  Target,
  CheckCircle2,
  Package,
  PackageCheck,
  Gauge,
  DollarSign,
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
        sessionsThisWeekRes,
        promoExpiringRes,
        retargetingRes,
        startedAssessmentRes,
        bookingRevenueRes,
        reportRevenueRes,
        failKitRes,
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
        // New: sessions this week
        (supabase as any)
          .from('advisory_sessions')
          .select('id', { count: 'exact' })
          .gte('scheduled_at', new Date().toISOString())
          .lte('scheduled_at', new Date(Date.now() + 7 * 86400000).toISOString()),
        // New: promo codes expiring within 7 days
        (supabase as any)
          .from('promo_codes')
          .select('id', { count: 'exact' })
          .eq('active', true)
          .gte('ends_at', new Date().toISOString())
          .lte('ends_at', new Date(Date.now() + 7 * 86400000).toISOString()),
        // New: leads for retargeting (completed valley, no action taken)
        (supabase as any)
          .from('valley_leads')
          .select('id', { count: 'exact' })
          .eq('completed', true)
          .eq('requested_report', false)
          .eq('requested_session', false),
        // New: leads who started answering the assessment (KPI / funnel)
        (supabase as any)
          .from('valley_leads')
          .select('id', { count: 'exact' })
          .not('last_question_index', 'is', null),
        // New: paid revenue — bookings + reports (KPI)
        (supabase as any)
          .from('booking_requests')
          .select('final_price')
          .eq('payment_status', 'paid'),
        (supabase as any)
          .from('report_requests')
          .select('final_price')
          .eq('payment_status', 'paid'),
        // New: fail kit requests (KPI source — Sprint 3A)
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, email, status, risk_score, payment_status, final_price, price'),
      ]);

      const revenueTotal = [
        ...((bookingRevenueRes.data ?? []) as { final_price: number | null }[]),
        ...((reportRevenueRes.data ?? []) as { final_price: number | null }[]),
      ].reduce((acc, r) => acc + (r.final_price ?? 0), 0);

      // ── Fail Kit derived stats ──────────────────────────────────────────────
      const failKitRequests = (failKitRes.data ?? []) as {
        email: string; status: string; risk_score: number | null;
        payment_status: string; final_price: number | null; price: number;
      }[];

      const failKitTotal = failKitRequests.length;
      const failKitDelivered = failKitRequests.filter((r) =>
        ['delivered', 'follow_up', 'closed'].includes(r.status)
      ).length;
      const failKitRevenue = failKitRequests
        .filter((r) => r.payment_status === 'paid')
        .reduce((acc, r) => acc + (r.final_price ?? r.price ?? 0), 0);
      const failKitRiskScores = failKitRequests
        .map((r) => r.risk_score)
        .filter((n): n is number => typeof n === 'number');
      const failKitAvgRisk = failKitRiskScores.length
        ? Math.round(failKitRiskScores.reduce((a, b) => a + b, 0) / failKitRiskScores.length)
        : 0;

      // Conversion: % of fail-kit emails that also appear in booking_requests
      const failKitEmails = Array.from(
        new Set(failKitRequests.map((r) => r.email?.toLowerCase()).filter(Boolean))
      ) as string[];

      const failKitSessionMatchRes = failKitEmails.length
        ? await (supabase as any).from('booking_requests').select('email').in('email', failKitEmails)
        : { data: [] as { email: string }[] };

      const failKitSessionMatches = new Set(
        ((failKitSessionMatchRes.data ?? []) as { email: string }[])
          .map((r) => r.email?.toLowerCase())
          .filter(Boolean)
      );
      const failKitToSessionPct = failKitEmails.length
        ? Math.round((failKitSessionMatches.size / failKitEmails.length) * 100)
        : 0;

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
        sessionsThisWeek:    sessionsThisWeekRes.count ?? 0,
        promoCodesExpiring:  promoExpiringRes.count ?? 0,
        retargetingLeads:    retargetingRes.count ?? 0,
        startedAssessment:   startedAssessmentRes.count ?? 0,
        revenueTotal,
        failKitTotal,
        failKitDelivered,
        failKitRevenue,
        failKitAvgRisk,
        failKitToSessionPct,
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
  const { t: adminT } = useAdminLanguage();
  if (!level) return <span className="text-white/30">—</span>;
  const label = adminT.risk[level] ?? level;
  return (
    <span className={`text-[10px] font-medium font-arabic ${riskColors[level] ?? 'text-white/60'}`}>
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: string | null }) {
  const { t: adminT } = useAdminLanguage();
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
  const { t: adminT } = useAdminLanguage();
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
  const { t: adminT } = useAdminLanguage();
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

// ── KPI Card ──────────────────────────────────────────────────────────────────
// Structure: Icon → Value → Label → Trend (a relative-magnitude bar derived
// from the real values in the group — no fabricated deltas, since the
// underlying stats query carries no historical comparison data).

interface KpiDef {
  label:        string;
  value:        number | null | undefined;
  icon:         React.ElementType;
  accent:       string;
  isCurrency?:  boolean;
  isPercent?:   boolean;
  placeholder?: boolean;
}

function KpiCard({
  kpi, index, loading, maxValue, placeholderHint,
}: {
  kpi:             KpiDef;
  index:           number;
  loading:         boolean;
  maxValue:        number;
  placeholderHint: string;
}) {
  const Icon = kpi.icon;
  const trendPct = !kpi.placeholder && maxValue > 0
    ? Math.max(4, Math.round(((kpi.value ?? 0) / maxValue) * 100))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10 flex flex-col gap-4"
    >
      <span className={cn('inline-flex items-center justify-center size-9 rounded-xl bg-white/5 shrink-0', kpi.accent)}>
        <Icon className="size-4.5" />
      </span>

      <div className="min-w-0">
        <div className="text-2xl font-serif-display tabular-nums text-admin-text leading-tight">
          {loading ? (
            <span className="inline-block w-12 h-6 bg-white/6 rounded animate-pulse" />
          ) : kpi.placeholder ? (
            '—'
          ) : kpi.isCurrency ? (
            `$${(kpi.value ?? 0).toLocaleString()}`
          ) : kpi.isPercent ? (
            `${kpi.value ?? 0}%`
          ) : (
            kpi.value ?? 0
          )}
        </div>
        <p className="text-[11px] text-admin-text-muted font-arabic leading-snug mt-1.5 truncate">{kpi.label}</p>

        {kpi.placeholder && !loading ? (
          <p className="text-[9px] text-admin-text-muted/60 font-arabic mt-2">{placeholderHint}</p>
        ) : (
          <div className="h-1 mt-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: loading ? 0 : `${trendPct}%` }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={cn('h-full rounded-full', kpi.accent.replace('text-', 'bg-'))}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function KpiGrid({
  title, titleIcon: TitleIcon, kpis, loading, placeholderHint, columns,
}: {
  title:            string;
  titleIcon?:       React.ElementType;
  kpis:             KpiDef[];
  loading:          boolean;
  placeholderHint:  string;
  columns:          string;
}) {
  const maxValue = Math.max(...kpis.filter((k) => !k.placeholder).map((k) => k.value ?? 0), 1);

  return (
    <div className="mb-6">
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-3 font-arabic flex items-center gap-2">
        {TitleIcon && <TitleIcon className="size-3 text-admin-text-muted/50" />}
        {title}
      </p>
      <div className={cn('grid gap-3', columns)}>
        {kpis.map((k, i) => (
          <KpiCard key={k.label} kpi={k} index={i} loading={loading} maxValue={maxValue} placeholderHint={placeholderHint} />
        ))}
      </div>
    </div>
  );
}

// ── KPI Row ───────────────────────────────────────────────────────────────────

function KpiRow({ data, loading }: { data: ReturnType<typeof useStats>['data']; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const kpis: KpiDef[] = [
    { label: adminT.dashboard.kpi.valleyVisitors,      value: data?.valleyTotal,       icon: TrendingUp,   accent: 'text-ember' },
    { label: adminT.dashboard.kpi.startedAssessment,   value: data?.startedAssessment, icon: Activity,     accent: 'text-sky-400' },
    { label: adminT.dashboard.kpi.completedAssessment, value: data?.valleyCompleted,   icon: CheckCircle2, accent: 'text-violet-400' },
    { label: adminT.dashboard.kpi.failKitRequests,     value: data?.failKitTotal,      icon: Package,      accent: 'text-amber-400' },
    { label: adminT.dashboard.kpi.sessionRequests,     value: data?.totalBookings,     icon: CalendarPlus, accent: 'text-recovery' },
    { label: adminT.dashboard.kpi.threeMonthPlans,     value: null,                    icon: CalendarDays, accent: 'text-orange-400', placeholder: true },
    { label: adminT.dashboard.kpi.revenue,             value: data?.revenueTotal,      icon: DollarSign,   accent: 'text-recovery',   isCurrency: true },
  ];

  return (
    <KpiGrid
      title={adminT.dashboard.kpi.title}
      kpis={kpis}
      loading={loading}
      placeholderHint={adminT.dashboard.kpi.placeholderHint}
      columns="grid-cols-2 sm:grid-cols-4 xl:grid-cols-7"
    />
  );
}

// ── Fail Kit KPI Row ──────────────────────────────────────────────────────────

function FailKitKpiSection({ data, loading }: { data: ReturnType<typeof useStats>['data']; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const kpis: KpiDef[] = [
    { label: adminT.dashboard.kpi.failKitRequests,  value: data?.failKitTotal,        icon: Package,      accent: 'text-amber-400' },
    { label: adminT.dashboard.kpi.failKitDelivered, value: data?.failKitDelivered,    icon: PackageCheck, accent: 'text-recovery' },
    { label: adminT.dashboard.kpi.failKitRevenue,   value: data?.failKitRevenue,      icon: DollarSign,   accent: 'text-recovery',  isCurrency: true },
    { label: adminT.dashboard.kpi.failKitAvgRisk,   value: data?.failKitAvgRisk,      icon: Gauge,        accent: 'text-crimson' },
    { label: adminT.dashboard.kpi.failKitToSession, value: data?.failKitToSessionPct, icon: TrendingUp,   accent: 'text-sky-400',   isPercent: true },
    { label: adminT.dashboard.kpi.failKitToPlan,    value: null,                      icon: CalendarDays, accent: 'text-orange-400', placeholder: true },
  ];

  return (
    <KpiGrid
      title={adminT.failKit.title}
      titleIcon={Package}
      kpis={kpis}
      loading={loading}
      placeholderHint={adminT.dashboard.kpi.placeholderHint}
      columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
    />
  );
}

// ── Valley Funnel ─────────────────────────────────────────────────────────────

const FUNNEL_STAGE_STYLES = [
  { text: 'text-ember',      bar: 'bg-ember/20 border-ember/35' },
  { text: 'text-sky-400',    bar: 'bg-sky-400/20 border-sky-400/35' },
  { text: 'text-violet-400', bar: 'bg-violet-400/20 border-violet-400/35' },
  { text: 'text-amber-400',  bar: 'bg-amber-400/20 border-amber-400/35' },
  { text: 'text-recovery',   bar: 'bg-recovery/20 border-recovery/35' },
  { text: 'text-orange-400', bar: 'bg-orange-400/20 border-orange-400/35' },
];

function FunnelSection({ data, loading }: { data: ReturnType<typeof useStats>['data']; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const stages = [
    { label: adminT.dashboard.funnel.visitors,        value: data?.valleyTotal,       placeholder: false },
    { label: adminT.dashboard.funnel.started,         value: data?.startedAssessment, placeholder: false },
    { label: adminT.dashboard.funnel.completed,       value: data?.valleyCompleted,   placeholder: false },
    { label: adminT.dashboard.funnel.failKitRequests, value: data?.failKitTotal,      placeholder: false },
    { label: adminT.dashboard.funnel.sessionRequests, value: data?.totalBookings,     placeholder: false },
    { label: adminT.dashboard.funnel.threeMonthPlans, value: 0,                       placeholder: true  },
  ];

  const base   = stages[0].value ?? 0;
  const maxVal = Math.max(...stages.map((s) => s.value ?? 0), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10"
    >
      <p className="text-[9px] tracking-[0.2em] uppercase text-admin-text-muted/70 mb-5 font-arabic">
        {adminT.dashboard.funnel.title}
      </p>

      <div className="space-y-2.5">
        {stages.map((stage, i) => {
          const style      = FUNNEL_STAGE_STYLES[i];
          const value      = stage.value ?? 0;
          const widthPct   = loading ? 0 : Math.max(4, (value / maxVal) * 100);
          const conversion = base > 0 ? Math.round((value / base) * 100) : 0;
          const prevValue  = i > 0 ? (stages[i - 1].value ?? 0) : null;
          const dropoff    = prevValue !== null && prevValue > 0
            ? Math.round(((prevValue - value) / prevValue) * 100)
            : null;

          return (
            <div key={stage.label}>
              {i > 0 && dropoff !== null && (
                <div className="flex items-center gap-1.5 pr-1 mb-1.5 ml-[9.5rem]">
                  <span className="text-[9px] text-white/15">↓</span>
                  <span className={cn('text-[9px] font-arabic', dropoff > 40 ? 'text-crimson/70' : 'text-white/25')}>
                    {adminT.dashboard.funnel.dropoff} {dropoff}%
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <p className="w-36 shrink-0 text-[11px] text-white/45 font-arabic truncate">{stage.label}</p>
                <div className="flex-1 h-7 bg-white/4 rounded-md overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className={cn('h-full rounded-md border', style.bar)}
                  />
                </div>
                <div className="w-32 shrink-0 flex items-center justify-end gap-2">
                  <span className={cn('text-sm font-serif-display tabular-nums', style.text)}>
                    {loading ? (
                      <span className="inline-block w-6 h-4 bg-white/6 rounded animate-pulse" />
                    ) : stage.placeholder ? (
                      '—'
                    ) : (
                      value
                    )}
                  </span>
                  {!stage.placeholder && !loading && (
                    <span className="text-[9px] text-white/25 font-arabic tabular-nums">
                      {adminT.dashboard.funnel.conversion} {conversion}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading, error } = useStats();

  const stats = [
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
    {
      label: adminT.dashboard.stats.sessionsThisWeek,
      value: data?.sessionsThisWeek ?? '—',
      icon: CalendarDays,
      to: '/admin/sessions',
      accent: 'text-sky-300',
    },
    {
      label: adminT.dashboard.stats.promoCodesExpiring,
      value: data?.promoCodesExpiring ?? '—',
      icon: Tag,
      to: '/admin/promo-codes',
      accent: 'text-amber-400',
    },
    {
      label: adminT.dashboard.stats.retargetingLeads,
      value: data?.retargetingLeads ?? '—',
      icon: Target,
      to: '/admin/retargeting',
      accent: 'text-violet-400',
    },
  ];

  const quickLinks = [
    { label: adminT.nav.actionCenter, to: '/admin/action-center', icon: Zap,          accent: 'text-ember'      },
    { label: adminT.nav.reportQueue,  to: '/admin/report-queue',  icon: Inbox,        accent: 'text-violet-400' },
    { label: adminT.nav.valleyLeads,  to: '/admin/valley-leads',  icon: TrendingUp,   accent: 'text-sky-400'    },
    { label: adminT.nav.bookings,     to: '/admin/bookings',      icon: CalendarPlus, accent: 'text-amber-400'  },
    { label: adminT.nav.revenue,      to: '/admin/revenue',       icon: Activity,     accent: 'text-recovery'   },
    { label: adminT.nav.retargeting,  to: '/admin/retargeting',   icon: Target,       accent: 'text-violet-400' },
  ];

  return (
    <AdminLayout title={adminT.dashboard.title} subtitle={adminT.dashboard.subtitle}>

      {error && (
        <div className="mb-6 p-4 bg-crimson/10 border border-crimson/25 rounded-lg text-crimson text-sm font-arabic">
          <strong>{adminT.common.error}:</strong> {adminT.dashboard.errorHint}{' '}
          <code className="font-mono text-xs bg-crimson/15 px-1 rounded">user_roles</code>
        </div>
      )}

      {/* KPI row */}
      <KpiRow data={data} loading={isLoading} />

      {/* Fail Kit KPI row */}
      <FailKitKpiSection data={data} loading={isLoading} />

      {/* Valley Funnel */}
      <FunnelSection data={data} loading={isLoading} />

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
                className="block p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10 hover:border-white/12 hover:bg-admin-card-hover transition-all duration-200 group"
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
          className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden shadow-sm shadow-black/10"
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
          className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden shadow-sm shadow-black/10"
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
          className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden shadow-sm shadow-black/10"
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
          className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden shadow-sm shadow-black/10"
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

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6"
      >
        <p className="text-[9px] tracking-[0.22em] uppercase text-white/20 mb-3 font-arabic">
          روابط سريعة
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          {quickLinks.map((ql) => {
            const Icon = ql.icon;
            return (
              <Link
                key={ql.to}
                to={ql.to}
                className="flex items-center gap-2 px-3 py-2.5 bg-admin-card border border-admin-border rounded-lg hover:border-white/12 hover:bg-admin-card-hover transition-all duration-200 group"
              >
                <Icon className={`size-3.5 shrink-0 ${ql.accent}`} />
                <span className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors font-arabic truncate">{ql.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </AdminLayout>
  );
}
