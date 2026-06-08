import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { KpiCard, KpiGrid, type KpiDef } from '@/components/admin/KpiCard';
import { format, startOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, Search, ChevronDown, ChevronUp,
  Package, Phone, Siren, Stethoscope, CalendarDays,
  PieChart as PieChartIcon, TrendingUp, TrendingDown, Award, Sparkles, Minus,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, XAxis, YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingRecord {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  session_type: string;
  original_price: number | null;
  promo_code: string | null;
  discount_value: number | null;
  final_price: number | null;
  payment_status: string | null;
  created_at: string;
  source: 'booking';
}

interface ReportRecord {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  report_type: string | null;
  original_price: number | null;
  promo_code: string | null;
  discount_value: number | null;
  final_price: number | null;
  payment_status: string | null;
  workflow_status: string | null;
  created_at: string;
  source: 'report';
}

interface FailKitRecord {
  id: string;
  full_name: string;
  email: string;
  company: null;
  request_number: string | null;
  original_price: number | null;
  promo_code: null;
  discount_value: number | null;
  final_price: number | null;
  payment_status: string | null;
  created_at: string;
  source: 'fail_kit';
}

type RevenueRecord = BookingRecord | ReportRecord | FailKitRecord;

// ── Constants ─────────────────────────────────────────────────────────────────

const PAYMENT_STATUSES = ['ALL', 'pending', 'paid', 'free', 'waived', 'failed'] as const;

// The five services called out by the Revenue-by-Service spec. Bookings map to
// a service via `session_type`; Fail Kit requests are their own source. There
// is no table or column anywhere that records a "3-Month Plan" purchase (the
// `services` catalog defines the plan, but zero booking/report rows reference
// it) — so it is rendered as an honest "Awaiting Data" placeholder rather than
// a fabricated $0 row, mirroring the existing `threeMonthPlans` placeholder
// pattern already established on the dashboard.
const SERVICE_KEYS = ['fail_kit', 'founder_call', 'emergency_session', 'startup_autopsy', 'three_month_plan'] as const;
type ServiceKey = typeof SERVICE_KEYS[number];

const SERVICE_ICONS: Record<ServiceKey, React.ElementType> = {
  fail_kit:          Package,
  founder_call:      Phone,
  emergency_session: Siren,
  startup_autopsy:   Stethoscope,
  three_month_plan:  CalendarDays,
};

const SERVICE_TEXT_COLORS: Record<ServiceKey, string> = {
  fail_kit:          'text-amber-400',
  founder_call:      'text-sky-400',
  emergency_session: 'text-crimson',
  startup_autopsy:   'text-violet-400',
  three_month_plan:  'text-orange-400',
};

const SERVICE_CHART_COLORS: Record<ServiceKey, string> = {
  fail_kit:          '#fbbf24',
  founder_call:      '#38bdf8',
  emergency_session: '#DD7877',
  startup_autopsy:   '#a78bfa',
  three_month_plan:  '#fb923c',
};

const TREND_RANGES = [7, 30, 90] as const;
type TrendRange = typeof TREND_RANGES[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPrice(val: number | null | undefined): string {
  if (val == null) return '—';
  return `$${val}`;
}

function paymentStatusClass(status: string | null): string {
  switch (status) {
    case 'pending':  return 'text-amber-400';
    case 'paid':     return 'text-recovery';
    case 'free':     return 'text-sky-400';
    case 'waived':   return 'text-violet-400';
    case 'failed':   return 'text-crimson';
    default:         return 'text-white/30';
  }
}

function mapToServiceKey(rec: RevenueRecord): ServiceKey | null {
  if (rec.source === 'fail_kit') return 'fail_kit';
  if (rec.source === 'booking') {
    const st = rec.session_type;
    if (st === 'founder_call' || st === 'emergency_session' || st === 'startup_autopsy') return st;
  }
  return null;
}

function dayKey(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd');
}

// ── Query ─────────────────────────────────────────────────────────────────────

function useRevenue() {
  return useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: async () => {
      const [bookingsRes, reportsRes, failKitsRes] = await Promise.all([
        (supabase as any)
          .from('booking_requests')
          .select('id, full_name, email, company, session_type, original_price, promo_code, discount_value, final_price, payment_status, created_at'),
        (supabase as any)
          .from('report_requests')
          .select('id, full_name, email, company, report_type, original_price, promo_code, discount_value, final_price, payment_status, workflow_status, created_at'),
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, request_number, full_name, email, price, discount, final_price, payment_status, created_at'),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (reportsRes.error) throw reportsRes.error;
      if (failKitsRes.error) throw failKitsRes.error;

      const bookings: BookingRecord[] = (bookingsRes.data ?? []).map((r: any) => ({
        ...r,
        source: 'booking' as const,
      }));
      const reports: ReportRecord[] = (reportsRes.data ?? []).map((r: any) => ({
        ...r,
        source: 'report' as const,
      }));
      const failKits: FailKitRecord[] = (failKitsRes.data ?? []).map((r: any) => ({
        id:               r.id,
        full_name:        r.full_name,
        email:            r.email,
        company:          null,
        request_number:   r.request_number,
        original_price:   r.price,
        promo_code:       null,
        discount_value:   r.discount,
        final_price:      r.final_price,
        payment_status:   r.payment_status,
        created_at:       r.created_at,
        source:           'fail_kit' as const,
      }));

      const combined: RevenueRecord[] = [...bookings, ...reports, ...failKits].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return combined;
    },
    staleTime: 30_000,
  });
}

// ── Derived analytics (pure — operate on the already-fetched dataset so no
//    extra Supabase round-trips are needed for the new widgets) ───────────────

interface ServiceStats {
  key:            ServiceKey;
  orders:         number;
  paidOrders:     number;
  revenue:        number;
  avgOrderValue:  number;
  conversionRate: number;
  hasData:        boolean;
}

function computeServiceStats(data: RevenueRecord[]): ServiceStats[] {
  return SERVICE_KEYS.map((key) => {
    const records   = data.filter((r) => mapToServiceKey(r) === key);
    const paid      = records.filter((r) => r.payment_status === 'paid');
    const revenue   = paid.reduce((acc, r) => acc + (r.final_price ?? 0), 0);

    return {
      key,
      orders:         records.length,
      paidOrders:     paid.length,
      revenue,
      avgOrderValue:  paid.length ? Math.round(revenue / paid.length) : 0,
      conversionRate: records.length ? Math.round((paid.length / records.length) * 100) : 0,
      hasData:        records.length > 0,
    };
  });
}

interface DailyPoint { date: string; revenue: number }

function buildDailyRevenue(data: RevenueRecord[], days: number): DailyPoint[] {
  const end   = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  const buckets = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    buckets.set(dayKey(new Date(start.getTime() + i * 86_400_000).toISOString()), 0);
  }

  data
    .filter((r) => r.payment_status === 'paid' && r.created_at)
    .forEach((r) => {
      const key = dayKey(r.created_at);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + (r.final_price ?? 0));
    });

  return Array.from(buckets.entries()).map(([date, revenue]) => ({ date, revenue }));
}

