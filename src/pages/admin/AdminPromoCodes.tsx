import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { KpiGrid, type KpiDef } from '@/components/admin/KpiCard';
import { format, differenceInDays } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Tag, Plus, Search, Copy, CheckCheck, X, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, Repeat, DollarSign, Gift, Percent, ChevronDown,
  Clock, AlertTriangle, Award, Sparkles, RotateCcw, User, Calendar,
  Package, Phone, Siren, Stethoscope, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PromoCode {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  service_key: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
}

interface Redemption {
  id: string;
  promo_code_id: string;
  code: string;
  email: string | null;
  service_key: string | null;
  related_type: string | null;
  related_id: string | null;
  discount_type: string | null;
  discount_value: number | null;
  redeemed_at: string;
}

interface LinkedOrder {
  id: string;
  promo_code_id: string;
  related_type: 'booking_request' | 'fail_kit_request';
  service_key: string | null;
  original_price: number | null;
  discount_value: number | null;
  final_price: number | null;
  payment_status: string | null;
  created_at: string;
}

interface FormState {
  code: string;
  title: string;
  description: string;
  service_key: string;
  discount_type: string;
  discount_value: string;
  max_uses: string;
  max_uses_per_customer: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

const DEFAULT_FORM: FormState = {
  code: '',
  title: '',
  description: '',
  service_key: 'all_services',
  discount_type: 'percentage',
  discount_value: '',
  max_uses: '',
  max_uses_per_customer: '1',
  starts_at: '',
  ends_at: '',
  active: true,
};

// ── Status system ─────────────────────────────────────────────────────────────

type PromoStatus = 'active' | 'expired' | 'fully_used' | 'scheduled' | 'disabled';
const STATUS_KEYS: PromoStatus[] = ['active', 'expired', 'fully_used', 'scheduled', 'disabled'];

const STATUS_BADGE_CLASSES: Record<PromoStatus, string> = {
  active:     'bg-recovery/10 text-recovery border-recovery/25',
  expired:    'bg-white/5 text-white/35 border-white/10',
  fully_used: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
  scheduled:  'bg-sky-950/30 text-sky-400 border-sky-800/30',
  disabled:   'bg-crimson/10 text-crimson border-crimson/25',
};

function getPromoStatus(code: PromoCode, now: Date = new Date()): PromoStatus {
  if (!code.active) return 'disabled';
  if (code.ends_at && new Date(code.ends_at) < now) return 'expired';
  if (code.starts_at && new Date(code.starts_at) > now) return 'scheduled';
  if (code.max_uses != null && code.used_count >= code.max_uses) return 'fully_used';
  return 'active';
}

function StatusBadge({ status }: { status: PromoStatus }) {
  const { t: adminT } = useAdminLanguage();
  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic whitespace-nowrap',
      STATUS_BADGE_CLASSES[status]
    )}>
      {adminT.promoCodes.status[status]}
    </span>
  );
}

// ── Service performance constants (mirrors AdminRevenue's mapping) ───────────

const PERF_SERVICE_KEYS = ['fail_kit', 'founder_call', 'emergency_session', 'startup_autopsy', 'three_month_plan'] as const;
type PerfServiceKey = typeof PERF_SERVICE_KEYS[number];

const SERVICE_ICONS: Record<PerfServiceKey, React.ElementType> = {
  fail_kit:          Package,
  founder_call:      Phone,
  emergency_session: Siren,
  startup_autopsy:   Stethoscope,
  three_month_plan:  CalendarDays,
};

const SERVICE_TEXT_COLORS: Record<PerfServiceKey, string> = {
  fail_kit:          'text-amber-400',
  founder_call:      'text-sky-400',
  emergency_session: 'text-crimson',
  startup_autopsy:   'text-violet-400',
  three_month_plan:  'text-orange-400',
};

