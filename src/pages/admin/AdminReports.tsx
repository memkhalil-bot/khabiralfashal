import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type AutopsyReport = Tables<'autopsy_reports'>;

// ── Status filter ──────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['ALL', 'DRAFT', 'FINAL', 'DELIVERED'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

const FAILURE_MODES = [
  'Financial denial',
  'Leadership isolation',
  'Decision paralysis',
  'Concentration risk',
  'Burnout proximity',
  'Identity fusion',
  'Founder denial',
  'No exit plan',
  'Multiple patterns',
] as const;

const BLIND_SPOT_LABELS = [
  'Financial denial',
  'Leadership isolation',
  'Decision paralysis',
  'Concentration risk',
  'Burnout proximity',
  'Identity fusion',
  'Founder denial',
  'No exit plan',
] as const;

function StatusPill({ status }: { status: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!status) return null;
  const styles: Record<string, string> = {
    draft:     'bg-white/10 text-white/50 border-white/10',
    final:     'bg-sky-950/30 text-sky-400 border-sky-800/30',
    delivered: 'bg-recovery/10 text-recovery border-recovery/25',
  };
  const style = styles[status] ?? 'bg-white/8 text-white/40 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic ${style}`}>
      {adminT.reports.status[status] ?? status}
    </span>
  );
}

