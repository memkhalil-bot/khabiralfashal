import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollText, RefreshCw, Search } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityRecord {
  id: string;
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Filters {
  search: string;
  action: string;
  from: string;
  to: string;
}

// ── Action styles & labels ─────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  approved_report:        'text-recovery bg-recovery/8 border-recovery/20',
  rejected_report:        'text-crimson bg-crimson/10 border-crimson/20',
  scheduled_report:       'text-sky-400 bg-sky-950/20 border-sky-800/30',
  sent_report:            'text-violet-400 bg-violet-950/20 border-violet-800/30',
  confirmed_session:      'text-recovery bg-recovery/8 border-recovery/20',
  created_promo_code:     'text-amber-400 bg-amber-950/20 border-amber-800/30',
  updated_payment_status: 'text-ember bg-ember/10 border-ember/20',
  added_team_member:      'text-sky-400 bg-sky-950/20 border-sky-800/30',
};

const DEFAULT_ACTION_COLOR = 'text-white/40 bg-white/5 border-white/8';

const ACTION_LABELS: Record<string, string> = {
  approved_report:        'موافقة على تقرير',
  rejected_report:        'رفض تقرير',
  scheduled_report:       'جدولة تقرير',
  sent_report:            'إرسال تقرير',
  confirmed_session:      'تأكيد جلسة',
  created_promo_code:     'إنشاء كود خصم',
  updated_payment_status: 'تحديث حالة الدفع',
  added_team_member:      'إضافة عضو',
};

function actionBadgeClass(action: string) {
  return ACTION_COLORS[action] ?? DEFAULT_ACTION_COLOR;
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminActivityLog() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    action: 'ALL',
    from: '',
    to: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'activity-log', page, filters, refreshKey],
    queryFn: async () => {
      let q = (supabase as any)
        .from('activity_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, page * 50 - 1);

      if (filters.search) {
        q = q.or(
          `description.ilike.%${filters.search}%,admin_email.ilike.%${filters.search}%`,
        );
      }
      if (filters.action !== 'ALL') {
        q = q.eq('action', filters.action);
      }
      if (filters.from) {
        q = q.gte('created_at', filters.from);
      }
      if (filters.to) {
        q = q.lte('created_at', filters.to + 'T23:59:59Z');
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { records: (data ?? []) as ActivityRecord[], total: count ?? 0 };
    },
  });

  // Reset to page 1 when filters change
  function applyFilter(partial: Partial<Filters>) {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  // Derive unique action types from loaded records for the dropdown
  const actionTypes = useMemo(() => {
    if (!data?.records) return [];
    const seen = new Set<string>();
    for (const r of data.records) {
      seen.add(r.action);
    }
    return Array.from(seen).sort();
  }, [data?.records]);

  const records = data?.records ?? [];
  const total = data?.total ?? 0;
  const hasMore = total > page * 50;

  return (
    <AdminLayout title="سجل النشاط" subtitle="كل الإجراءات الإدارية">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => applyFilter({ search: e.target.value })}
            placeholder="بحث في الوصف أو البريد..."
            className="font-arabic w-full bg-[#161d27] border border-white/10 rounded-lg pr-9 pl-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25"
          />
        </div>

        {/* Action type filter */}
        <select
          value={filters.action}
          onChange={(e) => applyFilter({ action: e.target.value })}
          className="font-arabic bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 min-w-[160px]"
        >
          <option value="ALL">كل الإجراءات</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {actionLabel(a)}
            </option>
          ))}
        </select>

        {/* Date from */}
        <input
          type="date"
          value={filters.from}
          onChange={(e) => applyFilter({ from: e.target.value })}
          className="bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25"
        />

        {/* Date to */}
        <input
          type="date"
          value={filters.to}
          onChange={(e) => applyFilter({ to: e.target.value })}
          className="bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25"
        />

        {/* Refresh */}
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm font-arabic text-white/50 hover:text-white/80 bg-white/5 border border-white/8 rounded-lg px-4 py-2.5 transition-colors"
        >
          <RefreshCw size={14} className={cn(isFetching && 'animate-spin')} />
          تحديث
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#161d27] border border-white/6 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-white/30 font-arabic text-sm">
            جارٍ التحميل...
          </div>
        ) : records.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/30">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <ScrollText size={24} className="text-white/20" />
            </div>
            <span className="font-arabic text-sm">لا يوجد نشاط مسجل بعد</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="font-arabic text-white/30 text-xs font-medium text-right px-5 py-3.5 whitespace-nowrap">
                    الوقت
                  </th>
                  <th className="font-arabic text-white/30 text-xs font-medium text-right px-5 py-3.5 whitespace-nowrap">
                    المشرف
                  </th>
                  <th className="font-arabic text-white/30 text-xs font-medium text-right px-5 py-3.5 whitespace-nowrap">
                    الإجراء
                  </th>
                  <th className="font-arabic text-white/30 text-xs font-medium text-right px-5 py-3.5 whitespace-nowrap">
                    الكيان
                  </th>
                  <th className="font-arabic text-white/30 text-xs font-medium text-right px-5 py-3.5">
                    الوصف
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {records.map((record) => (
                  <ActivityRow key={record.id} record={record} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !isLoading && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
            className="font-arabic text-sm text-white/60 hover:text-white bg-white/5 border border-white/8 rounded-lg px-6 py-2.5 transition-colors"
          >
            {isFetching ? 'جارٍ التحميل...' : `تحميل المزيد (${total - records.length} متبقٍ)`}
          </button>
        </div>
      )}
    </AdminLayout>
  );
}

// ── Activity Row ───────────────────────────────────────────────────────────────

function ActivityRow({ record }: { record: ActivityRecord }) {
  const entityDisplay = [record.entity_type, record.entity_id]
    .filter(Boolean)
    .join(' · ');

  const entityTruncated =
    entityDisplay.length > 40 ? entityDisplay.slice(0, 40) + '…' : entityDisplay;

  return (
    <tr className="hover:bg-white/2 transition-colors">
      {/* الوقت */}
      <td className="px-5 py-3.5 whitespace-nowrap text-white/40 text-xs font-mono">
        {format(new Date(record.created_at), 'MMM d, HH:mm')}
      </td>

      {/* المشرف */}
      <td className="px-5 py-3.5 whitespace-nowrap text-white/60 text-xs max-w-[180px] truncate">
        {record.admin_email ?? '—'}
      </td>

      {/* الإجراء */}
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span
          className={cn(
            'font-arabic text-[11px] font-medium border rounded-full px-2.5 py-0.5',
            actionBadgeClass(record.action),
          )}
        >
          {actionLabel(record.action)}
        </span>
      </td>

      {/* الكيان */}
      <td className="px-5 py-3.5 whitespace-nowrap text-white/35 text-xs font-mono">
        {entityTruncated || '—'}
      </td>

      {/* الوصف */}
      <td className="px-5 py-3.5 text-white/55 text-xs font-arabic max-w-[320px]">
        {record.description ?? '—'}
      </td>
    </tr>
  );
}
