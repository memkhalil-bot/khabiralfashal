import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { motion } from 'framer-motion';
import {
  Workflow, Users, Activity, CheckCircle2, Package, CalendarPlus, CalendarDays,
  TrendingDown, Gauge, Award, Flame, Trophy, Minus, Sparkles, ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Funnel constants ──────────────────────────────────────────────────────────

const FUNNEL_STAGE_KEYS = ['visitors', 'started', 'completed', 'failKitRequests', 'sessionRequests', 'threeMonthPlans'] as const;
type FunnelStageKey = typeof FUNNEL_STAGE_KEYS[number];

const FUNNEL_STAGE_STYLES: Record<FunnelStageKey, { text: string; bar: string; icon: React.ElementType }> = {
  visitors:        { text: 'text-ember',      bar: 'bg-ember/20 border-ember/35',           icon: Users },
  started:         { text: 'text-sky-400',    bar: 'bg-sky-400/20 border-sky-400/35',       icon: Activity },
  completed:       { text: 'text-violet-400', bar: 'bg-violet-400/20 border-violet-400/35', icon: CheckCircle2 },
  failKitRequests: { text: 'text-amber-400',  bar: 'bg-amber-400/20 border-amber-400/35',   icon: Package },
  sessionRequests: { text: 'text-recovery',   bar: 'bg-recovery/20 border-recovery/35',     icon: CalendarPlus },
  threeMonthPlans: { text: 'text-orange-400', bar: 'bg-orange-400/20 border-orange-400/35', icon: CalendarDays },
};

// Services compared in the performance widgets below. "3-Month Plan" is
// excluded here — as established in AdminRevenue.tsx, no booking/report row
// anywhere references it, so ranking it would only produce a misleading
// "winner" with zero real orders behind it.
const SERVICE_KEYS = ['fail_kit', 'founder_call', 'emergency_session', 'startup_autopsy'] as const;
type ServiceKey = typeof SERVICE_KEYS[number];

function fmtPrice(val: number): string {
  return `$${val.toLocaleString()}`;
}

// ── Query (reuses existing tables only — no schema changes) ──────────────────

interface FunnelStage { key: FunnelStageKey; value: number | null; placeholder: boolean }
interface ServiceAgg  { key: ServiceKey; orders: number; paidOrders: number; revenue: number; conversionRate: number; hasData: boolean }

const PLACEHOLDER_FUNNEL: FunnelStage[] = FUNNEL_STAGE_KEYS.map((key) => ({
  key, value: null, placeholder: key === 'threeMonthPlans',
}));

function useWorkflowAnalytics() {
  return useQuery({
    queryKey: ['admin', 'workflow-analytics'],
    queryFn: async () => {
      const [visitorsRes, startedRes, completedRes, failKitsRes, bookingsRes, assessmentsRes] = await Promise.all([
        (supabase as any).from('valley_leads').select('id', { count: 'exact' }),
        (supabase as any).from('valley_leads').select('id', { count: 'exact' }).not('last_question_index', 'is', null),
        (supabase as any).from('valley_leads').select('id', { count: 'exact' }).eq('completed', true),
        (supabase as any).from('fail_kit_requests').select('id, payment_status, final_price'),
        (supabase as any).from('booking_requests').select('id, session_type, payment_status, final_price'),
        supabase.from('founder_assessments').select('risk_score'),
      ]);

      if (visitorsRes.error) throw visitorsRes.error;
      if (startedRes.error) throw startedRes.error;
      if (completedRes.error) throw completedRes.error;
      if (failKitsRes.error) throw failKitsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;

      const failKits    = (failKitsRes.data ?? []) as { payment_status: string | null; final_price: number | null }[];
      const bookings    = (bookingsRes.data ?? []) as { session_type: string | null; payment_status: string | null; final_price: number | null }[];
      const assessments = (assessmentsRes.data ?? []) as { risk_score: number | null }[];

      const funnel: FunnelStage[] = [
        { key: 'visitors',        value: visitorsRes.count ?? 0,  placeholder: false },
        { key: 'started',         value: startedRes.count ?? 0,   placeholder: false },
        { key: 'completed',       value: completedRes.count ?? 0, placeholder: false },
        { key: 'failKitRequests', value: failKits.length,         placeholder: false },
        { key: 'sessionRequests', value: bookings.length,         placeholder: false },
        { key: 'threeMonthPlans', value: null,                    placeholder: true  },
      ];

      const services: ServiceAgg[] = SERVICE_KEYS.map((key) => {
        const records = key === 'fail_kit' ? failKits : bookings.filter((b) => b.session_type === key);
        const paid    = records.filter((r) => r.payment_status === 'paid');
        const revenue = paid.reduce((acc, r) => acc + (r.final_price ?? 0), 0);
        return {
          key,
          orders:         records.length,
          paidOrders:     paid.length,
          revenue,
          conversionRate: records.length ? Math.round((paid.length / records.length) * 100) : 0,
          hasData:        records.length > 0,
        };
      });

      const avgRiskScore = assessments.length
        ? Math.round(assessments.reduce((acc, a) => acc + (a.risk_score ?? 0), 0) / assessments.length)
        : null;

      return { funnel, services, avgRiskScore };
    },
    staleTime: 60_000,
  });
}

// ── Drop-off derivation (pure — operates on the funnel counts above) ─────────

interface DropoffRow { fromKey: FunnelStageKey; toKey: FunnelStageKey; pct: number }

function computeDropoffs(funnel: FunnelStage[]): DropoffRow[] {
  const rows: DropoffRow[] = [];
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1];
    const curr = funnel[i];
    if (prev.placeholder || curr.placeholder || prev.value == null || curr.value == null || prev.value <= 0) continue;
    rows.push({ fromKey: prev.key, toKey: curr.key, pct: Math.max(0, Math.round(((prev.value - curr.value) / prev.value) * 100)) });
  }
  return rows;
}