function mapOrderToServiceKey(order: LinkedOrder): PerfServiceKey | null {
  if (order.related_type === 'fail_kit_request') return 'fail_kit';
  if (order.related_type === 'booking_request') {
    const st = order.service_key;
    if (st === 'founder_call' || st === 'emergency_session' || st === 'startup_autopsy') return st;
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isExpired(code: PromoCode): boolean {
  return !!code.ends_at && new Date(code.ends_at) < new Date();
}

function discountLabel(code: PromoCode, t: ReturnType<typeof useAdminLanguage>['t']): string {
  if (code.discount_type === 'free') return t.promoCodes.discountTypes.free;
  if (code.discount_type === 'percentage') return `${code.discount_value}%`;
  return `$${code.discount_value}`;
}

function fmtPrice(val: number | null | undefined): string {
  if (val == null) return '—';
  return `$${val.toLocaleString()}`;
}

// ── Query ─────────────────────────────────────────────────────────────────────

function usePromoAnalytics() {
  return useQuery({
    queryKey: ['admin', 'promo-codes-v2'],
    queryFn: async () => {
      const [codesRes, redemptionsRes, bookingsRes, failKitsRes] = await Promise.all([
        (supabase as any).from('promo_codes').select('*').order('created_at', { ascending: false }),
        (supabase as any).from('promo_code_redemptions').select('*').order('redeemed_at', { ascending: false }),
        (supabase as any)
          .from('booking_requests')
          .select('id, session_type, original_price, discount_value, final_price, payment_status, promo_code_id, created_at')
          .not('promo_code_id', 'is', null),
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, price, discount, final_price, payment_status, promo_code_id, created_at')
          .not('promo_code_id', 'is', null),
      ]);

      if (codesRes.error) throw codesRes.error;
      if (redemptionsRes.error) throw redemptionsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (failKitsRes.error) throw failKitsRes.error;

      const codes       = (codesRes.data ?? []) as PromoCode[];
      const redemptions = (redemptionsRes.data ?? []) as Redemption[];

      const orders: LinkedOrder[] = [
        ...(bookingsRes.data ?? []).map((b: any): LinkedOrder => ({
          id:             b.id,
          promo_code_id:  b.promo_code_id,
          related_type:   'booking_request',
          service_key:    b.session_type,
          original_price: b.original_price,
          discount_value: b.discount_value,
          final_price:    b.final_price,
          payment_status: b.payment_status,
          created_at:     b.created_at,
        })),
        ...(failKitsRes.data ?? []).map((f: any): LinkedOrder => ({
          id:             f.id,
          promo_code_id:  f.promo_code_id,
          related_type:   'fail_kit_request',
          service_key:    'fail_kit',
          original_price: f.price,
          discount_value: f.discount,
          final_price:    f.final_price,
          payment_status: f.payment_status,
          created_at:     f.created_at,
        })),
      ];

      return { codes, redemptions, orders };
    },
    staleTime: 30_000,
  });
}

// ── Derived analytics (pure — operate on the fetched dataset) ────────────────

interface CodeStats {
  status:           PromoStatus;
  uniqueUsers:      number;
  revenueGenerated: number;
  discountGiven:    number;
  remainingUses:    number | null;
}

function computeCodeStats(code: PromoCode, redemptions: Redemption[], orders: LinkedOrder[]): CodeStats {
  const codeOrders      = orders.filter((o) => o.promo_code_id === code.id);
  const codeRedemptions = redemptions.filter((r) => r.promo_code_id === code.id);
  const paidOrders      = codeOrders.filter((o) => o.payment_status === 'paid');
  const uniqueUsers     = new Set(codeRedemptions.map((r) => (r.email ?? '').toLowerCase()).filter(Boolean)).size;

  return {
    status:           getPromoStatus(code),
    uniqueUsers,
    revenueGenerated: paidOrders.reduce((acc, o) => acc + (o.final_price ?? 0), 0),
    discountGiven:    codeOrders.reduce((acc, o) => acc + (o.discount_value ?? 0), 0),
    remainingUses:    code.max_uses != null ? Math.max(0, code.max_uses - code.used_count) : null,
  };
}

interface PromoSummary {
  activeCount:      number;
  expiredCount:     number;
  totalRedemptions: number;
  revenueImpact:    number;
  freeOrders:       number;
  discountGiven:    number;
}

function computeSummary(codes: PromoCode[], orders: LinkedOrder[]): PromoSummary {
  const now      = new Date();
  const statuses = codes.map((c) => getPromoStatus(c, now));
  const paid     = orders.filter((o) => o.payment_status === 'paid');

  return {
    activeCount:      statuses.filter((s) => s === 'active').length,
    expiredCount:     statuses.filter((s) => s === 'expired').length,
    totalRedemptions: codes.reduce((acc, c) => acc + (c.used_count ?? 0), 0),
    revenueImpact:    paid.reduce((acc, o) => acc + (o.final_price ?? 0), 0),
    freeOrders:       orders.filter((o) => (o.final_price ?? 0) <= 0).length,
    discountGiven:    orders.reduce((acc, o) => acc + (o.discount_value ?? 0), 0),
  };
}

interface ServicePerf {
  key:           PerfServiceKey;
  codesCount:    number;
  revenue:       number;
  redemptions:   number;
  discountValue: number;
  hasData:       boolean;
}

function computeServicePerformance(orders: LinkedOrder[]): ServicePerf[] {
  return PERF_SERVICE_KEYS.map((key) => {
    const records = orders.filter((o) => mapOrderToServiceKey(o) === key);
    const paid    = records.filter((o) => o.payment_status === 'paid');
    return {
      key,
      codesCount:    new Set(records.map((o) => o.promo_code_id).filter(Boolean)).size,
      revenue:       paid.reduce((acc, o) => acc + (o.final_price ?? 0), 0),
      redemptions:   records.length,
      discountValue: records.reduce((acc, o) => acc + (o.discount_value ?? 0), 0),
      hasData:       records.length > 0,
    };
  });
}

interface ExpiringItem {
  code:     PromoCode;
  daysLeft: number;
  bucket:   'within7' | 'within30';
}

function computeExpiringSoon(codes: PromoCode[]): ExpiringItem[] {
  const now = new Date();
  return codes
    .filter((c) => c.ends_at && getPromoStatus(c, now) === 'active')
    .map((c) => ({ code: c, daysLeft: differenceInDays(new Date(c.ends_at as string), now) }))
    .filter((x) => x.daysLeft >= 0 && x.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map((x) => ({ ...x, bucket: (x.daysLeft <= 7 ? 'within7' : 'within30') as ExpiringItem['bucket'] }));
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummarySection({ summary, loading }: { summary: PromoSummary | undefined; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const ps = adminT.promoCodes.summary;

  const kpis: KpiDef[] = [
    { label: ps.activeCodes,      value: summary?.activeCount,      icon: CheckCircle2, accent: 'text-recovery' },
    { label: ps.expiredCodes,     value: summary?.expiredCount,     icon: XCircle,      accent: 'text-white/40' },
    { label: ps.totalRedemptions, value: summary?.totalRedemptions, icon: Repeat,       accent: 'text-sky-400' },
    { label: ps.revenueImpact,    value: summary?.revenueImpact,    icon: DollarSign,   accent: 'text-admin-accent', isCurrency: true },
    { label: ps.freeOrders,       value: summary?.freeOrders,       icon: Gift,         accent: 'text-violet-400' },
    { label: ps.discountGiven,    value: summary?.discountGiven,    icon: Percent,      accent: 'text-amber-400',    isCurrency: true },
  ];

  return (
    <KpiGrid
      title={ps.title}
      titleIcon={Tag}
      kpis={kpis}
      loading={loading}
      placeholderHint={adminT.common.awaitingData}
      columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
    />
  );
}

// ── Expiring soon widget ──────────────────────────────────────────────────────

function ExpiringSoonWidget({ items, loading }: { items: ExpiringItem[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const es = adminT.promoCodes.expiringSoon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 p-5 bg-admin-card border border-admin-border rounded-2xl shadow-sm shadow-black/10"
    >
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-4 font-arabic flex items-center gap-2">
        <AlertTriangle className="size-3 text-admin-text-muted/50" />
        {es.title}
      </p>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-white/4 rounded-lg animate-pulse" />)}
        </div>
      ) : !items.length ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-white/4 border border-white/8 rounded-lg">
          <Sparkles className="size-3.5 text-admin-text-muted/50 shrink-0" />
          <p className="text-[11px] text-admin-text-muted font-arabic leading-snug">{es.empty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(({ code, daysLeft, bucket }) => (
            <div key={code.id} className="flex items-center justify-between gap-3 p-3 bg-white/4 border border-white/8 rounded-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <code className="text-xs font-mono font-bold text-admin-text bg-white/6 px-2 py-0.5 rounded shrink-0">{code.code}</code>
                <span className="text-[11px] text-admin-text-muted font-arabic truncate">
                  {adminT.promoCodes.services[code.service_key] ?? code.service_key}
                </span>
                <span className="text-[10px] text-admin-text-muted/50 font-arabic shrink-0">
                  {bucket === 'within7' ? es.within7 : es.within30}
                </span>
              </div>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border whitespace-nowrap font-arabic shrink-0',
                bucket === 'within7' ? 'bg-crimson/10 text-crimson border-crimson/25' : 'bg-amber-950/30 text-amber-400 border-amber-800/30'
              )}>
                <Clock className="size-3" />
                {daysLeft} {es.daysLeft}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Service performance ───────────────────────────────────────────────────────

function ServicePerfCard({ stats, index, loading }: { stats: ServicePerf; index: number; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const Icon  = SERVICE_ICONS[stats.key];
  const color = SERVICE_TEXT_COLORS[stats.key];
  const name  = adminT.revenue.serviceNames[stats.key] ?? stats.key;
  const sp    = adminT.promoCodes.servicePerformance;

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
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-white/4 rounded-lg animate-pulse" />)}
        </div>
      ) : !stats.hasData ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-white/4 border border-white/8 rounded-lg">
          <Sparkles className="size-3.5 text-admin-text-muted/50 shrink-0" />
          <p className="text-[11px] text-admin-text-muted font-arabic leading-snug">{sp.awaitingData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">{sp.codesCount}</p>
            <p className="text-lg font-serif-display tabular-nums text-admin-text">{stats.codesCount}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">{sp.revenue}</p>
            <p className="text-lg font-serif-display tabular-nums text-admin-text">{fmtPrice(stats.revenue)}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">{sp.redemptions}</p>
            <p className="text-lg font-serif-display tabular-nums text-admin-text">{stats.redemptions}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.18em] text-admin-text-muted/60 font-arabic mb-1">{sp.discountValue}</p>
            <p className={cn('text-lg font-serif-display tabular-nums', color)}>{fmtPrice(stats.discountValue)}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ServicePerformanceSection({ stats, loading }: { stats: ServicePerf[]; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  return (
    <div className="mb-8">
      <p className="text-[9px] tracking-[0.22em] uppercase text-admin-text-muted/70 mb-3 font-arabic flex items-center gap-2">
        <Award className="size-3 text-admin-text-muted/50" />
        {adminT.promoCodes.servicePerformance.title}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {stats.map((s, i) => <ServicePerfCard key={s.key} stats={s} index={i} loading={loading} />)}
      </div>
    </div>
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

interface FilterState {
  status:       PromoStatus | 'all';
  service:      string;
  discountType: string;
  dateFrom:     string;
  dateTo:       string;
  usageMin:     string;
  usageMax:     string;
}

const DEFAULT_FILTERS: FilterState = {
  status: 'all', service: 'all', discountType: 'all',
  dateFrom: '', dateTo: '', usageMin: '', usageMax: '',
};

function hasActiveFilters(f: FilterState): boolean {
  return f.status !== 'all' || f.service !== 'all' || f.discountType !== 'all'
    || !!f.dateFrom || !!f.dateTo || !!f.usageMin || !!f.usageMax;
}

function FiltersBar({ filters, onChange, onReset }: {
  filters:  FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onReset:  () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const fl = adminT.promoCodes.filters;
  const services      = Object.keys(adminT.promoCodes.services);
  const discountTypes = Object.keys(adminT.promoCodes.discountTypes);

  const selectCls = 'appearance-none bg-admin-card border border-admin-border rounded-lg ps-3 pe-8 py-2 text-xs text-admin-text focus:outline-none focus:border-white/20 transition-colors font-arabic cursor-pointer';
  const inputCls  = 'bg-admin-card border border-admin-border rounded-lg px-2.5 py-2 text-xs text-admin-text placeholder:text-admin-text-muted/40 focus:outline-none focus:border-white/20 transition-colors';
  const labelCls  = 'block text-[9px] uppercase tracking-wider text-admin-text-muted/60 mb-1.5 font-arabic';

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4 p-4 bg-admin-card/50 border border-admin-border rounded-2xl">
      <div>
        <label className={labelCls}>{fl.status}</label>
        <div className="relative">
          <select value={filters.status} onChange={(e) => onChange({ status: e.target.value as FilterState['status'] })} className={selectCls}>
            <option value="all">{fl.allStatuses}</option>
            {STATUS_KEYS.map((s) => <option key={s} value={s}>{adminT.promoCodes.status[s]}</option>)}
          </select>
          <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 size-3 text-admin-text-muted/50 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className={labelCls}>{fl.service}</label>
        <div className="relative">
          <select value={filters.service} onChange={(e) => onChange({ service: e.target.value })} className={selectCls}>
            <option value="all">{fl.allServices}</option>
            {services.map((s) => <option key={s} value={s}>{adminT.promoCodes.services[s]}</option>)}
          </select>
          <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 size-3 text-admin-text-muted/50 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className={labelCls}>{fl.discountType}</label>
        <div className="relative">
          <select value={filters.discountType} onChange={(e) => onChange({ discountType: e.target.value })} className={selectCls}>
            <option value="all">{fl.allTypes}</option>
            {discountTypes.map((d) => <option key={d} value={d}>{adminT.promoCodes.discountTypes[d]}</option>)}
          </select>
          <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 size-3 text-admin-text-muted/50 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className={labelCls}>{fl.dateRange}</label>
        <div className="flex items-center gap-1.5">
          <input type="date" value={filters.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} className={inputCls} />
          <span className="text-admin-text-muted/40 text-xs">–</span>
          <input type="date" value={filters.dateTo} onChange={(e) => onChange({ dateTo: e.target.value })} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>{fl.usageRange}</label>
        <div className="flex items-center gap-1.5">
          <input type="number" min="0" placeholder={fl.min} value={filters.usageMin} onChange={(e) => onChange({ usageMin: e.target.value })} className={cn(inputCls, 'w-16')} />
          <span className="text-admin-text-muted/40 text-xs">–</span>
          <input type="number" min="0" placeholder={fl.max} value={filters.usageMax} onChange={(e) => onChange({ usageMax: e.target.value })} className={cn(inputCls, 'w-16')} />
        </div>
      </div>

      {hasActiveFilters(filters) && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-admin-text-muted hover:text-admin-text border border-admin-border rounded-lg hover:bg-white/4 transition-colors font-arabic"
        >
          <RotateCcw className="size-3" />
          {fl.reset}
        </button>
      )}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

function PromoTable({
  rows, statsById, onSelect, onEdit, onToggle, toggling, copiedId, onCopy, loading,
}: {
  rows:      PromoCode[];
  statsById: Map<string, CodeStats>;
  onSelect:  (code: PromoCode) => void;
  onEdit:    (code: PromoCode) => void;
  onToggle:  (code: PromoCode) => void;
  toggling:  boolean;
  copiedId:  string | null;
  onCopy:    (code: PromoCode) => void;
  loading:   boolean;
}) {
  const { t: adminT } = useAdminLanguage();
  const tb = adminT.promoCodes.table;

  const headers = [tb.code, tb.service, tb.status, tb.discount, tb.usage, tb.remainingUses, tb.createdDate, tb.expiryDate, tb.revenueImpact, tb.actions];

  return (
    <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/4 rounded-lg animate-pulse" />)}
        </div>
      ) : !rows.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Tag className="size-10 text-white/8" />
          <p className="text-admin-text-muted/60 text-sm font-arabic">{adminT.promoCodes.empty}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-white/2">
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-[10px] tracking-[0.18em] uppercase text-admin-text-muted/60 font-arabic font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((code, i) => {
                const stats = statsById.get(code.id)!;
                return (
                  <motion.tr
                    key={code.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => onSelect(code)}
                    className="hover:bg-white/2 transition-colors cursor-pointer"
                  >
                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono font-bold text-admin-text bg-white/6 px-2 py-0.5 rounded">{code.code}</code>
                        <button
                          onClick={(e) => { e.stopPropagation(); onCopy(code); }}
                          className="p-1 rounded hover:bg-white/8 transition-colors"
                        >
                          {copiedId === code.id
                            ? <CheckCheck className="size-3 text-recovery" />
                            : <Copy className="size-3 text-admin-text-muted/50 hover:text-admin-text-muted" />}
                        </button>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted font-arabic text-xs">
                        {adminT.promoCodes.services[code.service_key] ?? code.service_key}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3"><StatusBadge status={stats.status} /></td>

                    {/* Discount */}
                    <td className="px-4 py-3">
                      <span className="text-ember text-sm font-semibold tabular-nums">{discountLabel(code, adminT)}</span>
                    </td>

                    {/* Usage */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted/80 text-xs tabular-nums whitespace-nowrap">
                        {code.used_count}{code.max_uses ? ` / ${code.max_uses}` : ''}
                      </span>
                    </td>

                    {/* Remaining */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted/80 text-xs tabular-nums">
                        {stats.remainingUses ?? '∞'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text-muted/70 text-xs tabular-nums whitespace-nowrap">
                        {format(new Date(code.created_at), 'MMM d, yyyy')}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="px-4 py-3">
                      <span className={cn('text-xs tabular-nums whitespace-nowrap', isExpired(code) ? 'text-crimson/70' : 'text-admin-text-muted/70')}>
                        {code.ends_at ? format(new Date(code.ends_at), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>

                    {/* Revenue impact */}
                    <td className="px-4 py-3">
                      <span className="text-admin-text text-sm font-semibold tabular-nums">{fmtPrice(stats.revenueGenerated)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEdit(code)}
                          className="px-2.5 py-1.5 text-[11px] text-admin-text-muted hover:text-admin-text hover:bg-white/6 rounded-lg transition-colors font-arabic"
                        >
                          {adminT.common.edit}
                        </button>
                        <button
                          onClick={() => onToggle(code)}
                          disabled={toggling || isExpired(code)}
                          className={cn(
                            'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors font-arabic disabled:opacity-40 whitespace-nowrap',
                            code.active
                              ? 'text-amber-400 border-amber-800/30 hover:bg-amber-950/20'
                              : 'text-recovery border-recovery/20 hover:bg-recovery/8'
                          )}
                        >
                          {code.active
                            ? <><ToggleRight className="size-3" />{adminT.common.deactivate}</>
                            : <><ToggleLeft className="size-3" />{adminT.common.activate}</>}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Details drawer ────────────────────────────────────────────────────────────

function FieldBlock({ icon: Icon, label, value, mono, placeholder }: {
  icon:  React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  placeholder?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-admin-text-muted/60 font-arabic mb-1">
        <Icon className="size-3" /> {label}
      </p>
      <p className={cn(
        'text-sm truncate',
        placeholder ? 'text-admin-text-muted/50 font-arabic' : 'text-admin-text',
        mono && !placeholder && 'font-mono'
      )}>
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.16em] text-admin-text-muted/60 font-arabic mb-1">{label}</p>
      <p className={cn('text-base font-serif-display tabular-nums', accent ?? 'text-admin-text')}>{value}</p>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-admin-text-muted/70 font-arabic mb-3">
      <Icon className="size-3" /> {children}
    </p>
  );
}

function PromoDetailsDrawer({
  code, stats, redemptions, copied, onCopy, onClose, onEdit,
}: {
  code:        PromoCode;
  stats:       CodeStats;
  redemptions: Redemption[];
  copied:      boolean;
  onCopy:      () => void;
  onClose:     () => void;
  onEdit:      () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const dr = adminT.promoCodes.drawer;
  const codeRedemptions = redemptions.filter((r) => r.promo_code_id === code.id).slice(0, 8);

  const validity = code.starts_at || code.ends_at
    ? [
        code.starts_at ? format(new Date(code.starts_at), 'MMM d, yyyy') : null,
        code.ends_at   ? format(new Date(code.ends_at), 'MMM d, yyyy')   : null,
      ].filter(Boolean).join(' – ')
    : '—';

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20" />
      <motion.div
        key={code.id}
        initial={{ x: 460 }}
        animate={{ x: 0 }}
        exit={{ x: 460 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed end-0 top-0 bottom-0 w-[460px] z-30 bg-admin-card border-s border-admin-border overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-border sticky top-0 bg-admin-card z-10">
          <div className="flex items-center gap-2 min-w-0">
            <code className="text-base font-mono font-bold text-admin-text bg-white/6 px-2.5 py-1 rounded truncate">{code.code}</code>
            <button onClick={onCopy} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors shrink-0">
              {copied ? <CheckCheck className="size-3.5 text-recovery" /> : <Copy className="size-3.5 text-admin-text-muted/60" />}
            </button>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center text-admin-text-muted/60 hover:text-admin-text transition-colors rounded-lg hover:bg-white/5 shrink-0">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + discount */}
          <div className="flex items-center gap-3">
            <StatusBadge status={stats.status} />
            <span className="text-lg font-semibold text-ember">{discountLabel(code, adminT)}</span>
            <span className="text-[11px] text-admin-text-muted font-arabic">
              {adminT.promoCodes.discountTypes[code.discount_type] ?? code.discount_type}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <FieldBlock icon={Tag} label={dr.service} value={adminT.promoCodes.services[code.service_key] ?? code.service_key} />
            <FieldBlock icon={Calendar} label={dr.validity} value={validity} mono />
            <FieldBlock icon={User} label={dr.createdBy} value={dr.awaitingData} placeholder />
            <FieldBlock
              icon={Clock}
              label={dr.createdAt}
              value={code.created_at ? format(new Date(code.created_at), 'MMM d, yyyy · HH:mm') : '—'}
              mono
            />
          </div>

          {/* Usage history */}
          <div>
            <SectionLabel icon={Repeat}>{dr.usageHistory}</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat label={adminT.promoCodes.usage.timesUsed} value={code.used_count} />
              <MiniStat label={dr.remainingUses} value={stats.remainingUses ?? '∞'} />
              <MiniStat label={adminT.promoCodes.usage.uniqueUsers} value={stats.uniqueUsers} />
            </div>
          </div>

          {/* Revenue impact */}
          <div>
            <SectionLabel icon={DollarSign}>{dr.revenueImpact}</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label={adminT.promoCodes.usage.revenueGenerated} value={fmtPrice(stats.revenueGenerated)} accent="text-recovery" />
              <MiniStat label={adminT.promoCodes.usage.discountGiven} value={fmtPrice(stats.discountGiven)} accent="text-amber-400" />
            </div>
          </div>

          {/* Recent redemptions */}
          <div>
            <SectionLabel icon={Clock}>{dr.recentRedemptions}</SectionLabel>
            {codeRedemptions.length ? (
              <div className="space-y-2">
                {codeRedemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 p-3 bg-white/4 border border-white/8 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-xs text-admin-text truncate">{r.email ?? '—'}</p>
                      <p className="text-[10px] text-admin-text-muted/60 tabular-nums">
                        {r.redeemed_at ? format(new Date(r.redeemed_at), 'MMM d, yyyy · HH:mm') : '—'}
                      </p>
                    </div>
                    <span className="text-xs text-ember tabular-nums shrink-0">
                      {r.discount_type === 'percentage' ? `${r.discount_value}%` : fmtPrice(r.discount_value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-3 bg-white/4 border border-white/8 rounded-lg">
                <Sparkles className="size-3.5 text-admin-text-muted/50 shrink-0" />
                <p className="text-[11px] text-admin-text-muted font-arabic leading-snug">{dr.noRedemptions}</p>
              </div>
            )}
          </div>

          <button
            onClick={onEdit}
            className="w-full py-2.5 text-sm text-admin-text-muted hover:text-admin-text border border-admin-border rounded-lg hover:bg-white/4 transition-colors font-arabic"
          >
            {adminT.common.edit}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── Form Modal (validation logic preserved exactly — restyled only) ──────────

function CodeModal({
  editCode,
  onClose,
}: {
  editCode: PromoCode | null;
  onClose: () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(
    editCode
      ? {
          code: editCode.code,
          title: editCode.title ?? '',
          description: editCode.description ?? '',
          service_key: editCode.service_key,
          discount_type: editCode.discount_type,
          discount_value: String(editCode.discount_value),
          max_uses: editCode.max_uses != null ? String(editCode.max_uses) : '',
          max_uses_per_customer: editCode.max_uses_per_customer != null ? String(editCode.max_uses_per_customer) : '1',
          starts_at: editCode.starts_at ? editCode.starts_at.split('T')[0] : '',
          ends_at: editCode.ends_at ? editCode.ends_at.split('T')[0] : '',
          active: editCode.active,
        }
      : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setErr('الكود مطلوب'); return; }
    if (!form.discount_value && form.discount_type !== 'free') { setErr('قيمة الخصم مطلوبة'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        title: form.title || null,
        description: form.description || null,
        service_key: form.service_key,
        discount_type: form.discount_type,
        discount_value: form.discount_type === 'free' ? 100 : Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        max_uses_per_customer: form.max_uses_per_customer ? Number(form.max_uses_per_customer) : 1,
        starts_at: form.starts_at || new Date().toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at + 'T23:59:59').toISOString() : '2099-12-31T23:59:59+00:00',
        active: form.active,
      };

      if (editCode) {
        const { error } = await (supabase as any).from('promo_codes').update(payload).eq('id', editCode.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('promo_codes').insert({ ...payload, used_count: 0 });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ['admin', 'promo-codes-v2'] });
      onClose();
    } catch (e: any) {
      setErr(e.message ?? 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const services = Object.keys(adminT.promoCodes.services);
  const discountTypes = Object.keys(adminT.promoCodes.discountTypes);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-20"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-30 p-4"
        dir="rtl"
      >
        <div className="w-full max-w-lg bg-[#0a0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
            <h3 className="text-white font-semibold font-arabic">
              {editCode ? adminT.promoCodes.form.editTitle : adminT.promoCodes.form.title}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
              <X className="size-4 text-white/40" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {err && (
              <div className="p-3 bg-crimson/10 border border-crimson/20 rounded-lg text-crimson text-sm font-arabic">
                {err}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.code}
                </label>
                <input
                  value={form.code}
                  onChange={set('code')}
                  placeholder={adminT.promoCodes.form.codePlaceholder}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors font-mono uppercase"
                  dir="ltr"
                />
                <p className="text-[9px] text-white/20 mt-1 font-arabic">{adminT.promoCodes.form.codeHint}</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.title_field}
                </label>
                <input
                  value={form.title}
                  onChange={set('title')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors font-arabic"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.service}
                </label>
                <select
                  value={form.service_key}
                  onChange={set('service_key')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors font-arabic"
                >
                  {services.map((s) => (
                    <option key={s} value={s}>{adminT.promoCodes.services[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.discountType}
                </label>
                <select
                  value={form.discount_type}
                  onChange={set('discount_type')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors font-arabic"
                >
                  {discountTypes.map((d) => (
                    <option key={d} value={d}>{adminT.promoCodes.discountTypes[d]}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.discount_type !== 'free' && (
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.discountValue}
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={set('discount_value')}
                  placeholder={adminT.promoCodes.form.discountValueHint}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.maxUses}
                </label>
                <input
                  type="number"
                  value={form.max_uses}
                  onChange={set('max_uses')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.maxUsesPerCustomer}
                </label>
                <input
                  type="number"
                  value={form.max_uses_per_customer}
                  onChange={set('max_uses_per_customer')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.startsAt}
                </label>
                <input
                  type="date"
                  value={form.starts_at}
                  onChange={set('starts_at')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.endsAt}
                </label>
                <input
                  type="date"
                  value={form.ends_at}
                  onChange={set('ends_at')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="sr-only"
              />
              <div className={cn('w-10 h-5 rounded-full transition-colors relative', form.active ? 'bg-recovery' : 'bg-white/15')}>
                <div className={cn('absolute top-0.5 w-4 h-4 bg-[#fff] rounded-full shadow transition-transform', form.active ? 'translate-x-1' : 'translate-x-5')} />
              </div>
              <span className="text-sm text-white/70 font-arabic">{adminT.promoCodes.form.active}</span>
            </label>
          </div>

          <div className="px-6 py-4 border-t border-white/6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/40 hover:text-white/70 text-sm font-arabic transition-colors"
            >
              {adminT.promoCodes.form.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors disabled:opacity-50"
            >
              {saving ? '...' : adminT.promoCodes.form.save}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminPromoCodes() {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const { data, isLoading } = usePromoAnalytics();
  const codes       = data?.codes ?? [];
  const redemptions = data?.redemptions ?? [];
  const orders      = data?.orders ?? [];

  const [search, setSearch]       = useState('');
  const [filters, setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode]   = useState<PromoCode | null>(null);
  const [selected, setSelected]   = useState<PromoCode | null>(null);
  const [copiedId, setCopiedId]   = useState<string | null>(null);
  const [drawerCopied, setDrawerCopied] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from('promo_codes').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promo-codes-v2'] }),
  });

  const statsById = useMemo(() => {
    const map = new Map<string, CodeStats>();
    codes.forEach((c) => map.set(c.id, computeCodeStats(c, redemptions, orders)));
    return map;
  }, [codes, redemptions, orders]);

  const summary           = useMemo(() => computeSummary(codes, orders), [codes, orders]);
  const servicePerf       = useMemo(() => computeServicePerformance(orders), [orders]);
  const expiringSoon      = useMemo(() => computeExpiringSoon(codes), [codes]);

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return codes.filter((c) => {
      if (q && !c.code.toLowerCase().includes(q)) return false;
      if (filters.status !== 'all' && getPromoStatus(c) !== filters.status) return false;
      if (filters.service !== 'all' && c.service_key !== filters.service) return false;
      if (filters.discountType !== 'all' && c.discount_type !== filters.discountType) return false;
      if (filters.dateFrom && new Date(c.created_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(c.created_at) > new Date(`${filters.dateTo}T23:59:59`)) return false;
      if (filters.usageMin && c.used_count < Number(filters.usageMin)) return false;
      if (filters.usageMax && c.used_count > Number(filters.usageMax)) return false;
      return true;
    });
  }, [codes, search, filters]);

  const copyCode = (code: PromoCode) => {
    navigator.clipboard.writeText(code.code).then(() => {
      setCopiedId(code.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const copyFromDrawer = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.code).then(() => {
      setDrawerCopied(true);
      setTimeout(() => setDrawerCopied(false), 2000);
    });
  };

  const openEdit = (code: PromoCode) => {
    setSelected(null);
    setEditCode(code);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditCode(null);
  };

  return (
    <AdminLayout title={adminT.promoCodes.title} subtitle={adminT.promoCodes.subtitle}>
      <AnimatePresence>
        {showModal && <CodeModal editCode={editCode} onClose={closeModal} />}
      </AnimatePresence>
      <AnimatePresence>
        {selected && (
          <PromoDetailsDrawer
            code={selected}
            stats={statsById.get(selected.id) ?? computeCodeStats(selected, redemptions, orders)}
            redemptions={redemptions}
            copied={drawerCopied}
            onCopy={copyFromDrawer}
            onClose={() => setSelected(null)}
            onEdit={() => openEdit(selected)}
          />
        )}
      </AnimatePresence>

      {/* Summary cards */}
      <SummarySection summary={summary} loading={isLoading} />

      {/* Expiring soon */}
      <ExpiringSoonWidget items={expiringSoon} loading={isLoading} />

      {/* Service performance */}
      <ServicePerformanceSection stats={servicePerf} loading={isLoading} />

      {/* Search + add */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 size-3.5 text-admin-text-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.promoCodes.search}
            className="w-full bg-admin-card border border-admin-border rounded-lg pe-9 ps-4 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted/50 font-arabic focus:outline-none focus:border-white/20 transition-colors"
            dir="ltr"
          />
        </div>
        <button
          onClick={() => { setEditCode(null); setShowModal(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors shrink-0"
        >
          <Plus className="size-4" />
          {adminT.promoCodes.addCode}
        </button>
      </div>

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Table */}
      <PromoTable
        rows={filteredCodes}
        statsById={statsById}
        onSelect={setSelected}
        onEdit={openEdit}
        onToggle={(code) => toggleMutation.mutate({ id: code.id, active: !code.active })}
        toggling={toggleMutation.isPending}
        copiedId={copiedId}
        onCopy={copyCode}
        loading={isLoading}
      />
    </AdminLayout>
  );
}
