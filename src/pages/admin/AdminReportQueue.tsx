import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Inbox,
  Search,
  X,
  Copy,
  CheckCheck,
} from 'lucide-react';
import { WorkflowStatusManager } from '@/components/admin/WorkflowStatusManager';
import { WorkflowTimeline } from '@/components/admin/WorkflowTimeline';
import { cn } from '@/lib/utils';

interface ReportRequest {
  id: string;
  valley_lead_id: string | null;
  assessment_id: string | null;
  full_name: string | null;
  email: string | null;
  company: string | null;
  risk_level: string | null;
  risk_score: number | null;
  report_type: string;
  workflow_status: string;
  payment_status: string;
  promo_code: string | null;
  promo_code_id: string | null;
  original_price: number | null;
  discount_value: number | null;
  final_price: number | null;
  primary_failure_mode: string | null;
  admin_notes: string | null;
  scheduled_for: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

type WorkflowKey = 'ALL' | 'PENDING_REVIEW' | 'DRAFT_READY' | 'APPROVED' | 'SCHEDULED' | 'SENT' | 'REJECTED';


function useReportQueue() {
  return useQuery({
    queryKey: ['admin', 'report-queue'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('report_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReportRequest[];
    },
    staleTime: 30_000,
  });
}

function WorkflowBadge({ status }: { status: string }) {
  const { t: adminT } = useAdminLanguage();
  const styles: Record<string, string> = {
    pending_review: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
    draft_ready:    'bg-sky-950/30 text-sky-400 border-sky-800/30',
    approved:       'bg-violet-950/30 text-violet-400 border-violet-800/30',
    scheduled:      'bg-recovery/8 text-recovery border-recovery/20',
    sent:           'bg-white/5 text-white/35 border-white/8',
    rejected:       'bg-crimson/10 text-crimson border-crimson/20',
  };
  const style = styles[status] ?? 'bg-white/5 text-white/35 border-white/8';
  const label = adminT.reportQueue.workflowStatus[status] ?? status;
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic', style)}>
      {label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const { t: adminT } = useAdminLanguage();
  const styles: Record<string, string> = {
    pending: 'text-amber-400',
    paid:    'text-recovery',
    free:    'text-sky-400',
    waived:  'text-violet-400',
    failed:  'text-crimson',
  };
  return (
    <span className={cn('text-[10px] font-arabic', styles[status] ?? 'text-white/40')}>
      {adminT.reportQueue.paymentStatus[status] ?? status}
    </span>
  );
}

function RiskBadge({ level }: { level: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!level) return <span className="text-white/25 text-[10px]">—</span>;
  const colors: Record<string, string> = {
    STABLE:               'text-recovery',
    EXPOSED:              'text-yellow-400',
    'INSIDE THE VALLEY':  'text-orange-400',
    'COLLAPSE PROXIMITY': 'text-crimson',
  };
  return (
    <span className={cn('text-[10px] font-medium font-arabic', colors[level] ?? 'text-white/50')}>
      {adminT.risk[level] ?? level}
    </span>
  );
}

function buildEmailPreview(r: ReportRequest): string {
  const name = r.full_name ?? 'المؤسس';
  const company = r.company ?? 'شركتكم';
  return [
    `الموضوع: تقرير خبير الفشل — تشريح ${company}`,
    '',
    `السلام عليكم ${name}،`,
    '',
    `يسعدنا إبلاغكم بأن تقرير تشريح مؤسستكم "${company}" قد اكتمل وأصبح جاهزاً للمراجعة.`,
    '',
    'يشمل التقرير:',
    '• تحليل شامل لنقاط القوة والضعف',
    '• خريطة مخاطر مفصّلة',
    '• توصيات استراتيجية أولية',
    '',
    'للحصول على التقرير أو الاستفسار، لا تترددوا في التواصل.',
    '',
    'مع تحياتي،',
    'فريق خبير الفشل',
  ].join('\n');
}

// ── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  report,
  onClose,
}: {
  report: ReportRequest;
  onClose: () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const [notes, setNotes] = useState(report.admin_notes ?? '');
  const [copied, setCopied] = useState(false);

  const notesMutation = useMutation({
    mutationFn: async (adminNotes: string) => {
      const { error } = await (supabase as any)
        .from('report_requests')
        .update({ admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', report.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'report-queue'] }),
  });

  const saveNotes = () => notesMutation.mutate(notes);

  const copyEmail = () => {
    navigator.clipboard.writeText(buildEmailPreview(report)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const riskColor: Record<string, string> = {
    STABLE:               'text-recovery',
    EXPOSED:              'text-yellow-400',
    'INSIDE THE VALLEY':  'text-orange-400',
    'COLLAPSE PROXIMITY': 'text-crimson',
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 w-[500px] bg-[#0a0d14] border-r border-white/8 z-30 flex flex-col shadow-2xl overflow-y-auto"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
        <div>
          <h3 className="text-white font-semibold font-arabic">{report.full_name ?? '—'}</h3>
          <p className="text-[11px] text-white/35 font-arabic">{report.company ?? report.email}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
          <X className="size-4 text-white/40" />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-5">

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Row 1: full_name, email */}
          <div className="p-3 bg-[#161b22] rounded-lg border border-white/6">
            <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">الاسم</p>
            <p className="text-sm text-white/70 font-arabic truncate">{report.full_name ?? '—'}</p>
          </div>
          <div className="p-3 bg-[#161b22] rounded-lg border border-white/6">
            <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">البريد</p>
            <p className="text-[11px] text-white/70 truncate dir-ltr text-left">{report.email ?? '—'}</p>
          </div>
          {/* Row 2: company, report_type */}
          <div className="p-3 bg-[#161b22] rounded-lg border border-white/6">
            <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">الشركة</p>
            <p className="text-sm text-white/70 font-arabic truncate">{report.company ?? '—'}</p>
          </div>
          <div className="p-3 bg-[#161b22] rounded-lg border border-white/6">
            <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">{adminT.reportQueue.table.reportType}</p>
            <p className="text-sm text-white/70 font-arabic">{report.report_type}</p>
          </div>
          {/* Row 3: risk_score, risk_level */}
          <div className="p-3 bg-[#161b22] rounded-lg border border-white/6">
            <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">درجة المخاطر</p>
            <p className="text-sm text-white/70 tabular-nums">
              {report.risk_score != null ? `${report.risk_score}/100` : '—'}
            </p>
          </div>
          <div className="p-3 bg-[#161b22] rounded-lg border border-white/6">
            <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">{adminT.reportQueue.table.riskLevel}</p>
            <p className={cn('text-sm font-arabic font-medium', report.risk_level ? (riskColor[report.risk_level] ?? 'text-white/50') : 'text-white/25')}>
              {report.risk_level ? (adminT.risk[report.risk_level] ?? report.risk_level) : '—'}
            </p>
          </div>
          {/* Row 4: primary_failure_mode (full width) */}
          {report.primary_failure_mode && (
            <div className="col-span-2 p-3 bg-[#161b22] rounded-lg border border-white/6">
              <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1">نمط الفشل</p>
              <p className="text-sm text-white/70 font-arabic">{report.primary_failure_mode}</p>
            </div>
          )}
        </div>

        {/* Pricing block */}
        <div className="p-3 bg-[#161b22] rounded-lg border border-white/6 space-y-2">
          <p className="text-[9px] uppercase tracking-wider text-white/25 mb-2">التسعير</p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40 font-arabic">السعر الأصلي</span>
            <span className="text-white/60 tabular-nums">
              {report.original_price != null ? `$${report.original_price}` : '—'}
            </span>
          </div>
          {report.discount_value != null && report.discount_value > 0 && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40 font-arabic">الخصم</span>
              <span className="text-recovery tabular-nums">-${report.discount_value}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[12px] font-semibold pt-1 border-t border-white/5">
            <span className="text-white/60 font-arabic">
              السعر النهائي
              {report.promo_code && (
                <span className="mr-2 text-[10px] font-mono font-normal bg-white/6 px-1.5 py-0.5 rounded text-ember">
                  {report.promo_code}
                </span>
              )}
            </span>
            <span className="text-white/80 tabular-nums">
              {report.final_price != null ? `$${report.final_price}` : '—'}
            </span>
          </div>
        </div>

        {/* Status row */}
        <div className="flex items-center gap-3 flex-wrap">
          <WorkflowBadge status={report.workflow_status} />
          <PaymentBadge status={report.payment_status} />
        </div>

        {/* Workflow engine */}
        <div className="p-3 bg-[#161b22] border border-white/6 rounded-xl">
          <p className="text-[9px] uppercase tracking-wider text-white/25 mb-3 font-arabic">
            إدارة الحالة
          </p>
          <WorkflowStatusManager
            entityType="report_request"
            entityId={report.id}
            currentStatus={report.workflow_status}
            invalidateKeys={[['admin', 'report-queue']]}
            transitionFields={{
              scheduled: [
                { name: 'scheduled_for', label: 'تاريخ الإرسال', type: 'datetime-local', required: true },
              ],
            }}
          />
        </div>

        {/* Admin notes */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-2 font-arabic">
            {adminT.reportQueue.actions.addNotes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/70 placeholder-white/20 font-arabic focus:outline-none focus:border-white/20 resize-none transition-colors"
            placeholder="ملاحظات داخلية..."
            dir="rtl"
          />
          <button
            onClick={saveNotes}
            disabled={notesMutation.isPending}
            className="mt-2 px-4 py-2 bg-white/6 hover:bg-white/10 text-white/60 hover:text-white/80 border border-white/8 rounded-lg text-[12px] font-arabic transition-colors disabled:opacity-50"
          >
            {adminT.reportQueue.actions.saveNotes}
          </button>
        </div>

        {/* Email preview */}
        <div className="bg-[#161b22] border border-white/6 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-white/30 font-arabic">
              {adminT.reportQueue.emailPreview.title}
            </p>
            <button
              onClick={copyEmail}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-all font-arabic',
                copied
                  ? 'bg-recovery/10 text-recovery border-recovery/20'
                  : 'bg-white/6 text-white/50 border-white/8 hover:bg-white/10 hover:text-white/80'
              )}
            >
              {copied ? <CheckCheck className="size-3" /> : <Copy className="size-3" />}
              {copied ? adminT.common.copied : adminT.reportQueue.actions.copyEmailPreview}
            </button>
          </div>
          <pre className="px-4 py-3 text-[11px] text-white/40 font-mono whitespace-pre-wrap leading-relaxed dir-ltr text-left">
            {buildEmailPreview(report)}
          </pre>
        </div>

        {/* Workflow history */}
        <WorkflowTimeline
          entityType="report_request"
          entityId={report.id}
          createdAt={report.created_at}
        />

        <p className="text-[10px] text-white/20 font-arabic">
          {adminT.reportQueue.table.created}: {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminReportQueue() {
  const { t: adminT } = useAdminLanguage();
  const { data: reports = [], isLoading } = useReportQueue();
  const [search, setSearch] = useState('');
  const [wFilter, setWFilter] = useState<WorkflowKey>('ALL');
  const [selected, setSelected] = useState<ReportRequest | null>(null);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (r.full_name ?? '').toLowerCase().includes(q) ||
      (r.email ?? '').toLowerCase().includes(q) ||
      (r.company ?? '').toLowerCase().includes(q);
    const matchesFilter =
      wFilter === 'ALL' || r.workflow_status === wFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const wFilterKeys = Object.keys(adminT.reportQueue.filters.workflow) as WorkflowKey[];

  return (
    <AdminLayout title={adminT.reportQueue.title} subtitle={adminT.reportQueue.subtitle}>
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-20"
              onClick={() => setSelected(null)}
            />
            <DetailPanel report={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.reportQueue.search}
            className="w-full bg-[#161b22] border border-white/8 rounded-lg px-4 py-2.5 pr-9 text-sm text-white/80 placeholder-white/25 font-arabic focus:outline-none focus:border-white/20 transition-colors"
            dir="rtl"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {wFilterKeys.map((key) => (
            <button
              key={key}
              onClick={() => setWFilter(key)}
              className={cn(
                'px-3 py-2 rounded-lg text-[11px] border transition-all font-arabic',
                wFilter === key
                  ? 'bg-ember/10 text-white border-ember/20'
                  : 'bg-[#161b22] text-white/40 border-white/8 hover:text-white/70 hover:border-white/15'
              )}
            >
              {adminT.reportQueue.filters.workflow[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-white/6 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-6 py-3 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-wider font-arabic">
          <span>{adminT.reportQueue.table.requester}</span>
          <span>{adminT.reportQueue.table.reportType}</span>
          <span>{adminT.reportQueue.table.riskLevel}</span>
          <span>{adminT.reportQueue.table.payment}</span>
          <span>{adminT.reportQueue.table.workflow}</span>
          <span>{adminT.reportQueue.table.created}</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/4 rounded animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-20 text-center">
            <Inbox className="size-10 text-white/8 mx-auto mb-4" />
            <p className="text-white/30 text-sm font-arabic">{adminT.reportQueue.empty}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(r)}
                className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-6 py-4 items-center hover:bg-white/3 transition-colors text-right"
              >
                <div className="min-w-0 text-right">
                  <p className="text-sm text-white/80 truncate font-arabic">{r.full_name ?? '—'}</p>
                  <p className="text-[11px] text-white/30 truncate">{r.email}</p>
                </div>
                <span className="text-sm text-white/50 font-arabic truncate">{r.report_type}</span>
                <RiskBadge level={r.risk_level} />
                <PaymentBadge status={r.payment_status} />
                <WorkflowBadge status={r.workflow_status} />
                <span className="text-[10px] text-white/30">
                  {format(new Date(r.created_at), 'MMM d')}
                </span>
              </motion.button>
            ))}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-[10px] text-white/20 font-arabic">
              {filtered.length} من {reports.length} طلب
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
