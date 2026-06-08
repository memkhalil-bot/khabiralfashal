import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { WORKFLOW_STATUS_LABELS, WORKFLOW_STATUS_STYLES } from '@/lib/workflowEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { WorkflowStatusManager } from '@/components/admin/WorkflowStatusManager';
import { WorkflowTimeline } from '@/components/admin/WorkflowTimeline';
import {
  Package,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Mail,
  Globe,
  Gauge,
  UserCog,
  Tag,
  CircleDollarSign,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FailKitRequest {
  id:                  string;
  request_number:      string | null;
  full_name:           string;
  email:               string;
  country:             string | null;
  assessment_id:       string | null;
  valley_lead_id:      string | null;
  risk_score:          number | null;
  failure_category:    string | null;
  severity:            string | null;
  urgency_level:       string | null;
  status:              string;
  recommended_service: string | null;
  payment_status:      string;
  price:               number;
  discount:            number | null;
  final_price:         number | null;
  assigned_to:         string | null;
  admin_notes:         string | null;
  created_at:          string;
  updated_at:          string;
}

// ── Enumerations (mirrors DB CHECK constraints) ──────────────────────────────

const STATUS_KEYS   = ['requested', 'under_review', 'approved', 'scheduled', 'delivered', 'follow_up', 'closed'];
const CATEGORY_KEYS = ['Founder Conflict', 'Cash Burn', 'Product Market Fit', 'Fundraising', 'Team Issues', 'Operations'];
const SEVERITY_KEYS = ['Low', 'Medium', 'High', 'Critical'];
const URGENCY_KEYS  = ['Green', 'Yellow', 'Red', 'Black'];

// ── Badges ────────────────────────────────────────────────────────────────────

function badgeCls(style: string) {
  return cn('inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic whitespace-nowrap', style);
}

function StatusBadge({ status }: { status: string }) {
  const label = WORKFLOW_STATUS_LABELS.fail_kit_request?.[status] ?? status;
  const style = WORKFLOW_STATUS_STYLES[status] ?? 'bg-white/5 text-white/40 border-white/10';
  return <span className={badgeCls(style)}>{label}</span>;
}

function CategoryBadge({ category }: { category: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!category) return <span className="text-white/20 text-xs">—</span>;
  const label = adminT.failKit.category[category] ?? category;
  return <span className={badgeCls('bg-white/5 text-white/50 border-white/10')}>{label}</span>;
}

const SEVERITY_STYLE: Record<string, string> = {
  Low:      'bg-white/5 text-white/40 border-white/10',
  Medium:   'bg-amber-950/30 text-amber-400 border-amber-800/30',
  High:     'bg-orange-950/30 text-orange-400 border-orange-800/30',
  Critical: 'bg-crimson/10 text-crimson border-crimson/25',
};

function SeverityBadge({ severity }: { severity: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!severity) return <span className="text-white/20 text-xs">—</span>;
  const label = adminT.failKit.severity[severity] ?? severity;
  return <span className={badgeCls(SEVERITY_STYLE[severity] ?? 'bg-white/5 text-white/40 border-white/10')}>{label}</span>;
}

const URGENCY_STYLE: Record<string, string> = {
  Green:  'bg-emerald-950/30 text-emerald-400 border-emerald-800/30',
  Yellow: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
  Red:    'bg-crimson/10 text-crimson border-crimson/25',
  Black:  'bg-white/10 text-white/70 border-white/20',
};

function UrgencyBadge({ urgency }: { urgency: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!urgency) return <span className="text-white/20 text-xs">—</span>;
  const label = adminT.failKit.urgency[urgency] ?? urgency;
  return <span className={badgeCls(URGENCY_STYLE[urgency] ?? 'bg-white/5 text-white/40 border-white/10')}>{label}</span>;
}

function RiskScore({ score }: { score: number | null }) {
  if (score === null || score === undefined) return <span className="text-white/20 text-xs">—</span>;
  const color = score >= 75 ? 'text-crimson' : score >= 50 ? 'text-amber-400' : score >= 25 ? 'text-sky-400' : 'text-emerald-400';
  return <span className={cn('font-medium tabular-nums text-xs', color)}>{score}</span>;
}

// ── Queries / mutations ───────────────────────────────────────────────────────

function useFailKitRequests() {
  return useQuery({
    queryKey: ['admin', 'fail-kit'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('fail_kit_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as FailKitRequest[];
    },
    staleTime: 30_000,
  });
}

function useUpdateFailKit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FailKitRequest> }) => {
      const { error } = await (supabase as any)
        .from('fail_kit_requests')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'fail-kit'] }),
  });
}

