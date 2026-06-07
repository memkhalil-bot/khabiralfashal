import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABLE_ARABIC: Record<string, string> = {
  valley_leads:           'عملاء الوادي',
  founder_assessments:    'تقييمات المؤسسين',
  booking_requests:       'طلبات الحجز',
  report_requests:        'طلبات التقارير',
  promo_codes:            'أكواد الخصم',
  promo_code_redemptions: 'استخدامات أكواد الخصم',
  advisory_sessions:      'جلسات الإرشاد',
  user_roles:             'أدوار المستخدمين',
};

const TABLE_KEYS = [
  'valley_leads',
  'founder_assessments',
  'booking_requests',
  'report_requests',
  'promo_codes',
  'promo_code_redemptions',
  'advisory_sessions',
  'user_roles',
] as const;

// ── Queries ───────────────────────────────────────────────────────────────────

function useUserRole(userId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'debug', 'role', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return (data as { role: string })?.role ?? null;
    },
    staleTime: 60_000,
  });
}

function useRowCounts() {
  return useQuery({
    queryKey: ['admin', 'debug', 'counts'],
    queryFn: async () => {
      const [
        valleyLeadsRes,
        founderAssessmentsRes,
        bookingRequestsRes,
        reportRequestsRes,
        promoCodesRes,
        promoRedemptionsRes,
        advisorySessionsRes,
        userRolesRes,
      ] = await Promise.all([
        supabase.from('valley_leads').select('id', { count: 'exact', head: true }),
        (supabase as any).from('founder_assessments').select('id', { count: 'exact', head: true }),
        supabase.from('booking_requests').select('id', { count: 'exact', head: true }),
        supabase.from('report_requests').select('id', { count: 'exact', head: true }),
        supabase.from('promo_codes').select('id', { count: 'exact', head: true }),
        (supabase as any).from('promo_code_redemptions').select('id', { count: 'exact', head: true }),
        (supabase as any).from('advisory_sessions').select('id', { count: 'exact', head: true }),
        (supabase as any).from('user_roles').select('id', { count: 'exact', head: true }),
      ]);

      return {
        valley_leads:           valleyLeadsRes.count ?? 0,
        founder_assessments:    founderAssessmentsRes.count ?? 0,
        booking_requests:       bookingRequestsRes.count ?? 0,
        report_requests:        reportRequestsRes.count ?? 0,
        promo_codes:            promoCodesRes.count ?? 0,
        promo_code_redemptions: promoRedemptionsRes.count ?? 0,
        advisory_sessions:      advisorySessionsRes.count ?? 0,
        user_roles:             userRolesRes.count ?? 0,
      };
    },
    staleTime: 30_000,
  });
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] text-white/35 font-arabic">{label}</span>
      <span className={cn('text-xs text-white/70', mono ? 'font-mono' : 'font-arabic')}>
        {value}
      </span>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#161d27] border border-white/6 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/5">
        <p className="text-[10px] tracking-[0.22em] uppercase text-white/30 font-arabic font-medium">
          {title}
        </p>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

// ── Count card ────────────────────────────────────────────────────────────────

function CountCard({
  tableKey,
  count,
  loading,
  index,
}: {
  tableKey: string;
  count: number;
  loading: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#161d27] border border-white/6 rounded-xl p-5"
    >
      <p className="text-xs text-white/50 font-arabic mb-2">{TABLE_ARABIC[tableKey]}</p>
      {loading ? (
        <div className="h-8 w-16 bg-white/6 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-semibold text-white tabular-nums">{count}</p>
      )}
      <p className="text-[10px] text-white/20 font-mono mt-1.5">{tableKey}</p>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminDebug() {
  const { user } = useAdminAuth();
  const qc = useQueryClient();
  const { data: role, isLoading: roleLoading } = useUserRole(user?.id);
  const { data: counts, isLoading: countsLoading } = useRowCounts();

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'debug'] });
  };

  return (
    <AdminLayout
      title="لوحة التشخيص"
      subtitle="أدوات التحقق من البيانات"
    >
      {/* Refresh button */}
      <div className="flex items-center justify-between mb-6">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-amber-950/40 text-amber-400 border border-amber-800/30">
          DEV
        </span>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-white/4 hover:bg-white/8 border border-white/8 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors font-arabic"
        >
          <RefreshCw className="size-3.5" />
          تحديث
        </button>
      </div>

      <div className="space-y-5">
        {/* Project Info */}
        <Card title="معلومات المشروع">
          <InfoRow
            label="Supabase URL"
            value={import.meta.env.VITE_SUPABASE_URL ?? '—'}
            mono
          />
          <InfoRow
            label="البيئة"
            value={import.meta.env.MODE}
            mono
          />
        </Card>

        {/* Current User */}
        <Card title="المستخدم الحالي">
          <InfoRow label="المعرّف" value={user?.id ?? '—'} mono />
          <InfoRow label="البريد الإلكتروني" value={user?.email ?? '—'} />
          <InfoRow
            label="الدور"
            value={roleLoading ? 'جارٍ التحميل...' : (role ?? '—')}
          />
        </Card>

        {/* Row counts */}
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-white/25 font-arabic mb-3">
            عدد السجلات
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {TABLE_KEYS.map((key, i) => (
              <CountCard
                key={key}
                tableKey={key}
                count={counts?.[key] ?? 0}
                loading={countsLoading}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
