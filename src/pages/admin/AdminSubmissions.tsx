import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Search,
  ArrowUpDown,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Activity,
  Skull,
  ExternalLink,
  Calendar,
  Globe,
  Building,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Assessment = Tables<'founder_assessments'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  STABLE: {
    label: 'Stable',
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/30',
    border: 'border-emerald-800/30',
    icon: Shield,
  },
  EXPOSED: {
    label: 'Exposed',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/30',
    border: 'border-yellow-800/30',
    icon: Activity,
  },
  'INSIDE THE VALLEY': {
    label: 'Inside the Valley',
    color: 'text-orange-400',
    bg: 'bg-orange-950/30',
    border: 'border-orange-800/30',
    icon: AlertTriangle,
  },
  'COLLAPSE PROXIMITY': {
    label: 'Collapse Proximity',
    color: 'text-red-400',
    bg: 'bg-red-950/30',
    border: 'border-red-800/30',
    icon: Skull,
  },
};

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-white/30 text-xs">—</span>;
  const meta = RISK_META[level] ?? { label: level, color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10', icon: Activity };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] tracking-[0.1em] uppercase font-medium ${meta.color} ${meta.bg} border ${meta.border}`}>
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-red-500' :
    score >= 50 ? 'bg-orange-500' :
    score >= 25 ? 'bg-yellow-500' :
    'bg-emerald-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-white/70 tabular-nums w-8">{score}</span>
    </div>
  );
}

// ── Data hook ─────────────────────────────────────────────────────────────────

type SortField = 'created_at' | 'risk_score' | 'name' | 'company';