function useTeamMembers() {
  return useQuery({
    queryKey: ['admin', 'team-members'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('display_name')
        .eq('active', true);
      if (error) throw error;
      const names = (data ?? []).map((r: { display_name: string | null }) => r.display_name).filter(Boolean) as string[];
      return Array.from(new Set(names));
    },
    staleTime: 60_000,
  });
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  request,
  teamMembers,
  onClose,
}: {
  request:     FailKitRequest;
  teamMembers: string[];
  onClose:     () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const [notes, setNotes]             = useState(request.admin_notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const update = useUpdateFailKit();

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await update.mutateAsync({ id: request.id, updates: { admin_notes: notes } });
    setSavingNotes(false);
  };

  const handleAssign = async (value: string) => {
    await update.mutateAsync({ id: request.id, updates: { assigned_to: value || null } });
  };

  const finalPrice = request.final_price ?? request.price;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-[360px] shrink-0 bg-[#0b0b0b] border-r border-white/5 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <p className="text-sm text-white/80 font-arabic">{request.full_name}</p>
          <p className="text-[10px] text-white/35 font-arabic mt-0.5">
            {request.request_number ?? '—'}
            {request.created_at && ` · ${format(new Date(request.created_at), 'PPP')}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="size-7 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={request.status} />
          <CategoryBadge category={request.failure_category} />
          <SeverityBadge severity={request.severity} />
          <UrgencyBadge urgency={request.urgency_level} />
        </div>

        {/* Contact info */}
        <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 space-y-3">
          {[
            { icon: Mail,  val: request.email },
            { icon: Globe, val: request.country },
          ].map(({ icon: Icon, val }) => val && (
            <div key={val} className="flex items-center gap-3 text-xs text-white/60">
              <Icon className="size-3.5 text-white/25 shrink-0" />
              <span className="font-arabic">{val}</span>
            </div>
          ))}
        </div>

        {/* Assessment info */}
        <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 space-y-3">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-arabic">{adminT.failKit.detail.assessment}</p>
          <div className="flex items-center gap-3 text-xs text-white/60">
            <Gauge className="size-3.5 text-white/25 shrink-0" />
            <span className="text-white/40 font-arabic">{adminT.failKit.table.risk}:</span>
            <RiskScore score={request.risk_score} />
          </div>
          {request.recommended_service && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <Tag className="size-3.5 text-white/25 shrink-0" />
              <span className="font-arabic">{request.recommended_service}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <CircleDollarSign className="size-3.5 text-white/25 shrink-0" />
            <span className="font-arabic">{adminT.failKit.detail.price}:</span>
            <span className="tabular-nums">${finalPrice}</span>
            {request.discount ? <span className="text-white/30 text-[10px]">(−${request.discount})</span> : null}
            <span className="text-white/30 text-[10px] font-arabic">· {adminT.failKit.detail.payment}: {request.payment_status}</span>
          </div>
        </div>

        {/* Assign to */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-arabic flex items-center gap-2">
            <UserCog className="size-3.5 text-white/25" />
            {adminT.failKit.detail.assignTo}
          </p>
          <div className="relative">
            <select
              value={request.assigned_to ?? ''}
              onChange={(e) => handleAssign(e.target.value)}
              className="w-full appearance-none bg-white/4 border border-white/8 rounded-lg ps-3 pe-8 py-2 text-sm text-white/70 focus:outline-none focus:border-ember/40 font-arabic cursor-pointer"
            >
              <option value="">{adminT.failKit.unassigned}</option>
              {teamMembers.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Workflow status manager */}
        <div className="p-3 bg-[#0f0f0f] border border-white/6 rounded-xl">
          <p className="text-[9px] uppercase tracking-wider text-white/25 mb-3 font-arabic">{adminT.failKit.detail.workflow}</p>
          <WorkflowStatusManager
            entityType="fail_kit_request"
            entityId={request.id}
            currentStatus={request.status}
            entityName={request.full_name}
            invalidateKeys={[['admin', 'fail-kit']]}
          />
        </div>

        {/* Admin notes */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-arabic">
            {adminT.failKit.detail.notes}
          </p>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/4 border border-white/8 rounded-lg text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-ember/40 transition-colors resize-none font-arabic text-right"
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-2 px-4 py-1.5 bg-ember/10 hover:bg-ember/20 border border-ember/25 text-ember text-[11px] rounded-lg transition-all disabled:opacity-50 font-arabic"
          >
            {savingNotes ? adminT.common.loading : adminT.failKit.detail.notesSave}
          </button>
        </div>

        {/* Workflow history */}
        <WorkflowTimeline
          entityType="fail_kit_request"
          entityId={request.id}
          createdAt={request.created_at}
        />
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminFailKit() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading, error }  = useFailKitRequests();
  const { data: teamMembers = [] }  = useTeamMembers();

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatus]       = useState('ALL');
  const [categoryFilter, setCategory]   = useState('ALL');
  const [severityFilter, setSeverity]   = useState('ALL');
  const [urgencyFilter, setUrgency]     = useState('ALL');
  const [assignedFilter, setAssigned]   = useState('ALL');
  const [selected, setSelected]         = useState<FailKitRequest | null>(null);

  const assignedOptions = Array.from(
    new Set((data ?? []).map((r) => r.assigned_to).filter(Boolean))
  ) as string[];

  const filtered = (data ?? []).filter((r) => {
    const q = search.toLowerCase();
    if (q && !r.full_name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && r.failure_category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
    if (urgencyFilter !== 'ALL' && r.urgency_level !== urgencyFilter) return false;
    if (assignedFilter !== 'ALL') {
      if (assignedFilter === 'UNASSIGNED' ? !!r.assigned_to : r.assigned_to !== assignedFilter) return false;
    }
    return true;
  });

  const total   = data?.length ?? 0;
  const pending = data?.filter((r) => r.status === 'requested' || r.status === 'under_review').length ?? 0;

  const selectCls = 'appearance-none bg-[#0d0d0d] border border-white/8 rounded-lg ps-4 pe-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-ember/40 font-arabic cursor-pointer';

  return (
    <AdminLayout
      title={adminT.failKit.title}
      subtitle={`${total} طلب · ${pending} بانتظار المراجعة`}
    >
      {/* Filters row */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.failKit.search}
            className="w-full bg-[#0d0d0d] border border-white/8 rounded-lg pe-10 ps-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-ember/40 font-arabic"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
              <option value="ALL">{adminT.failKit.filters.status}: {adminT.common.all}</option>
              {STATUS_KEYS.map((s) => (
                <option key={s} value={s}>{adminT.failKit.statuses[s] ?? s}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={categoryFilter} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
              <option value="ALL">{adminT.failKit.filters.category}: {adminT.common.all}</option>
              {CATEGORY_KEYS.map((c) => (
                <option key={c} value={c}>{adminT.failKit.category[c] ?? c}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={severityFilter} onChange={(e) => setSeverity(e.target.value)} className={selectCls}>
              <option value="ALL">{adminT.failKit.filters.severity}: {adminT.common.all}</option>
              {SEVERITY_KEYS.map((s) => (
                <option key={s} value={s}>{adminT.failKit.severity[s] ?? s}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={urgencyFilter} onChange={(e) => setUrgency(e.target.value)} className={selectCls}>
              <option value="ALL">{adminT.failKit.filters.urgency}: {adminT.common.all}</option>
              {URGENCY_KEYS.map((u) => (
                <option key={u} value={u}>{adminT.failKit.urgency[u] ?? u}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={assignedFilter} onChange={(e) => setAssigned(e.target.value)} className={selectCls}>
              <option value="ALL">{adminT.failKit.filters.assignedTo}: {adminT.common.all}</option>
              <option value="UNASSIGNED">{adminT.failKit.unassigned}</option>
              {assignedOptions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-crimson/8 border border-crimson/20 rounded-lg">
          <AlertCircle className="size-4 text-crimson shrink-0" />
          <p className="text-sm text-crimson/80 font-arabic">
            تعذّر تحميل طلبات حقيبة الفشل. تأكد من تطبيق ترحيل قاعدة البيانات.
          </p>
        </div>
      )}

      <div className="flex gap-0 h-[calc(100vh-280px)]">
        {/* Table */}
        <div className={cn(
          'flex-1 min-w-0 overflow-auto rounded-xl border border-white/6',
          selected && 'rounded-e-none border-e-0'
        )}>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 bg-white/4 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Package className="size-10 text-white/10" />
              <p className="text-white/30 text-sm font-arabic">{adminT.failKit.empty}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0a0a]">
                  {[
                    adminT.failKit.table.requestId,
                    adminT.failKit.table.founder,
                    adminT.failKit.table.category,
                    adminT.failKit.table.risk,
                    adminT.failKit.table.severity,
                    adminT.failKit.table.urgency,
                    adminT.failKit.table.status,
                    adminT.failKit.table.assigned,
                    adminT.failKit.table.date,
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-start text-[10px] tracking-[0.2em] uppercase text-white/30 font-arabic font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {filtered.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => setSelected((prev) => prev?.id === r.id ? null : r)}
                    className={cn(
                      'cursor-pointer transition-colors group',
                      selected?.id === r.id ? 'bg-ember/5' : 'hover:bg-white/3'
                    )}
                  >
                    <td className="px-4 py-3">
                      <span className="text-white/45 text-xs tabular-nums">{r.request_number ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white/80 font-arabic font-medium">{r.full_name}</p>
                      <p className="text-[11px] text-white/35 font-arabic mt-0.5">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={r.failure_category} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskScore score={r.risk_score} />
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <UrgencyBadge urgency={r.urgency_level} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/55 font-arabic text-xs">
                        {r.assigned_to ?? <span className="text-white/20">{adminT.failKit.unassigned}</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/35 text-xs">
                        {r.created_at && format(new Date(r.created_at), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronLeft className="size-3.5 text-white/15 group-hover:text-ember/50 transition-colors" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <DetailPanel
              key={selected.id}
              request={selected}
              teamMembers={teamMembers}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
