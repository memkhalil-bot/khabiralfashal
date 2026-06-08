import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, AlertTriangle, Shield, Activity, Skull,
  Building, Layers, Globe, Calendar, CalendarClock, FileText, Bell,
  Hash, Heart, Tag, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Assessment = Tables<'founder_assessments'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRiskMeta(t: ReturnType<typeof useAdminLanguage>['t']): Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> {
  return {
    STABLE:               { label: t.risk['STABLE'],               color: 'text-recovery',  bg: 'bg-recovery/10',   border: 'border-recovery/25',  icon: Shield },
    EXPOSED:              { label: t.risk['EXPOSED'],              color: 'text-yellow-400', bg: 'bg-yellow-950/30', border: 'border-yellow-800/30', icon: Activity },
    'INSIDE THE VALLEY':  { label: t.risk['INSIDE THE VALLEY'],   color: 'text-orange-400', bg: 'bg-orange-950/30', border: 'border-orange-800/30', icon: AlertTriangle },
    'COLLAPSE PROXIMITY': { label: t.risk['COLLAPSE PROXIMITY'],  color: 'text-crimson',    bg: 'bg-crimson/10',    border: 'border-crimson/25',   icon: Skull },
  };
}

function RiskBadge({ level }: { level: string | null }) {
  const { t } = useAdminLanguage();
  if (!level) return <span className="text-white/30 text-xs">—</span>;
  const meta = getRiskMeta(t)[level] ?? { label: level, color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10', icon: Activity };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] tracking-[0.1em] uppercase font-medium ${meta.color} ${meta.bg} border ${meta.border}`}>
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 75 ? 'bg-red-500' : s >= 50 ? 'bg-orange-500' : s >= 25 ? 'bg-yellow-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${s}%` }} />
      </div>
      <span className="text-sm font-medium text-white/70 tabular-nums w-8">{s}</span>
    </div>
  );
}

// ── Data hook ─────────────────────────────────────────────────────────────────

const RISK_LEVELS = ['STABLE', 'EXPOSED', 'INSIDE THE VALLEY', 'COLLAPSE PROXIMITY'] as const;

