import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { format } from 'date-fns';
import {
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  CalendarPlus,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const TOTAL_QUESTIONS = 12;

interface ValleyLead {
  id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  country: string | null;
  completed: boolean;
  last_question_index: number | null;
  assessment_id: string | null;
  risk_level: string | null;
  requested_report: boolean;
  requested_session: boolean;
  created_at: string;
  completed_at: string | null;
}

type FilterKey = 'ALL' | 'COMPLETED' | 'ABANDONED' | 'REQUESTED_REPORT' | 'NO_REPORT' | 'REQUESTED_SESSION';

const FILTER_ICONS: Record<FilterKey, React.ElementType> = {
  ALL:               TrendingUp,
  COMPLETED:         CheckCircle2,
  ABANDONED:         Clock,
  REQUESTED_REPORT:  FileText,
  NO_REPORT:         FileText,
  REQUESTED_SESSION: CalendarPlus,
};

function useValleyLeads() {
  return useQuery({
    queryKey: ['admin', 'valley-leads'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('valley_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ValleyLead[];
    },
    staleTime: 30_000,
  });
}

function StatusBadge({ lead }: { lead: ValleyLead }) {
  const { t: adminT } = useAdminLanguage();
  if (lead.completed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-recovery/8 text-recovery border-recovery/20 font-arabic">
        <CheckCircle2 className="size-2.5" />
        {adminT.valleyLeads.status.completed}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-amber-950/30 text-amber-400 border-amber-800/30 font-arabic">
      <Clock className="size-2.5" />
      {adminT.valleyLeads.status.abandoned}
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

function ProgressBar({ current }: { current: number | null }) {
  const pct = Math.round(((current ?? 0) / TOTAL_QUESTIONS) * 100);
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-ember/60 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-white/35 tabular-nums shrink-0">
        {current ?? 0}/{TOTAL_QUESTIONS}
      </span>
    </div>
  );
}

export default function AdminValleyLeads() {
  const { t: adminT } = useAdminLanguage();
  const { data: leads = [], isLoading } = useValleyLeads();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (l.full_name ?? '').toLowerCase().includes(q) ||
      (l.email ?? '').toLowerCase().includes(q) ||
      (l.company ?? '').toLowerCase().includes(q);

    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'COMPLETED'         && l.completed) ||
      (filter === 'ABANDONED'         && !l.completed) ||
      (filter === 'REQUESTED_REPORT'  && l.requested_report) ||
      (filter === 'NO_REPORT'         && l.completed && !l.requested_report) ||
      (filter === 'REQUESTED_SESSION' && l.requested_session);

    return matchesSearch && matchesFilter;
  });

  const filterKeys = Object.keys(adminT.valleyLeads.filters) as FilterKey[];

  return (
    <AdminLayout title={adminT.valleyLeads.title} subtitle={adminT.valleyLeads.subtitle}>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.valleyLeads.search}
            className="w-full bg-[#161b22] border border-white/8 rounded-lg px-4 py-2.5 pr-9 text-sm text-white/80 placeholder-white/25 font-arabic focus:outline-none focus:border-white/20 transition-colors"
            dir="rtl"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {filterKeys.map((key) => {
            const Icon = FILTER_ICONS[key];
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] border transition-all font-arabic',
                  filter === key
                    ? 'bg-ember/10 text-white border-ember/20'
                    : 'bg-[#161b22] text-white/40 border-white/8 hover:text-white/70 hover:border-white/15'
                )}
              >
                <Icon className="size-3" />
                {adminT.valleyLeads.filters[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-white/6 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px_80px] gap-4 px-6 py-3 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-wider font-arabic">
          <span>{adminT.valleyLeads.table.lead}</span>
          <span>{adminT.valleyLeads.table.company}</span>
          <span>{adminT.valleyLeads.table.progress}</span>
          <span>{adminT.valleyLeads.table.status}</span>
          <span>{adminT.valleyLeads.table.risk}</span>
          <span>{adminT.valleyLeads.table.report}</span>
          <span>{adminT.valleyLeads.table.session}</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-white/4 rounded animate-pulse" />
            ))}
          </div>
        ) : !filtered.length ? (
          <div className="py-20 text-center">
            <TrendingUp className="size-10 text-white/8 mx-auto mb-4" />
            <p className="text-white/30 text-sm font-arabic mb-1">{adminT.valleyLeads.empty}</p>
            <p className="text-white/15 text-xs font-arabic">{adminT.valleyLeads.emptyHint}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_80px_80px] gap-4 px-6 py-4 items-center hover:bg-white/2 transition-colors"
              >
                {/* Lead */}
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate font-arabic">
                    {lead.full_name ?? lead.email ?? '—'}
                  </p>
                  {lead.full_name && lead.email && (
                    <p className="text-[11px] text-white/30 truncate">{lead.email}</p>
                  )}
                  {lead.created_at && (
                    <p className="text-[10px] text-white/20 mt-0.5">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>

                {/* Company */}
                <span className="text-sm text-white/50 truncate font-arabic">
                  {lead.company || '—'}
                </span>

                {/* Progress */}
                <ProgressBar current={lead.last_question_index} />

                {/* Status */}
                <StatusBadge lead={lead} />

                {/* Risk */}
                <RiskBadge level={lead.risk_level} />

                {/* Report */}
                <span className={cn('text-[10px] font-arabic text-center', lead.requested_report ? 'text-violet-400' : 'text-white/20')}>
                  {lead.requested_report ? '✓' : '—'}
                </span>

                {/* Session */}
                <span className={cn('text-[10px] font-arabic text-center', lead.requested_session ? 'text-recovery' : 'text-white/20')}>
                  {lead.requested_session ? '✓' : '—'}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-white/5">
            <p className="text-[10px] text-white/20 font-arabic">
              {filtered.length} من {leads.length} عميل
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
