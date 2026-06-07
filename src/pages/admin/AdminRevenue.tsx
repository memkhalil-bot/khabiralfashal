import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Search, ChevronDown, ChevronUp } from 'lucide-react';
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

type RevenueRecord = BookingRecord | ReportRecord;

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<string, string> = {
  founder_call:      'مكالمة المؤسس',
  startup_autopsy:   'تشريح الشركة',
  emergency_session: 'جلسة طارئة',
};

const PAYMENT_STATUSES = ['ALL', 'pending', 'paid', 'free', 'waived', 'failed'] as const;

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

function paymentStatusLabel(status: string | null): string {
  switch (status) {
    case 'pending':  return 'معلق';
    case 'paid':     return 'مدفوع';
    case 'free':     return 'مجاني';
    case 'waived':   return 'معفو';
    case 'failed':   return 'فشل الدفع';
    default:         return status ?? '—';
  }
}

function serviceLabel(rec: RevenueRecord): string {
  if (rec.source === 'booking') {
    return SESSION_TYPE_LABELS[rec.session_type] ?? rec.session_type;
  }
  return (rec as ReportRecord).report_type ?? '—';
}

// ── Query ─────────────────────────────────────────────────────────────────────

function useRevenue() {
  return useQuery({
    queryKey: ['admin', 'revenue'],
    queryFn: async () => {
      const [bookingsRes, reportsRes] = await Promise.all([
        (supabase as any)
          .from('booking_requests')
          .select('id, full_name, email, company, session_type, original_price, promo_code, discount_value, final_price, payment_status, created_at'),
        (supabase as any)
          .from('report_requests')
          .select('id, full_name, email, company, report_type, original_price, promo_code, discount_value, final_price, payment_status, workflow_status, created_at'),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      const bookings: BookingRecord[] = (bookingsRes.data ?? []).map((r: any) => ({
        ...r,
        source: 'booking' as const,
      }));
      const reports: ReportRecord[] = (reportsRes.data ?? []).map((r: any) => ({
        ...r,
        source: 'report' as const,
      }));

      const combined: RevenueRecord[] = [...bookings, ...reports].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return combined;
    },
    staleTime: 30_000,
  });
}

// ── Payment status popover ────────────────────────────────────────────────────

const PAYMENT_OPTIONS = ['pending', 'paid', 'free', 'waived', 'failed'] as const;

function StatusPopover({
  record,
  onClose,
}: {
  record: RevenueRecord;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const table = record.source === 'booking' ? 'booking_requests' : 'report_requests';
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
      className="absolute left-0 top-full mt-1 z-50 bg-[#1a2235] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[120px]"
    >
      {PAYMENT_OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => mutation.mutate(opt)}
          disabled={mutation.isPending}
          className={cn(
            'w-full text-right px-3 py-2 text-xs font-arabic transition-colors hover:bg-white/6 disabled:opacity-50',
            record.payment_status === opt ? 'bg-white/4' : '',
            paymentStatusClass(opt)
          )}
        >
          {paymentStatusLabel(opt)}
        </button>
      ))}
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

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
    <div className="bg-[#161d27] border border-white/6 rounded-xl p-5">
      <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-arabic mb-2">{label}</p>
      <p className="text-2xl font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-white/25 font-arabic mt-1">{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminRevenue() {
  const { data = [], isLoading } = useRevenue();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalRevenue = data
    .filter((r) => r.payment_status === 'paid')
    .reduce((acc, r) => acc + (r.final_price ?? 0), 0);

  const paidSessions = data.filter(
    (r) => r.source === 'booking' && r.payment_status === 'paid'
  ).length;

  const paidReports = data.filter(
    (r) => r.source === 'report' && r.payment_status === 'paid'
  ).length;

  const freePromo = data.filter((r) => r.payment_status === 'free').length;

  // ── Filtered rows ──────────────────────────────────────────────────────────

  const filtered = data.filter((r) => {
    const q = search.toLowerCase();
    if (q && !r.full_name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) {
      return false;
    }
    if (statusFilter !== 'ALL' && r.payment_status !== statusFilter) return false;
    return true;
  });

  const TABLE_HEADERS = [
    'العميل',
    'المصدر',
    'الخدمة',
    'السعر الأصلي',
    'الخصم',
    'السعر النهائي',
    'كود الخصم',
    'حالة الدفع',
    'التاريخ',
  ];

  return (
    <AdminLayout title="الإيرادات" subtitle="تتبع المدفوعات والإيرادات">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي الإيرادات" value={`$${totalRevenue}`} />
        <StatCard label="جلسات مدفوعة" value={paidSessions} />
        <StatCard label="تقارير مدفوعة" value={paidReports} />
        <StatCard label="مجاني / بروموكود" value={freePromo} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full bg-[#161d27] border border-white/8 rounded-lg pe-9 ps-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-colors font-arabic"
            dir="rtl"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-[#161d27] border border-white/8 rounded-lg ps-4 pe-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-white/20 transition-colors font-arabic cursor-pointer"
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'الكل' : paymentStatusLabel(s)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161d27] border border-white/6 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white/4 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <DollarSign className="size-10 text-white/8" />
            <p className="text-white/30 text-sm font-arabic">لا توجد سجلات إيرادات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6 bg-[#0f1520]">
                  {TABLE_HEADERS.map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-start text-[10px] tracking-[0.18em] uppercase text-white/25 font-arabic font-normal whitespace-nowrap"
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
                    {/* العميل */}
                    <td className="px-4 py-3">
                      <p className="text-white/80 font-arabic font-medium text-sm">{rec.full_name}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{rec.email}</p>
                    </td>

                    {/* المصدر */}
                    <td className="px-4 py-3">
                      {rec.source === 'booking' ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-sky-950/30 text-sky-400 border-sky-800/30 font-arabic">
                          جلسة
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-violet-950/30 text-violet-400 border-violet-800/30 font-arabic">
                          تقرير
                        </span>
                      )}
                    </td>

                    {/* الخدمة */}
                    <td className="px-4 py-3">
                      <span className="text-white/55 font-arabic text-xs">{serviceLabel(rec)}</span>
                    </td>

                    {/* السعر الأصلي */}
                    <td className="px-4 py-3">
                      <span className="text-white/45 text-xs tabular-nums">{fmtPrice(rec.original_price)}</span>
                    </td>

                    {/* الخصم */}
                    <td className="px-4 py-3">
                      <span className="text-white/45 text-xs tabular-nums">{fmtPrice(rec.discount_value)}</span>
                    </td>

                    {/* السعر النهائي */}
                    <td className="px-4 py-3">
                      <span className="text-white/80 text-sm font-semibold tabular-nums">{fmtPrice(rec.final_price)}</span>
                    </td>

                    {/* كود الخصم */}
                    <td className="px-4 py-3">
                      {rec.promo_code ? (
                        <code className="text-[11px] font-mono bg-white/6 px-1.5 py-0.5 rounded text-white/50">
                          {rec.promo_code}
                        </code>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>

                    {/* حالة الدفع */}
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
                          {paymentStatusLabel(rec.payment_status)}
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

                    {/* التاريخ */}
                    <td className="px-4 py-3">
                      <span className="text-white/30 text-xs">
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