function useFounders(search: string, riskFilter: string) {
  return useQuery({
    queryKey: ['admin', 'founders', search, riskFilter],
    queryFn: async () => {
      let q = supabase.from('founder_assessments').select('*').order('created_at', { ascending: false });
      if (search) {
        q = q.or(`email.ilike.%${search}%,name.ilike.%${search}%,company.ilike.%${search}%`);
      }
      if (riskFilter) {
        q = q.eq('risk_level', riskFilter);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Assessment[];
    },
    staleTime: 30_000,
  });
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ row, onClose }: { row: Assessment; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20" />
      <motion.div
        key={row.id}
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 bottom-0 w-[420px] z-30 bg-[#0d0d0d] border-l border-white/6 overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/5 sticky top-0 bg-[#0d0d0d] z-10">
          <div>
            <p className="text-white font-medium">{row.name ?? 'Anonymous Founder'}</p>
            <a href={`mailto:${row.email}`} className="text-[11px] text-ember/70 hover:text-ember transition-colors">
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
            <div className="mt-3"><RiskBadge level={row.risk_level} /></div>
          </div>

          {/* Context grid */}
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
              {row.created_at && (
                <>
                  <p className="text-sm text-white/70">{format(new Date(row.created_at), 'MMM d, yyyy')}</p>
                  <p className="text-[11px] text-white/30">{format(new Date(row.created_at), 'HH:mm')}</p>
                </>
              )}
            </div>
          </div>

          {/* Methodology fields */}
          {(row.case_code || row.founder_health_score != null || row.primary_failure_mode || row.lead_source) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              {row.case_code && (
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                    <Hash className="size-3" /> Case Code
                  </p>
                  <p className="text-sm text-white/70 font-mono">{row.case_code}</p>
                </div>
              )}
              {row.founder_health_score != null && (
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                    <Heart className="size-3" /> Health Score
                  </p>
                  <p className="text-sm text-white/70">{row.founder_health_score}<span className="text-white/30 text-xs ml-0.5">/100</span></p>
                </div>
              )}
              {row.primary_failure_mode && (
                <div className="col-span-2">
                  <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                    <Zap className="size-3" /> Primary Failure Mode
                  </p>
                  <p className="text-sm text-white/70">{row.primary_failure_mode}</p>
                </div>
              )}
              {row.lead_source && (
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-white/30 mb-1">
                    <Tag className="size-3" /> Lead Source
                  </p>
                  <p className="text-sm text-white/70">{row.lead_source}</p>
                </div>
              )}
            </div>
          )}

          {/* Blind spots */}
          {row.blind_spots && row.blind_spots.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-3">Blind Spots Detected</p>
              <div className="flex flex-wrap gap-2">
                {row.blind_spots.map((bs) => (
                  <span key={bs} className="px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase bg-orange-950/30 border border-orange-800/25 text-orange-400/80 rounded-md">
                    {bs}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Insight */}
          {row.insight && (
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-2">Personalized Insight</p>
              <blockquote className="pl-3 border-l-2 border-ember/40 text-sm text-white/60 italic leading-relaxed">
                {row.insight}
              </blockquote>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-3">Quick Actions</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate(`/admin/sessions?founder=${encodeURIComponent(row.email)}&name=${encodeURIComponent(row.name ?? '')}`)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ember border border-ember/30 rounded-lg hover:bg-ember/10 transition-colors font-arabic"
              >
                <CalendarClock className="size-3.5" /> حجز جلسة
              </button>
              <button
                onClick={() => navigate(`/admin/reports?founder=${encodeURIComponent(row.email)}&name=${encodeURIComponent(row.name ?? '')}&company=${encodeURIComponent(row.company ?? '')}&score=${row.risk_score ?? 0}`)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ember border border-ember/30 rounded-lg hover:bg-ember/10 transition-colors font-arabic"
              >
                <FileText className="size-3.5" /> إنشاء تقرير
              </button>
              <button
                onClick={() => navigate(`/admin/follow-ups?founder=${encodeURIComponent(row.email)}&name=${encodeURIComponent(row.name ?? '')}`)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-ember border border-ember/30 rounded-lg hover:bg-ember/10 transition-colors font-arabic"
              >
                <Bell className="size-3.5" /> إضافة متابعة
              </button>
            </div>
          </div>

          {/* Raw answers */}
          {row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers) && (
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-3">Raw Answers</p>
              <div className="space-y-2">
                {Object.entries(row.answers as Record<string, number>).map(([qid, val]) => (
                  <div key={qid} className="flex items-center justify-between text-xs">
                    <span className="text-white/40 truncate max-w-[200px]">Q{qid}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} className={`size-5 rounded flex items-center justify-center text-[9px] ${n === val ? 'bg-ember text-[#fff] font-bold' : 'bg-white/6 text-white/20'}`}>
                          {n}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Record ID */}
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-1">Record ID</p>
            <p className="text-[10px] text-white/20 font-mono break-all">{row.id}</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminFounders() {
  const { t: adminT } = useAdminLanguage();
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selected, setSelected] = useState<Assessment | null>(null);

  const { data, isLoading, error } = useFounders(search, riskFilter);

  return (
    <AdminLayout
      title={adminT.founders.title}
      subtitle={adminT.founders.subtitle}
    >
      <div className="flex gap-6 h-[calc(100vh-160px)] min-h-0">
        {/* Table side */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Filters */}
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute end-4 top-1/2 -translate-y-1/2 size-4 text-white/25" />
              <input
                type="search"
                placeholder={adminT.founders.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pe-11 ps-4 py-2.5 bg-[#0d0d0d] border border-white/8 rounded-lg text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-ember/40 transition-colors font-arabic"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#0d0d0d] border border-white/8 rounded-lg text-sm text-white/60 focus:outline-none focus:border-ember/40 transition-colors font-arabic"
            >
              <option value="">{adminT.founders.riskFilter.all}</option>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>{adminT.founders.riskFilter[r] ?? r}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-crimson/10 border border-crimson/25 rounded-lg text-crimson text-sm font-arabic">
              تعذّر تحميل بيانات المؤسسين. تأكد من امتلاك صلاحيات المشرف.
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto bg-[#0d0d0d] border border-white/6 rounded-xl">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#111] z-10">
                <tr className="border-b border-white/5">
                  {[
                    adminT.founders.table.founder,
                    adminT.founders.table.company,
                    'النقاط العمياء',
                    adminT.founders.table.score,
                    adminT.founders.table.date,
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-start">
                      <span className="text-[10px] text-white/35 font-arabic">{h}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {isLoading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/6 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !data?.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-white/25 text-sm font-arabic">
                      {adminT.founders.empty}
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row.id === selected?.id ? null : row)}
                      className={`cursor-pointer transition-colors ${selected?.id === row.id ? 'bg-white/6' : 'hover:bg-white/3'}`}
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
                        {row.stage && <p className="text-[10px] text-white/25">{row.stage}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {row.blind_spots && row.blind_spots.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-orange-950/30 border border-orange-800/30 text-orange-400">
                            {row.blind_spots.length} detected
                          </span>
                        ) : (
                          <span className="text-white/25 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          <ScoreBar score={row.risk_score} />
                          <RiskBadge level={row.risk_level} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {row.created_at && (
                          <>
                            <p className="text-white/50 text-xs">{format(new Date(row.created_at), 'MMM d, yyyy')}</p>
                            <p className="text-[10px] text-white/25">{format(new Date(row.created_at), 'HH:mm')}</p>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <DetailPanel key={selected.id} row={selected} onClose={() => setSelected(null)} />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