function useSubmissions(search: string, sortField: SortField, sortAsc: boolean) {
  return useQuery({
    queryKey: ['admin', 'submissions', search, sortField, sortAsc],
    queryFn: async () => {
      let q = supabase
        .from('founder_assessments')
        .select('*')
        .order(sortField, { ascending: sortAsc });

      if (search) {
        q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as Assessment[];
    },
    staleTime: 30_000,
  });
}

// ── Row detail panel ──────────────────────────────────────────────────────────

function DetailPanel({ row, onClose }: { row: Assessment; onClose: () => void }) {
  return (
    <motion.div
      key={row.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-96 shrink-0 bg-[#0d0d0d] border-l border-white/6 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-white/5 sticky top-0 bg-[#0d0d0d] z-10">
        <div>
          <p className="text-white font-medium">{row.name ?? 'Anonymous Founder'}</p>
          <a
            href={`mailto:${row.email}`}
            className="text-[11px] text-ember/70 hover:text-ember transition-colors"
          >
            {row.email}
          </a>
        </div>
        <button
          onClick={onClose}
          className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Risk */}
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-2">Risk Score</p>
          <ScoreBar score={row.risk_score} />
          <div className="mt-3">
            <RiskBadge level={row.risk_level} />
          </div>
        </div>

        {/* Context */}
        <div className="grid grid-cols-2 gap-4">
          {row.company && (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                <Building className="size-3" /> Company
              </p>
              <p className="text-sm text-white/70">{row.company}</p>
            </div>
          )}
          {row.stage && (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                <Layers className="size-3" /> Stage
              </p>
              <p className="text-sm text-white/70">{row.stage}</p>
            </div>
          )}
          {row.sector && (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                <Activity className="size-3" /> Sector
              </p>
              <p className="text-sm text-white/70">{row.sector}</p>
            </div>
          )}
          {row.country && (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                <Globe className="size-3" /> Country
              </p>
              <p className="text-sm text-white/70">{row.country}</p>
            </div>
          )}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
              <Calendar className="size-3" /> Submitted
            </p>
            <p className="text-sm text-white/70">
              {format(new Date(row.created_at), 'MMM d, yyyy')}
            </p>
            <p className="text-[11px] text-white/30">
              {format(new Date(row.created_at), 'HH:mm')}
            </p>
          </div>
        </div>

        {/* Blind spots */}
        {row.blind_spots && row.blind_spots.length > 0 && (
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-3">
              Blind Spots Detected
            </p>
            <div className="flex flex-wrap gap-2">
              {row.blind_spots.map((bs) => (
                <span
                  key={bs}
                  className="px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase bg-orange-950/30 border border-orange-800/25 text-orange-400/80 rounded-md"
                >
                  {bs}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Insight */}
        {row.insight && (
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-2">
              Personalized Insight
            </p>
            <blockquote className="pl-3 border-l-2 border-ember/40 text-sm text-white/60 italic leading-relaxed">
              {row.insight}
            </blockquote>
          </div>
        )}

        {/* Answers */}
        {row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers) && (
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-3">
              Raw Answers
            </p>
            <div className="space-y-2">
              {Object.entries(row.answers as Record<string, number>).map(([qid, val]) => (
                <div key={qid} className="flex items-center justify-between text-xs">
                  <span className="text-white/40 truncate max-w-[200px]">Q{qid}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`size-5 rounded flex items-center justify-center text-[9px] ${
                          n === val
                            ? 'bg-ember text-white font-bold'
                            : 'bg-white/6 text-white/20'
                        }`}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User agent */}
        {row.user_agent && (
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-1">
              User Agent
            </p>
            <p className="text-[10px] text-white/20 break-all leading-relaxed font-mono">
              {row.user_agent}
            </p>
          </div>
        )}

        {/* ID */}
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-1">
            Record ID
          </p>
          <p className="text-[10px] text-white/20 font-mono break-all">{row.id}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminSubmissions() {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Assessment | null>(null);

  const { data, isLoading, error } = useSubmissions(search, sortField, sortAsc);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((v) => !v);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3 text-white/20" />;
    return sortAsc
      ? <ChevronUp className="size-3 text-ember" />
      : <ChevronDown className="size-3 text-ember" />;
  };

  return (
    <AdminLayout
      title="Submissions"
      subtitle={`${data?.length ?? '…'} founder assessment${data?.length !== 1 ? 's' : ''}`}
    >
      <div className="flex gap-6 h-[calc(100vh-160px)] min-h-0">
        {/* ── Left: table ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/25" />
            <input
              type="search"
              placeholder="Search by name, email, or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#0d0d0d] border border-white/8 rounded-lg text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-ember/40 transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-950/30 border border-red-800/30 rounded-lg text-red-300 text-sm">
              Could not load submissions. Make sure the admin migration has been applied and your
              account has the <code className="font-mono text-xs bg-red-900/30 px-1 rounded">admin</code> role.
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto bg-[#0d0d0d] border border-white/6 rounded-xl">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#111] z-10">
                <tr className="border-b border-white/5">
                  {[
                    { label: 'Founder', field: 'name' as SortField },
                    { label: 'Company', field: 'company' as SortField },
                    { label: 'Risk', field: 'risk_score' as SortField },
                    { label: 'Date', field: 'created_at' as SortField },
                  ].map(({ label, field }) => (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="px-4 py-3 text-left cursor-pointer select-none group"
                    >
                      <span className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/35 group-hover:text-white/60 transition-colors">
                        {label} <SortIcon field={field} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(4)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/6 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data?.length ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-16 text-center text-white/25 text-sm">
                      No submissions found.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row.id === selected?.id ? null : row)}
                      className={`cursor-pointer transition-colors ${
                        selected?.id === row.id
                          ? 'bg-white/6'
                          : 'hover:bg-white/3'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-white/80 truncate max-w-[160px]">
                          {row.name ?? <span className="text-white/30 italic">Anonymous</span>}
                        </p>
                        <p className="text-[11px] text-white/30 truncate">{row.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/60 truncate max-w-[120px]">
                          {row.company ?? <span className="text-white/20">—</span>}
                        </p>
                        {row.stage && (
                          <p className="text-[10px] text-white/25">{row.stage}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          <ScoreBar score={row.risk_score} />
                          <RiskBadge level={row.risk_level} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white/50 text-xs">
                          {format(new Date(row.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-[10px] text-white/25">
                          {format(new Date(row.created_at), 'HH:mm')}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: detail panel ── */}
        <AnimatePresence>
          {selected && (
            <DetailPanel
              key={selected.id}
              row={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