function ScoreRing({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 75 ? 'text-red-400' : s >= 50 ? 'text-orange-400' : s >= 25 ? 'text-yellow-400' : 'text-emerald-400';
  const borderColor = s >= 75 ? 'border-red-500' : s >= 50 ? 'border-orange-500' : s >= 25 ? 'border-yellow-500' : 'border-emerald-500';
  return (
    <div className={`size-6 rounded-full border-2 ${borderColor} flex items-center justify-center`}>
      <span className={`text-[8px] font-bold ${color}`}>{s}</span>
    </div>
  );
}

// ── Data hook ──────────────────────────────────────────────────────────────────

function useReports(statusFilter: StatusFilter) {
  return useQuery({
    queryKey: ['admin', 'reports', statusFilter],
    queryFn: async () => {
      let q = supabase.from('autopsy_reports').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'ALL') {
        q = q.eq('status', statusFilter.toLowerCase());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AutopsyReport[];
    },
    staleTime: 30_000,
  });
}

// ── Report Editor ──────────────────────────────────────────────────────────────

interface EditorProps {
  report: AutopsyReport | null;
  onBack: () => void;
}

function ReportEditor({ report, onBack }: EditorProps) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [founderName, setFounderName]         = useState(report?.founder_name ?? searchParams.get('name') ?? '');
  const [founderEmail, setFounderEmail]       = useState(report?.founder_email ?? searchParams.get('founder') ?? '');
  const [company, setCompany]                 = useState(report?.company ?? searchParams.get('company') ?? '');
  const [riskScore, setRiskScore]             = useState<number>(report?.risk_score ?? Number(searchParams.get('score') ?? 0));
  const [execSummary, setExecSummary]         = useState(report?.executive_summary ?? '');
  const [failureMode, setFailureMode]         = useState(report?.failure_mode ?? FAILURE_MODES[0]);
  const [failureModeText, setFailureModeText] = useState('');
  const [blindSpots, setBlindSpots]           = useState<string[]>(report?.blind_spots ?? []);
  const [timeline, setTimeline]               = useState(report?.timeline_to_collapse ?? '');
  const [rootCauses, setRootCauses]           = useState(report?.root_causes ?? '');
  const [recoveryPath, setRecoveryPath]       = useState(report?.recovery_path ?? '');
  const [advisorNotes, setAdvisorNotes]       = useState(report?.advisor_notes ?? '');
  const [reportStatus, setReportStatus]       = useState(report?.status ?? 'draft');

  const toggleBlindSpot = (label: string) => {
    setBlindSpots((prev) =>
      prev.includes(label) ? prev.filter((b) => b !== label) : [...prev, label]
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        founder_name:        founderName,
        founder_email:       founderEmail || null,
        company:             company || null,
        risk_score:          riskScore || null,
        executive_summary:   execSummary || null,
        failure_mode:        failureMode || null,
        blind_spots:         blindSpots.length > 0 ? blindSpots : null,
        timeline_to_collapse: timeline || null,
        root_causes:         rootCauses || null,
        recovery_path:       recoveryPath || null,
        advisor_notes:       advisorNotes || null,
        status:              reportStatus,
      };
      if (report?.id) {
        const { error } = await supabase.from('autopsy_reports').update(payload).eq('id', report.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('autopsy_reports').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      onBack();
    },
  });

  const inputCls = "w-full bg-transparent border-b border-white/15 focus:border-ember outline-none py-2 text-sm text-white/70 placeholder:text-white/20";
  const textareaCls = "w-full bg-transparent border-b border-white/15 focus:border-ember outline-none py-2 text-sm text-white/70 placeholder:text-white/20 resize-none";
  const labelCls = "text-[10px] tracking-[0.25em] uppercase text-white/35 mb-3 block";
  const cardCls = "bg-[#0d0d0d] border border-white/6 rounded-xl p-6 mb-4";

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="size-4" /> Reports
        </button>
        <div className="flex items-center gap-3">
          <select
            value={reportStatus}
            onChange={(e) => setReportStatus(e.target.value)}
            className="px-3 py-1.5 bg-[#0d0d0d] border border-white/8 rounded-lg text-sm text-white/60 focus:outline-none focus:border-ember/40"
          >
            <option value="draft">Draft</option>
            <option value="final">Final</option>
            <option value="delivered">Delivered</option>
          </select>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !founderName}
            className="px-5 py-2 bg-ember text-[#fff] text-sm font-medium rounded-lg hover:bg-ember/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? 'Saving…' : 'Save Report'}
          </button>
        </div>
      </div>

      {mutation.isError && (
        <div className="mb-4 p-4 bg-red-950/30 border border-red-800/30 rounded-lg text-red-300 text-sm">
          Failed to save report. Please try again.
        </div>
      )}

      {/* Section 1: Founder */}
      <div className={cardCls}>
        <p className={labelCls}>1 — Founder</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-[10px] text-white/30 mb-1 block">Name *</label>
            <input type="text" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="Founder name" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] text-white/30 mb-1 block">Email</label>
            <input type="email" value={founderEmail} onChange={(e) => setFounderEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
          </div>
          <div>
            <label className="text-[10px] text-white/30 mb-1 block">Company</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className={inputCls} />
          </div>
        </div>
        <div className="max-w-[160px]">
          <label className="text-[10px] text-white/30 mb-1 block">Risk Score (0–100)</label>
          <input type="number" value={riskScore} onChange={(e) => setRiskScore(Number(e.target.value))} min={0} max={100} className={inputCls} />
        </div>
      </div>

      {/* Section 2: Executive Summary */}
      <div className={cardCls}>
        <p className={labelCls}>2 — Executive Summary</p>
        <textarea
          value={execSummary}
          onChange={(e) => setExecSummary(e.target.value)}
          placeholder="High-level narrative of what went wrong and why."
          rows={5}
          className={textareaCls}
        />
      </div>

      {/* Section 3: Failure Mode */}
      <div className={cardCls}>
        <p className={labelCls}>3 — Failure Mode</p>
        <select value={failureMode} onChange={(e) => setFailureMode(e.target.value)} className={cn(inputCls, 'cursor-pointer mb-4')}>
          {FAILURE_MODES.map((fm) => (
            <option key={fm} value={fm}>{fm}</option>
          ))}
        </select>
        <textarea
          value={failureModeText}
          onChange={(e) => setFailureModeText(e.target.value)}
          placeholder="Elaborate on the failure mode…"
          rows={3}
          className={textareaCls}
        />
      </div>

      {/* Section 4: Blind Spots */}
      <div className={cardCls}>
        <p className={labelCls}>4 — Blind Spots Detected</p>
        <div className="flex flex-wrap gap-2">
          {BLIND_SPOT_LABELS.map((bs) => {
            const selected = blindSpots.includes(bs);
            return (
              <button
                key={bs}
                type="button"
                onClick={() => toggleBlindSpot(bs)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[10px] tracking-[0.1em] uppercase border transition-colors',
                  selected
                    ? 'bg-ember/20 border-ember/50 text-ember'
                    : 'bg-white/4 border-white/10 text-white/40 hover:text-white/70 hover:border-white/25'
                )}
              >
                {bs}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 5: Timeline */}
      <div className={cardCls}>
        <p className={labelCls}>5 — Timeline to Collapse</p>
        <textarea
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="Estimated months to critical failure if current trajectory unchanged."
          rows={3}
          className={textareaCls}
        />
      </div>

      {/* Section 6: Root Causes */}
      <div className={cardCls}>
        <p className={labelCls}>6 — Root Causes</p>
        <textarea
          value={rootCauses}
          onChange={(e) => setRootCauses(e.target.value)}
          placeholder="Underlying structural or behavioral causes, not symptoms."
          rows={4}
          className={textareaCls}
        />
      </div>

      {/* Section 7: Recovery Path */}
      <div className={cardCls}>
        <p className={labelCls}>7 — Recovery Path</p>
        <textarea
          value={recoveryPath}
          onChange={(e) => setRecoveryPath(e.target.value)}
          placeholder="What must change in the next 30/60/90 days."
          rows={4}
          className={textareaCls}
        />
      </div>

      {/* Section 8: Advisor Notes */}
      <div className={cardCls}>
        <p className={labelCls}>8 — Advisor Notes</p>
        <textarea
          value={advisorNotes}
          onChange={(e) => setAdvisorNotes(e.target.value)}
          placeholder="Internal observations not included in delivered report."
          rows={4}
          className={textareaCls}
        />
      </div>
    </div>
  );
}

// ── Report List ────────────────────────────────────────────────────────────────

interface ListProps {
  statusFilter: StatusFilter;
  onNew: () => void;
  onEdit: (report: AutopsyReport) => void;
}

function ReportList({ statusFilter, onNew, onEdit }: ListProps) {
  const { data, isLoading, error } = useReports(statusFilter);

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-950/30 border border-red-800/30 rounded-lg text-red-300 text-sm">
          Could not load reports.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-white/4 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="py-16 text-center">
          <p className="text-white/25 text-sm">No reports yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#0d0d0d] border border-white/6 rounded-xl p-5 flex items-center gap-4 hover:border-white/12 transition-colors"
            >
              <ScoreRing score={report.risk_score} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <StatusPill status={report.status} />
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {report.founder_name}
                  {report.company && <span className="text-white/35 font-normal"> · {report.company}</span>}
                </p>
                {report.failure_mode && (
                  <p className="text-[11px] text-white/35 mt-0.5 truncate">{report.failure_mode}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {report.created_at && (
                  <p className="text-[10px] text-white/25 mb-2">{format(new Date(report.created_at), 'MMM d, yyyy')}</p>
                )}
                <button
                  onClick={() => onEdit(report)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg transition-colors"
                >
                  <Edit className="size-3" /> Edit
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Floating new button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 bg-ember text-[#fff] text-xs tracking-[0.1em] uppercase rounded-lg hover:bg-ember/90 transition-colors"
        >
          <Plus className="size-3.5" /> New Report
        </button>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminReports() {
  const { t: adminT } = useAdminLanguage();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [editingReport, setEditingReport] = useState<AutopsyReport | null | undefined>(undefined);
  // undefined = list view, null = new report, AutopsyReport = editing

  const isEditing = editingReport !== undefined;

  if (isEditing) {
    return (
      <AdminLayout title={adminT.reports.title} subtitle={adminT.reports.subtitle}>
        <ReportEditor
          report={editingReport}
          onBack={() => setEditingReport(undefined)}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={adminT.reports.title} subtitle={adminT.reports.subtitle}>
      {/* Status filter + new button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] transition-colors font-arabic',
                statusFilter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              )}
            >
              {adminT.reports.filters[f] ?? f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEditingReport(null)}
          className="flex items-center gap-2 px-4 py-2 bg-ember text-[#fff] text-xs rounded-lg hover:bg-ember/90 transition-colors font-arabic"
        >
          <Plus className="size-3.5" /> {adminT.reports.new}
        </button>
      </div>

      <ReportList
        statusFilter={statusFilter}
        onNew={() => setEditingReport(null)}
        onEdit={(r) => setEditingReport(r)}
      />
    </AdminLayout>
  );
}
