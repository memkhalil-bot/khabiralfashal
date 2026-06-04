import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSearchParams } from 'react-router-dom';
import { X, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Session = Tables<'advisory_sessions'>;

// ── Status filters ─────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

// ── Badges ────────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-white/25 text-xs">—</span>;
  const styles: Record<string, string> = {
    initial:   'bg-sky-950/30 text-sky-400 border-sky-800/30',
    followup:  'bg-violet-950/30 text-violet-400 border-violet-800/30',
    intensive: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
    emergency: 'bg-red-950/30 text-red-400 border-red-800/30',
  };
  const style = styles[type] ?? 'bg-white/8 text-white/50 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] tracking-[0.1em] uppercase font-medium border ${style}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-white/25 text-xs">—</span>;
  const styles: Record<string, string> = {
    pending:   'bg-amber-950/30 text-amber-400 border-amber-800/30',
    confirmed: 'bg-sky-950/30 text-sky-400 border-sky-800/30',
    completed: 'bg-emerald-950/30 text-emerald-400 border-emerald-800/30',
    cancelled: 'bg-white/8 text-white/40 border-white/10',
    no_show:   'bg-red-950/30 text-red-400/70 border-red-800/30',
  };
  const style = styles[status] ?? 'bg-white/8 text-white/50 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] tracking-[0.1em] uppercase font-medium border ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ── Data hook ─────────────────────────────────────────────────────────────────

function useSessions(statusFilter: StatusFilter) {
  return useQuery({
    queryKey: ['admin', 'sessions', statusFilter],
    queryFn: async () => {
      let q = supabase.from('advisory_sessions').select('*').order('scheduled_at', { ascending: true, nullsFirst: false });
      if (statusFilter !== 'ALL') {
        q = q.eq('status', statusFilter.toLowerCase());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Session[];
    },
    staleTime: 30_000,
  });
}

// ── Status actions dropdown ────────────────────────────────────────────────────

function StatusActions({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase.from('advisory_sessions').update({ status: newStatus }).eq('id', session.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      setOpen(false);
    },
  });

  const actions = [
    { label: 'Mark Confirmed',  value: 'confirmed' },
    { label: 'Mark Completed',  value: 'completed' },
    { label: 'Mark Cancelled',  value: 'cancelled' },
    { label: 'Mark No Show',    value: 'no_show'   },
  ].filter((a) => a.value !== session.status);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg transition-colors"
      >
        Update <ChevronDown className="size-3" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div onClick={() => setOpen(false)} className="fixed inset-0 z-20" />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-30 bg-[#111] border border-white/10 rounded-lg py-1 w-40 shadow-xl"
            >
              {actions.map((a) => (
                <button
                  key={a.value}
                  onClick={() => mutation.mutate(a.value)}
                  disabled={mutation.isPending}
                  className="w-full text-left px-3 py-2 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
                >
                  {a.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── New Session Form Panel ────────────────────────────────────────────────────

function NewSessionPanel({ onClose }: { onClose: () => void }) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [founderName, setFounderName] = useState(searchParams.get('name') ?? '');
  const [founderEmail, setFounderEmail] = useState(searchParams.get('founder') ?? '');
  const [company, setCompany] = useState('');
  const [sessionType, setSessionType] = useState('initial');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [riskLevel, setRiskLevel] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('advisory_sessions').insert({
        founder_name: founderName,
        founder_email: founderEmail,
        company: company || null,
        session_type: sessionType,
        scheduled_at: scheduledAt || null,
        duration_minutes: duration,
        risk_level: riskLevel || null,
        notes: notes || null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      onClose();
    },
  });

  const inputCls = "w-full bg-transparent border-b border-white/15 focus:border-ember outline-none py-2 text-sm text-white/70 placeholder:text-white/20";
  const labelCls = "text-[10px] tracking-[0.25em] uppercase text-white/35 mb-1 block";

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20" />
      <motion.div
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed right-0 top-0 bottom-0 w-[420px] z-30 bg-[#0d0d0d] border-l border-white/6 overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#0d0d0d] z-10">
          <p className="text-white font-medium text-sm">New Session</p>
          <button onClick={onClose} className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Founder Name *</label>
            <input type="text" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="Full name" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Founder Email *</label>
            <input type="email" value={founderEmail} onChange={(e) => setFounderEmail(e.target.value)} placeholder="email@example.com" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Company</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Session Type</label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className={cn(inputCls, 'cursor-pointer')}>
              <option value="initial">Initial</option>
              <option value="followup">Follow-up</option>
              <option value="intensive">Intensive</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Scheduled At</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Duration (minutes)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} step={15} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Risk Level</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={cn(inputCls, 'cursor-pointer')}>
              <option value="">—</option>
              <option value="STABLE">STABLE</option>
              <option value="EXPOSED">EXPOSED</option>
              <option value="INSIDE THE VALLEY">INSIDE THE VALLEY</option>
              <option value="COLLAPSE PROXIMITY">COLLAPSE PROXIMITY</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes…" rows={4} className={cn(inputCls, 'resize-none')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !founderName || !founderEmail}
              className="flex-1 py-2.5 bg-ember text-white text-sm font-medium rounded-lg hover:bg-ember/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? 'Saving…' : 'Save Session'}
            </button>
            <button onClick={onClose} className="px-4 text-white/40 hover:text-white/70 transition-colors text-sm">
              Cancel
            </button>
          </div>
          {mutation.isError && (
            <p className="text-red-400 text-xs">Failed to save session. Please try again.</p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminSessions() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [showNewPanel, setShowNewPanel] = useState(false);

  const { data, isLoading, error } = useSessions(statusFilter);

  return (
    <AdminLayout
      title="Sessions"
      subtitle={`${data?.length ?? '…'} advisory session${data?.length !== 1 ? 's' : ''}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] tracking-[0.15em] uppercase transition-colors',
                statusFilter === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              )}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowNewPanel(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ember text-white text-xs tracking-[0.1em] uppercase rounded-lg hover:bg-ember/90 transition-colors shrink-0"
        >
          <Plus className="size-3.5" /> New Session
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-950/30 border border-red-800/30 rounded-lg text-red-300 text-sm">
          Could not load sessions.
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0d0d0d] border border-white/6 rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#111] z-10">
            <tr className="border-b border-white/5">
              {['Founder', 'Company', 'Type', 'Scheduled', 'Duration', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-white/35">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-white/6 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data?.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-white/25 text-sm">
                  No sessions scheduled yet.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-white/80">{row.founder_name}</p>
                    <p className="text-[11px] text-white/30">{row.founder_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/60 truncate max-w-[100px]">{row.company ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={row.session_type} />
                  </td>
                  <td className="px-4 py-3">
                    {row.scheduled_at ? (
                      <>
                        <p className="text-white/60 text-xs">{format(new Date(row.scheduled_at), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] text-white/30">{format(new Date(row.scheduled_at), 'HH:mm')}</p>
                      </>
                    ) : (
                      <span className="text-white/25 text-xs">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white/50 text-xs">{row.duration_minutes ? `${row.duration_minutes}m` : '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusActions session={row} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New session slide panel */}
      <AnimatePresence>
        {showNewPanel && (
          <NewSessionPanel key="new-session" onClose={() => setShowNewPanel(false)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