interface GrowthRow { key: ServiceKey; current: number; previous: number; growthPct: number | null }

function computeGrowth(data: RevenueRecord[]): GrowthRow[] {
  const now      = Date.now();
  const cut30    = now - 30 * 86_400_000;
  const cut60    = now - 60 * 86_400_000;

  return SERVICE_KEYS.map((key) => {
    const paid = data.filter((r) => mapToServiceKey(r) === key && r.payment_status === 'paid' && r.created_at);
    const current  = paid
      .filter((r) => new Date(r.created_at).getTime() >= cut30)
      .reduce((acc, r) => acc + (r.final_price ?? 0), 0);
    const previous = paid
      .filter((r) => { const t = new Date(r.created_at).getTime(); return t >= cut60 && t < cut30; })
      .reduce((acc, r) => acc + (r.final_price ?? 0), 0);

    return {
      key, current, previous,
      growthPct: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
    };
  });
}

// ── Status popover ────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = ['pending', 'paid', 'free', 'waived', 'failed'] as const;

function StatusPopover({
  record,
  onClose,
}: {
  record: RevenueRecord;
  onClose: () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const table = record.source === 'booking'
        ? 'booking_requests'
        : record.source === 'report'
        ? 'report_requests'
        : 'fail_kit_requests';
      const { error } = await (supabase as any)
        .from(table)
        .update({ payment_status: newStatus })
        .eq('id', record.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'revenue'] });
      onClose();
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="absolute left-0 top-full mt-1 z-50 bg-admin-card border border-admin-border rounded-lg shadow-xl overflow-hidden min-w-[120px]"
    >
      {PAYMENT_OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => mutation.mutate(opt)}
          disabled={mutation.isPending}
          className={cn(
            'w-full text-start px-3 py-2 text-xs font-arabic transition-colors hover:bg-white/6 disabled:opacity-50',
            record.payment_status === opt ? 'bg-white/4' : '',
            paymentStatusClass(opt)
          )}
        >
          {adminT.revenue.paymentStatus[opt] ?? opt}
        </button>
      ))}
    </motion.div>
  );
}