// ── Valley Funnel ─────────────────────────────────────────────────────────────

function WorkflowFunnelSection({ funnel, loading }: { funnel: FunnelStage[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const ft = adminT.workflowAnalytics.funnel;

  const base   = funnel[0]?.value ?? 0;
  const maxVal = Math.max(...funnel.map((s) => s.value ?? 0), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10"
    >
      <p className="text-[9px] tracking-[0.2em] uppercase text-admin-text-muted/70 mb-5 font-arabic flex items-center gap-2">
        <Workflow className="size-3 text-admin-text-muted/50" />
        {ft.title}
      </p>

      <div className="space-y-2.5">
        {funnel.map((stage, i) => {
          const style      = FUNNEL_STAGE_STYLES[stage.key];
          const Icon       = style.icon;
          const value      = stage.value ?? 0;
          const widthPct   = loading || stage.placeholder ? 0 : Math.max(4, (value / maxVal) * 100);
          const conversion = !stage.placeholder && base > 0 ? Math.round((value / base) * 100) : null;

          return (
            <div key={stage.key} className="flex items-center gap-4">
              <p className="w-40 shrink-0 flex items-center gap-2 text-[11px] text-white/45 font-arabic truncate">
                <Icon className={cn('size-3.5 shrink-0', style.text)} />
                {ft[stage.key]}
              </p>
              <div className="flex-1 h-7 bg-white/4 rounded-md overflow-hidden">
                {!stage.placeholder && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.6, delay: 0.1 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                    className={cn('h-full rounded-md border', style.bar)}
                  />
                )}
              </div>
              <div className="w-36 shrink-0 flex items-center justify-end gap-2">
                {loading ? (
                  <span className="inline-block w-6 h-4 bg-white/6 rounded animate-pulse" />
                ) : stage.placeholder ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/4 border border-white/8 rounded-md">
                    <Sparkles className="size-3 text-admin-text-muted/50" />
                    <span className="text-[9px] text-admin-text-muted font-arabic">{ft.awaitingData}</span>
                  </span>
                ) : (
                  <>
                    <span className={cn('text-sm font-serif-display tabular-nums', style.text)}>{value}</span>
                    {conversion !== null && (
                      <span className="text-[9px] text-white/25 font-arabic tabular-nums">
                        {adminT.workflowAnalytics.conversionMetrics.conversion} {conversion}%
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Conversion metrics table ──────────────────────────────────────────────────

function ConversionMetricsTable({ funnel, dropoffs, loading }: { funnel: FunnelStage[]; dropoffs: DropoffRow[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const ft = adminT.workflowAnalytics.funnel;
  const cm = adminT.workflowAnalytics.conversionMetrics;
  const base = funnel[0]?.value ?? 0;
  const dropoffByTarget = new Map(dropoffs.map((d) => [d.toKey, d.pct]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10"
    >
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-4 font-arabic flex items-center gap-2">
        <Activity className="size-3 text-admin-text-muted/50" />
        {cm.title}
      </p>

      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="border-b border-admin-border text-[10px] uppercase tracking-[0.14em] text-admin-text-muted/60 font-arabic">
              <th className="text-start font-medium pb-2.5">{ft.title}</th>
              <th className="text-end font-medium pb-2.5">{cm.count}</th>
              <th className="text-end font-medium pb-2.5">{cm.conversion}</th>
              <th className="text-end font-medium pb-2.5">{cm.dropoff}</th>
            </tr>
          </thead>
          <tbody>
            {funnel.map((stage) => {
              const style      = FUNNEL_STAGE_STYLES[stage.key];
              const conversion = !stage.placeholder && base > 0 ? Math.round(((stage.value ?? 0) / base) * 100) : null;
              const dropoff    = dropoffByTarget.get(stage.key) ?? null;

              return (
                <tr key={stage.key} className="border-b border-admin-border/50 last:border-0">
                  <td className="py-2.5 text-[12px] text-admin-text font-arabic">{ft[stage.key]}</td>
                  <td className="py-2.5 text-end tabular-nums">
                    {loading ? (
                      <span className="inline-block w-7 h-3.5 bg-white/6 rounded animate-pulse ms-auto" />
                    ) : stage.placeholder ? (
                      <span className="text-admin-text-muted/40">—</span>
                    ) : (
                      <span className={cn('font-medium', style.text)}>{stage.value}</span>
                    )}
                  </td>
                  <td className="py-2.5 text-end tabular-nums text-[12px] text-admin-text-muted">
                    {loading ? '' : stage.placeholder || conversion === null ? <span className="text-admin-text-muted/40">—</span> : `${conversion}%`}
                  </td>
                  <td className="py-2.5 text-end tabular-nums text-[12px]">
                    {loading ? '' : dropoff === null ? (
                      <span className="text-admin-text-muted/40">—</span>
                    ) : (
                      <span className={dropoff > 40 ? 'text-crimson' : 'text-admin-text-muted'}>{dropoff}%</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── Drop-off analysis highlight ───────────────────────────────────────────────

function DropoffAnalysisCard({ dropoffs, loading }: { dropoffs: DropoffRow[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const da = adminT.workflowAnalytics.dropoffAnalysis;
  const ft = adminT.workflowAnalytics.funnel;

  const biggest = dropoffs.length ? dropoffs.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10 flex flex-col"
    >
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-4 font-arabic flex items-center gap-2">
        <TrendingDown className="size-3 text-admin-text-muted/50" />
        {da.title}
      </p>

      <div className="flex-1 flex items-center">
        {loading ? (
          <div className="w-full h-16 bg-white/4 rounded-lg animate-pulse" />
        ) : !biggest ? (
          <div className="flex items-center gap-2 text-admin-text-muted">
            <Minus className="size-3.5" />
            <span className="text-xs font-arabic">{da.noData}</span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center justify-center size-12 rounded-xl bg-crimson/10 text-crimson shrink-0">
              <ArrowDownRight className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1.5">{da.biggest}</p>
              <p className="text-[13px] font-arabic text-admin-text flex items-center gap-1.5 flex-wrap leading-snug">
                <span>{ft[biggest.fromKey]}</span>
                <span className="text-admin-text-muted/40">↓</span>
                <span>{ft[biggest.toKey]}</span>
              </p>
              <p className="text-[11px] text-crimson tabular-nums mt-1 font-arabic">{da.lost}: {biggest.pct}%</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Workflow performance widgets ──────────────────────────────────────────────

function WorkflowPerformanceWidgets({ services, dropoffs, avgRiskScore, loading }: {
  services:     ServiceAgg[];
  dropoffs:     DropoffRow[];
  avgRiskScore: number | null;
  loading:      boolean;
}) {
  const { t: adminT } = useAdminLanguage();
  const wp = adminT.workflowAnalytics.performance;
  const ft = adminT.workflowAnalytics.funnel;
  const serviceName = (key: ServiceKey) => adminT.revenue.serviceNames[key] ?? key;

  const withData          = services.filter((s) => s.hasData);
  const mostRequested     = withData.length ? withData.reduce((a, b) => (b.orders > a.orders ? b : a)) : null;
  const highestRevenue    = services.filter((s) => s.revenue > 0).sort((a, b) => b.revenue - a.revenue)[0] ?? null;
  const highestConversion = withData.length ? withData.reduce((a, b) => (b.conversionRate > a.conversionRate ? b : a)) : null;
  const biggestDropoff    = dropoffs.length ? dropoffs.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;

  const cards: { icon: React.ElementType; accent: string; label: string; content: JSX.Element | null }[] = [
    {
      icon: Flame, accent: 'text-amber-400', label: wp.mostRequested,
      content: mostRequested ? (
        <>
          <p className="text-base font-serif-display text-admin-text font-arabic truncate">{serviceName(mostRequested.key)}</p>
          <p className="text-[11px] text-admin-text-muted tabular-nums mt-1">{mostRequested.orders} {adminT.revenue.byService.orders.toLowerCase()}</p>
        </>
      ) : null,
    },
    {
      icon: Award, accent: 'text-recovery', label: wp.highestRevenue,
      content: highestRevenue ? (
        <>
          <p className="text-base font-serif-display text-admin-text font-arabic truncate">{serviceName(highestRevenue.key)}</p>
          <p className="text-[11px] text-admin-text-muted tabular-nums mt-1">{fmtPrice(highestRevenue.revenue)}</p>
        </>
      ) : null,
    },
    {
      icon: Trophy, accent: 'text-sky-400', label: wp.highestConversion,
      content: highestConversion ? (
        <>
          <p className="text-base font-serif-display text-admin-text font-arabic truncate">{serviceName(highestConversion.key)}</p>
          <p className="text-[11px] text-admin-text-muted tabular-nums mt-1">{highestConversion.conversionRate}%</p>
        </>
      ) : null,
    },
    {
      icon: TrendingDown, accent: 'text-crimson', label: wp.biggestDropoff,
      content: biggestDropoff ? (
        <p className="text-[12px] font-arabic text-admin-text leading-snug">
          {ft[biggestDropoff.fromKey]} <span className="text-admin-text-muted/40">↓</span> {ft[biggestDropoff.toKey]}
          <span className="block text-crimson tabular-nums mt-0.5">{adminT.workflowAnalytics.dropoffAnalysis.lost}: {biggestDropoff.pct}%</span>
        </p>
      ) : null,
    },
    {
      icon: Gauge, accent: 'text-violet-400', label: wp.avgRiskScore,
      content: avgRiskScore !== null ? (
        <p className="text-lg font-serif-display tabular-nums text-admin-text">
          {avgRiskScore}<span className="text-white/30 text-xs ml-0.5">/100</span>
        </p>
      ) : null,
    },
  ];

  return (
    <div className="mb-2">
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-3 font-arabic flex items-center gap-2">
        <Gauge className="size-3 text-admin-text-muted/50" />
        {wp.title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10 flex flex-col gap-3"
            >
              <span className={cn('inline-flex items-center justify-center size-9 rounded-xl bg-white/5 shrink-0', card.accent)}>
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1.5 truncate">{card.label}</p>
                {loading ? (
                  <span className="inline-block w-20 h-5 bg-white/6 rounded animate-pulse" />
                ) : card.content ?? (
                  <div className="flex items-center gap-2 text-admin-text-muted">
                    <Minus className="size-3.5" />
                    <span className="text-xs font-arabic">{wp.awaitingData}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminWorkflowAnalytics() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading } = useWorkflowAnalytics();

  const funnel       = data?.funnel ?? PLACEHOLDER_FUNNEL;
  const services     = data?.services ?? [];
  const avgRiskScore = data?.avgRiskScore ?? null;
  const dropoffs     = useMemo(() => computeDropoffs(funnel), [funnel]);

  return (
    <AdminLayout title={adminT.workflowAnalytics.title} subtitle={adminT.workflowAnalytics.subtitle}>
      <WorkflowFunnelSection funnel={funnel} loading={isLoading} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4 mb-8">
        <ConversionMetricsTable funnel={funnel} dropoffs={dropoffs} loading={isLoading} />
        <DropoffAnalysisCard dropoffs={dropoffs} loading={isLoading} />
      </div>

      <WorkflowPerformanceWidgets
        services={services}
        dropoffs={dropoffs}
        avgRiskScore={avgRiskScore}
        loading={isLoading}
      />
    </AdminLayout>
  );
}