// ── Stat card (legacy operational counters — kept for parity) ─────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-admin-card border border-admin-border rounded-xl p-5">
      <p className="text-[10px] tracking-[0.2em] uppercase text-admin-text-muted/70 font-arabic mb-2">{label}</p>
      <p className="text-2xl font-semibold text-admin-text tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-admin-text-muted/70 font-arabic mt-1">{sub}</p>}
    </div>
  );
}

// ── Revenue by Service widget ─────────────────────────────────────────────────

function ServiceCard({ stats, index, loading }: { stats: ServiceStats; index: number; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const Icon  = SERVICE_ICONS[stats.key];
  const color = SERVICE_TEXT_COLORS[stats.key];
  const name  = adminT.revenue.serviceNames[stats.key] ?? stats.key;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <span className={cn('inline-flex items-center justify-center size-9 rounded-xl bg-white/5 shrink-0', color)}>
          <Icon className="size-4.5" />
        </span>
        <p className="text-sm font-medium text-admin-text font-arabic truncate">{name}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-white/4 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !stats.hasData ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-white/4 border border-white/8 rounded-lg">
          <Sparkles className="size-3.5 text-admin-text-muted/50 shrink-0" />
          <p className="text-[11px] text-admin-text-muted font-arabic leading-snug">
            {adminT.revenue.byService.awaitingData}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">
              {adminT.revenue.byService.revenue}
            </p>
            <p className="text-lg font-serif-display tabular-nums text-admin-text">{fmtPrice(stats.revenue)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">
              {adminT.revenue.byService.orders}
            </p>
            <p className="text-lg font-serif-display tabular-nums text-admin-text">{stats.orders}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">
              {adminT.revenue.byService.avgValue}
            </p>
            <p className="text-lg font-serif-display tabular-nums text-admin-text">{fmtPrice(stats.avgOrderValue)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">
              {adminT.revenue.byService.conversionRate}
            </p>
            <p className={cn('text-lg font-serif-display tabular-nums', color)}>{stats.conversionRate}%</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RevenueByServiceWidget({ serviceStats, loading }: { serviceStats: ServiceStats[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  return (
    <div className="mb-8">
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-3 font-arabic flex items-center gap-2">
        <Package className="size-3 text-admin-text-muted/50" />
        {adminT.revenue.byService.title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {serviceStats.map((s, i) => (
          <ServiceCard key={s.key} stats={s} index={i} loading={loading} />
        ))}
      </div>
    </div>
  );
}

// ── Revenue distribution chart ────────────────────────────────────────────────

function RevenueDistributionChart({ serviceStats, loading }: { serviceStats: ServiceStats[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();

  const slices = serviceStats.filter((s) => s.revenue > 0);
  const total  = slices.reduce((acc, s) => acc + s.revenue, 0);

  const chartData = slices.map((s) => ({
    key:     s.key,
    name:    adminT.revenue.serviceNames[s.key] ?? s.key,
    value:   s.revenue,
    percent: total > 0 ? Math.round((s.revenue / total) * 100) : 0,
  }));

  const config: ChartConfig = Object.fromEntries(
    slices.map((s) => [s.key, { label: adminT.revenue.serviceNames[s.key] ?? s.key, color: SERVICE_CHART_COLORS[s.key] }])
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10"
    >
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-4 font-arabic flex items-center gap-2">
        <PieChartIcon className="size-3 text-admin-text-muted/50" />
        {adminT.revenue.distribution.title}
      </p>

      {loading ? (
        <div className="aspect-video flex items-center justify-center">
          <div className="size-32 rounded-full bg-white/4 animate-pulse" />
        </div>
      ) : !chartData.length ? (
        <div className="aspect-video flex flex-col items-center justify-center gap-2">
          <PieChartIcon className="size-8 text-white/8" />
          <p className="text-admin-text-muted/60 text-xs font-arabic">{adminT.revenue.distribution.empty}</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <ChartContainer config={config} className="aspect-square max-h-[220px] w-full sm:w-auto sm:flex-1">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => (
                    <span className="font-arabic text-xs text-admin-text">
                      {item?.payload?.name}: {fmtPrice(value as number)} ({item?.payload?.percent}%)
                    </span>
                  )}
                />}
              />
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} strokeWidth={2}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={SERVICE_CHART_COLORS[entry.key as ServiceKey]} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="flex flex-col gap-2.5 w-full sm:w-44 shrink-0">
            {chartData.map((d) => (
              <div key={d.key} className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: SERVICE_CHART_COLORS[d.key as ServiceKey] }} />
                <span className="text-[11px] text-admin-text-muted font-arabic truncate flex-1">{d.name}</span>
                <span className="text-[11px] text-admin-text tabular-nums font-medium">{d.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Revenue trend chart ───────────────────────────────────────────────────────

function RevenueTrendChart({ data, loading }: { data: RevenueRecord[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const [range, setRange] = useState<TrendRange>(30);

  const points = useMemo(() => buildDailyRevenue(data, range), [data, range]);
  const hasRevenue = points.some((p) => p.revenue > 0);

  const config: ChartConfig = {
    revenue: { label: adminT.revenue.trend.axisRevenue, color: SERVICE_CHART_COLORS.founder_call },
  };

  const dateFmt = range === 7 ? 'EEE' : 'MMM d';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10"
    >
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 font-arabic flex items-center gap-2">
          <TrendingUp className="size-3 text-admin-text-muted/50" />
          {adminT.revenue.trend.title}
        </p>
        <div className="inline-flex p-0.5 bg-white/4 border border-white/8 rounded-lg">
          {TREND_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[10px] font-arabic transition-all duration-150',
                range === r ? 'bg-admin-primary text-admin-text shadow-sm' : 'text-admin-text-muted hover:text-admin-text'
              )}
            >
              {r === 7 ? adminT.revenue.trend.last7 : r === 30 ? adminT.revenue.trend.last30 : adminT.revenue.trend.last90}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="aspect-[3/1] bg-white/4 rounded-lg animate-pulse" />
      ) : !hasRevenue ? (
        <div className="aspect-[3/1] flex flex-col items-center justify-center gap-2">
          <TrendingUp className="size-8 text-white/8" />
          <p className="text-admin-text-muted/60 text-xs font-arabic">{adminT.revenue.trend.empty}</p>
        </div>
      ) : (
        <ChartContainer config={config} className="aspect-[3/1] w-full">
          <AreaChart data={points} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={SERVICE_CHART_COLORS.founder_call} stopOpacity={0.35} />
                <stop offset="95%" stopColor={SERVICE_CHART_COLORS.founder_call} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => format(new Date(v), dateFmt)}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-admin-text-muted)' }}
              minTickGap={24}
            />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-admin-text-muted)' }}
              width={48}
            />
            <ChartTooltip
              content={<ChartTooltipContent
                labelFormatter={(v) => format(new Date(v as string), 'MMM d, yyyy')}
                formatter={(value) => (
                  <span className="font-arabic text-xs text-admin-text">{fmtPrice(value as number)}</span>
                )}
              />}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={SERVICE_CHART_COLORS.founder_call}
              strokeWidth={2}
              fill="url(#revenueTrendFill)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </motion.div>
  );
}

// ── Top revenue service highlights ────────────────────────────────────────────

function TopServiceHighlights({ serviceStats, growth, loading }: {
  serviceStats: ServiceStats[];
  growth:       GrowthRow[];
  loading:      boolean;
}) {
  const { t: adminT } = useAdminLanguage();

  const earners = serviceStats.filter((s) => s.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  const topEarner = earners[0] ?? null;

  const growers = growth
    .filter((g) => g.growthPct !== null)
    .sort((a, b) => (b.growthPct ?? 0) - (a.growthPct ?? 0));
  const topGrower = growers[0] ?? null;

  const cards = [
    {
      icon:  Award,
      label: adminT.revenue.topService.highestRevenue,
      content: topEarner ? (
        <>
          <p className={cn('text-lg font-serif-display text-admin-text font-arabic', SERVICE_TEXT_COLORS[topEarner.key])}>
            {adminT.revenue.serviceNames[topEarner.key] ?? topEarner.key}
          </p>
          <p className="text-[11px] text-admin-text-muted tabular-nums mt-1">{fmtPrice(topEarner.revenue)} · {topEarner.orders} {adminT.revenue.byService.orders.toLowerCase()}</p>
        </>
      ) : null,
    },
    {
      icon:  Sparkles,
      label: adminT.revenue.topService.fastestGrowing,
      content: topGrower ? (
        <>
          <p className={cn('text-lg font-serif-display text-admin-text font-arabic', SERVICE_TEXT_COLORS[topGrower.key])}>
            {adminT.revenue.serviceNames[topGrower.key] ?? topGrower.key}
          </p>
          <p className={cn(
            'flex items-center gap-1 text-[11px] tabular-nums mt-1',
            (topGrower.growthPct ?? 0) >= 0 ? 'text-recovery' : 'text-crimson'
          )}>
            {(topGrower.growthPct ?? 0) >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {(topGrower.growthPct ?? 0) >= 0 ? '+' : ''}{topGrower.growthPct}%
          </p>
        </>
      ) : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10 flex items-center gap-4"
          >
            <span className="inline-flex items-center justify-center size-10 rounded-xl bg-white/5 text-admin-accent shrink-0">
              <Icon className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1.5">{card.label}</p>
              {loading ? (
                <span className="inline-block w-24 h-5 bg-white/6 rounded animate-pulse" />
              ) : card.content ?? (
                <div className="flex items-center gap-2 text-admin-text-muted">
                  <Minus className="size-3.5" />
                  <span className="text-xs font-arabic">{adminT.revenue.topService.awaitingData}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminRevenue() {
  const { t: adminT } = useAdminLanguage();
  const { data = [], isLoading } = useRevenue();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const serviceLabel = (rec: RevenueRecord): string => {
    const key = mapToServiceKey(rec);
    if (key) return adminT.revenue.serviceNames[key] ?? key;
    if (rec.source === 'report') return (rec as ReportRecord).report_type ?? '—';
    return rec.session_type;
  };

  // ── Legacy operational stats (kept — "do not remove existing functionality") ─

  const totalRevenue = data
    .filter((r) => r.payment_status === 'paid')
    .reduce((acc, r) => acc + (r.final_price ?? 0), 0);

  const paidSessions = data.filter((r) => r.source === 'booking' && r.payment_status === 'paid').length;
  const paidReports  = data.filter((r) => r.source === 'report'  && r.payment_status === 'paid').length;
  const paidFailKits = data.filter((r) => r.source === 'fail_kit' && r.payment_status === 'paid').length;
  const freePromo    = data.filter((r) => r.payment_status === 'free').length;

  // ── New analytics derivations ─────────────────────────────────────────────

  const overview = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const all     = data.reduce((acc, r) => acc + (r.final_price ?? 0), 0);
    const paid    = data.filter((r) => r.payment_status === 'paid').reduce((acc, r) => acc + (r.final_price ?? 0), 0);
    const pending = data.filter((r) => r.payment_status === 'pending').reduce((acc, r) => acc + (r.final_price ?? 0), 0);
    const thisMonth = data
      .filter((r) => r.payment_status === 'paid' && r.created_at && new Date(r.created_at) >= monthStart)
      .reduce((acc, r) => acc + (r.final_price ?? 0), 0);
    return { all, paid, pending, thisMonth };
  }, [data]);

  const serviceStats = useMemo(() => computeServiceStats(data), [data]);
  const growth       = useMemo(() => computeGrowth(data), [data]);

  const overviewKpis: KpiDef[] = [
    { label: adminT.revenue.overviewCards.totalRevenue,   value: overview.all,      icon: DollarSign, accent: 'text-admin-accent', isCurrency: true },
    { label: adminT.revenue.overviewCards.paidRevenue,    value: overview.paid,     icon: TrendingUp, accent: 'text-recovery',     isCurrency: true },
    { label: adminT.revenue.overviewCards.pendingRevenue, value: overview.pending,  icon: CalendarDays, accent: 'text-amber-400',  isCurrency: true },
    { label: adminT.revenue.overviewCards.thisMonth,      value: overview.thisMonth, icon: Sparkles,    accent: 'text-sky-400',    isCurrency: true },
  ];

  // ── Filtered table rows ────────────────────────────────────────────────────

  const filtered = data.filter((r) => {
    const q = search.toLowerCase();
    if (q && !r.full_name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) {
      return false;
    }
    if (statusFilter !== 'ALL' && r.payment_status !== statusFilter) return false;
    return true;
  });

  const TABLE_HEADERS = [
    adminT.revenue.table.customer,
    adminT.revenue.table.source,
    adminT.revenue.table.service,
    adminT.revenue.table.originalPrice,
    adminT.revenue.table.discount,
    adminT.revenue.table.finalPrice,
    adminT.revenue.table.promoCode,
    adminT.revenue.table.paymentStatus,
    adminT.revenue.table.date,
  ];

  return (
    <AdminLayout title={adminT.revenue.title} subtitle={adminT.revenue.subtitle}>

      {/* ── Revenue Overview ── */}
      <KpiGrid
        title={adminT.revenue.overviewCards.title}
        titleIcon={DollarSign}
        kpis={overviewKpis}
        loading={isLoading}
        placeholderHint=""
        columns="grid-cols-2 xl:grid-cols-4"
      />

      {/* ── Revenue by Service ── */}
      <RevenueByServiceWidget serviceStats={serviceStats} loading={isLoading} />

      {/* ── Distribution + Trend ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <RevenueDistributionChart serviceStats={serviceStats} loading={isLoading} />
        <RevenueTrendChart data={data} loading={isLoading} />
      </div>

      {/* ── Top Revenue Service ── */}
      <TopServiceHighlights serviceStats={serviceStats} growth={growth} loading={isLoading} />

      {/* ── Legacy quick stats ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <StatCard label={adminT.revenue.overviewCards.paidRevenue} value={`$${totalRevenue}`} />
        <StatCard label={adminT.revenue.overview.paidSessions} value={paidSessions} />
        <StatCard label={adminT.revenue.overview.paidReports} value={paidReports} />
        <StatCard label={adminT.revenue.byService.title} value={paidFailKits} sub={adminT.revenue.serviceNames.fail_kit} />
        <StatCard label={adminT.revenue.overview.freePromo} value={freePromo} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 size-3.5 text-admin-text-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.revenue.search}
            className="w-full bg-admin-card border border-admin-border rounded-lg pe-9 ps-4 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted/50 focus:outline-none focus:border-white/20 transition-colors font-arabic"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-admin-card border border-admin-border rounded-lg ps-4 pe-8 py-2.5 text-sm text-admin-text focus:outline-none focus:border-white/20 transition-colors font-arabic cursor-pointer"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? adminT.common.all : (adminT.revenue.paymentStatus[s] ?? s)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-admin-text-muted/60 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-admin-card border border-admin-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white/4 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <DollarSign className="size-10 text-white/8" />
            <p className="text-admin-text-muted/60 text-sm font-arabic">{adminT.revenue.empty}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-white/2">
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-start text-[10px] tracking-[0.18em] uppercase text-admin-text-muted/60 font-arabic font-normal whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((rec, i) => (
                  <motion.tr
                    key={`${rec.source}-${rec.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-white/2 transition-colors"
                  >
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-admin-text/90 font-arabic font-medium text-sm">{rec.full_name}</p>
                      <p className="text-[11px] text-admin-text-muted/70 mt-0.5">{rec.email}</p>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      {rec.source === 'booking' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-sky-950/30 text-sky-400 border-sky-800/30 font-arabic">
                          {adminT.revenue.sources.booking}
                        </span>
                      ) : rec.source === 'report' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-violet-950/30 text-violet-400 border-violet-800/30 font-arabic">
                          {adminT.revenue.sources.report}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-amber-950/30 text-amber-400 border-amber-800/30 font-arabic">
                          {adminT.revenue.serviceNames.fail_kit}
                        </span>
                      )}
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted font-arabic text-xs">{serviceLabel(rec)}</span>
                    </td>

                    {/* Original price */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted/80 text-xs tabular-nums">{fmtPrice(rec.original_price)}</span>
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted/80 text-xs tabular-nums">{fmtPrice(rec.discount_value)}</span>
                    </td>

                    {/* Final price */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text text-sm font-semibold tabular-nums">{fmtPrice(rec.final_price)}</span>
                    </td>

                    {/* Promo code */}
                    <td className="px-4 py-3">
                      {rec.promo_code ? (
                        <code className="text-[11px] font-mono bg-white/6 px-1.5 py-0.5 rounded text-admin-text-muted">
                          {rec.promo_code}
                        </code>
                      ) : (
                        <span className="text-admin-text-muted/40 text-xs">—</span>
                      )}
                    </td>

                    {/* Payment status */}
                    <td className="px-4 py-3">
                      <div className="relative inline-flex">
                        <button
                          onClick={() =>
                            setOpenPopoverId(
                              openPopoverId === rec.id ? null : rec.id
                            )
                          }
                          className={cn(
                            'flex items-center gap-1 text-xs font-arabic transition-opacity hover:opacity-70',
                            paymentStatusClass(rec.payment_status)
                          )}
                        >
                          {adminT.revenue.paymentStatus[rec.payment_status ?? ''] ?? (rec.payment_status ?? '—')}
                          {openPopoverId === rec.id ? (
                            <ChevronUp className="size-3 opacity-50" />
                          ) : (
                            <ChevronDown className="size-3 opacity-50" />
                          )}
                        </button>
                        <AnimatePresence>
                          {openPopoverId === rec.id && (
                            <StatusPopover
                              record={rec}
                              onClose={() => setOpenPopoverId(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted/60 text-xs">
                        {rec.created_at
                          ? format(new Date(rec.created_at), 'MMM d, yyyy')
                          : '—'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
