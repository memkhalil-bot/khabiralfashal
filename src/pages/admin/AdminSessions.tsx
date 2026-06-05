import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminT } from '@/i18n/adminTranslations';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  X,
  Plus,
  ChevronDown,
  CalendarClock,
  LayoutList,
  Video,
  Phone,
  Link2,
  CalendarPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isFuture, isPast, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';

// ── Extended session type (includes columns added by booking_session_workflow) ──

interface ExtendedSession {
  id:                string;
  founder_name:      string;
  founder_email:     string;
  company:           string | null;
  session_type:      string | null;
  scheduled_at:      string | null;
  duration_minutes:  number | null;
  status:            string | null;
  risk_level:        string | null;
  notes:             string | null;
  created_at:        string | null;
  updated_at:        string | null;
  session_value:     number | null;
  payment_status:    string | null;
  source_booking_id: string | null;
  meeting_method:    string | null;
  meeting_link:      string | null;
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

type TimeSection = 'today' | 'thisWeek' | 'upcoming' | 'past' | 'unscheduled';

function getTimeSection(dateStr: string | null): TimeSection {
  if (!dateStr) return 'unscheduled';
  const d = new Date(dateStr);
  if (isToday(d)) return 'today';
  if (isFuture(d) && isThisWeek(d, { weekStartsOn: 0 })) return 'thisWeek';
  if (isFuture(d)) return 'upcoming';
  if (isPast(d)) return 'past';
  return 'unscheduled';
}

const TIME_SECTIONS: TimeSection[] = ['today', 'thisWeek', 'upcoming', 'past', 'unscheduled'];

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
    emergency: 'bg-crimson/10 text-crimson border-crimson/25',
  };
  const style = styles[type] ?? 'bg-white/8 text-white/50 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic ${style}`}>
      {adminT.sessions.types[type] ?? type}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-white/25 text-xs">—</span>;
  const styles: Record<string, string> = {
    pending:   'bg-amber-950/30 text-amber-400 border-amber-800/30',
    confirmed: 'bg-sky-950/30 text-sky-400 border-sky-800/30',
    completed: 'bg-recovery/10 text-recovery border-recovery/25',
    cancelled: 'bg-white/8 text-white/40 border-white/10',
    no_show:   'bg-crimson/10 text-crimson/70 border-crimson/25',
  };
  const style = styles[status] ?? 'bg-white/8 text-white/50 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic ${style}`}>
      {adminT.sessions.status[status] ?? status.replace('_', ' ')}
    </span>
  );
}

function SourceBadge({ sourceBookingId }: { sourceBookingId: string | null }) {
  if (sourceBookingId) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-ember/8 text-ember border-ember/20 font-arabic">
        <CalendarPlus className="size-2.5" />
        {adminT.sessions.sources.booking}
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-white/5 text-white/35 border-white/10 font-arabic">
      {adminT.sessions.sources.manual}
    </span>
  );
}

function MeetingMethodIcon({ method }: { method: string | null }) {
  if (!method) return null;
  const isVideo = method === 'Zoom' || method === 'Google Meet';
  const Icon = isVideo ? Video : Phone;
  return <Icon className="size-3 shrink-0 text-white/30" />;
}

// ── Data hook ─────────────────────────────────────────────────────────────────

function useSessions(statusFilter: StatusFilter) {
  return useQuery({
    queryKey: ['admin', 'sessions', statusFilter],
    queryFn: async () => {
      let q = (supabase as any)
        .from('advisory_sessions')
        .select('*')
        .order('scheduled_at', { ascending: true, nullsFirst: false });
      if (statusFilter !== 'ALL') {
        q = q.eq('status', statusFilter.toLowerCase());
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ExtendedSession[];
    },
    staleTime: 30_000,
  });
}

// ── Status actions dropdown ────────────────────────────────────────────────────

function StatusActions({ session }: { session: ExtendedSession }) {
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
    { label: `→ ${adminT.sessions.status.confirmed}`, value: 'confirmed' },
    { label: `→ ${adminT.sessions.status.completed}`, value: 'completed' },
    { label: `→ ${adminT.sessions.status.cancelled}`, value: 'cancelled' },
    { label: `→ ${adminT.sessions.status.no_show}`,   value: 'no_show'   },
  ].filter((a) => a.value !== session.status);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg transition-colors font-arabic"
      >
        تحديث <ChevronDown className="size-3" />
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
                  className="w-full text-start px-3 py-2 text-[11px] text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors font-arabic"
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

// ── Session row (shared between table and calendar card) ──────────────────────

function SessionTableRow({ row }: { row: ExtendedSession }) {
  return (
    <tr className="hover:bg-white/2 transition-colors">
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
          <span className="text-white/25 text-xs font-arabic">غير محدد</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-white/50 text-xs">{row.duration_minutes ? `${row.duration_minutes}m` : '—'}</span>
      </td>
      <td className="px-4 py-3">
        {row.meeting_method ? (
          <div className="flex items-center gap-1.5">
            <MeetingMethodIcon method={row.meeting_method} />
            <span className="text-white/50 text-xs">{adminT.sessions.meetingMethods[row.meeting_method] ?? row.meeting_method}</span>
            {row.meeting_link && (
              <a
                href={row.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sky-400/70 hover:text-sky-400 transition-colors"
              >
                <Link2 className="size-3" />
              </a>
            )}
          </div>
        ) : (
          <span className="text-white/20 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <SourceBadge sourceBookingId={row.source_booking_id} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-4 py-3">
        <StatusActions session={row} />
      </td>
    </tr>
  );
}

// ── Calendar card ─────────────────────────────────────────────────────────────

function CalendarCard({ session }: { session: ExtendedSession }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-[#0d0d0d] border border-white/6 rounded-xl hover:border-white/10 transition-colors">
      {/* Time column */}
      <div className="w-14 shrink-0 text-center">
        {session.scheduled_at ? (
          <>
            <p className="text-white/70 text-sm font-mono">{format(new Date(session.scheduled_at), 'HH:mm')}</p>
            <p className="text-white/25 text-[10px]">{format(new Date(session.scheduled_at), 'MMM d')}</p>
          </>
        ) : (
          <p className="text-white/20 text-xs font-arabic">—</p>
        )}
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-white/6 shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <p className="text-white/80 text-sm font-arabic font-medium">{session.founder_name}</p>
          {session.company && (
            <p className="text-white/30 text-xs font-arabic">· {session.company}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={session.session_type} />
          <StatusBadge status={session.status} />
          {session.meeting_method && (
            <span className="inline-flex items-center gap-1 text-[10px] text-white/40 font-arabic">
              <MeetingMethodIcon method={session.meeting_method} />
              {adminT.sessions.meetingMethods[session.meeting_method] ?? session.meeting_method}
              {session.meeting_link && (
                <a
                  href={session.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400/60 hover:text-sky-400 ms-0.5"
                >
                  <Link2 className="size-2.5" />
                </a>
              )}
            </span>
          )}
        </div>
        {session.duration_minutes && (
          <p className="text-white/25 text-[10px] mt-1">{session.duration_minutes} دقيقة</p>
        )}
      </div>

      <SourceBadge sourceBookingId={session.source_booking_id} />
    </div>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<TimeSection, string> = {
  today:       'اليوم',
  thisWeek:    'هذا الأسبوع',
  upcoming:    'القادمة',
  past:        'السابقة',
  unscheduled: 'غير مجدول',
};

function CalendarView({ sessions }: { sessions: ExtendedSession[] }) {
  const grouped = TIME_SECTIONS.reduce<Record<TimeSection, ExtendedSession[]>>(
    (acc, s) => ({ ...acc, [s]: [] }),
    {} as Record<TimeSection, ExtendedSession[]>
  );
  sessions.forEach((s) => grouped[getTimeSection(s.scheduled_at)].push(s));

  const hasAny = Object.values(grouped).some((g) => g.length > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-8">
      {TIME_SECTIONS.map((section) => {
        const items = grouped[section];
        if (!items.length) return null;
        const isTodays = section === 'today';
        return (
          <div key={section}>
            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                'text-[11px] tracking-[0.2em] uppercase font-arabic font-medium',
                isTodays ? 'text-recovery' : 'text-white/35'
              )}>
                {SECTION_LABELS[section]}
              </span>
              <span className={cn(
                'px-1.5 py-0.5 rounded text-[10px]',
                isTodays
                  ? 'bg-recovery/15 text-recovery'
                  : 'bg-white/6 text-white/30'
              )}>
                {items.length}
              </span>
              <hr className="flex-1 border-white/5" />
            </div>
            <div className="space-y-2">
              {items.map((s) => <CalendarCard key={s.id} session={s} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── New Session Form Panel ────────────────────────────────────────────────────

function NewSessionPanel({ onClose }: { onClose: () => void }) {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [founderName, setFounderName]   = useState(searchParams.get('name') ?? '');
  const [founderEmail, setFounderEmail] = useState(searchParams.get('founder') ?? '');
  const [company, setCompany]           = useState('');
  const [sessionType, setSessionType]   = useState('initial');
  const [scheduledAt, setScheduledAt]   = useState('');
  const [duration, setDuration]         = useState(60);
  const [riskLevel, setRiskLevel]       = useState('');
  const [notes, setNotes]               = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('advisory_sessions').insert({
        founder_name:    founderName,
        founder_email:   founderEmail,
        company:         company || null,
        session_type:    sessionType,
        scheduled_at:    scheduledAt || null,
        duration_minutes: duration,
        risk_level:      riskLevel || null,
        notes:           notes || null,
        status:          'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      onClose();
    },
  });

  const inputCls = 'w-full bg-transparent border-b border-white/15 focus:border-ember outline-none py-2 text-sm text-white/70 placeholder:text-white/20';
  const labelCls = 'text-[10px] tracking-[0.25em] uppercase text-white/35 mb-1 block';

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
          <p className="text-white font-medium text-sm font-arabic">{adminT.sessions.new}</p>
          <button onClick={onClose} className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls}>{adminT.sessions.form.founderName} *</label>
            <input type="text" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="الاسم الكامل" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{adminT.sessions.form.email} *</label>
            <input type="email" value={founderEmail} onChange={(e) => setFounderEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{adminT.sessions.form.company}</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{adminT.sessions.form.sessionType}</label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className={cn(inputCls, 'cursor-pointer font-arabic')}>
              <option value="initial">{adminT.sessions.types.initial}</option>
              <option value="followup">{adminT.sessions.types.followup}</option>
              <option value="intensive">{adminT.sessions.types.intensive}</option>
              <option value="emergency">{adminT.sessions.types.emergency}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{adminT.sessions.form.scheduledAt}</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>المدة (دقيقة)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} step={15} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{adminT.founders.table.risk}</label>
            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={cn(inputCls, 'cursor-pointer font-arabic')}>
              <option value="">—</option>
              <option value="STABLE">{adminT.risk.STABLE}</option>
              <option value="EXPOSED">{adminT.risk.EXPOSED}</option>
              <option value="INSIDE THE VALLEY">{adminT.risk['INSIDE THE VALLEY']}</option>
              <option value="COLLAPSE PROXIMITY">{adminT.risk['COLLAPSE PROXIMITY']}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{adminT.sessions.form.notes}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات داخلية..." rows={4} className={cn(inputCls, 'resize-none')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !founderName || !founderEmail}
              className="flex-1 py-2.5 bg-ember text-white text-sm font-medium rounded-lg hover:bg-ember/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-arabic"
            >
              {mutation.isPending ? 'جارٍ الحفظ...' : adminT.sessions.form.save}
            </button>
            <button onClick={onClose} className="px-4 text-white/40 hover:text-white/70 transition-colors text-sm font-arabic">
              {adminT.sessions.form.cancel}
            </button>
          </div>
          {mutation.isError && (
            <p className="text-crimson text-xs font-arabic">فشل حفظ الجلسة. يرجى المحاولة مرة أخرى.</p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'calendar';

export default function AdminSessions() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [viewMode, setViewMode]         = useState<ViewMode>('table');
  const [showNewPanel, setShowNewPanel] = useState(false);

  const { data, isLoading, error } = useSessions(statusFilter);
  const sessions = data ?? [];

  const isEmpty = !isLoading && sessions.length === 0;

  return (
    <AdminLayout
      title={adminT.sessions.title}
      subtitle={adminT.sessions.subtitle}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="flex gap-1.5 flex-wrap">
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
                {adminT.sessions.filters[f] ?? f}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/6">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'table' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              )}
              title="Table view"
            >
              <LayoutList className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              )}
              title="Calendar view"
            >
              <CalendarClock className="size-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowNewPanel(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ember text-white text-xs rounded-lg hover:bg-ember/90 transition-colors shrink-0 font-arabic"
        >
          <Plus className="size-3.5" /> {adminT.sessions.new}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-crimson/10 border border-crimson/25 rounded-lg text-crimson text-sm font-arabic">
          تعذّر تحميل الجلسات.
        </div>
      )}

      {/* ── Table view ── */}
      {viewMode === 'table' && (
        <div className="bg-[#0d0d0d] border border-white/6 rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#111] z-10">
              <tr className="border-b border-white/5">
                {[
                  adminT.sessions.table.founder,
                  adminT.founders.table.company,
                  adminT.sessions.table.type,
                  adminT.sessions.table.scheduled,
                  'المدة',
                  adminT.sessions.table.meeting,
                  adminT.sessions.table.source,
                  adminT.sessions.table.status,
                  adminT.sessions.table.actions,
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-start">
                    <span className="text-[10px] text-white/35 font-arabic">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-white/6 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isEmpty ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <CalendarClock className="size-10 text-white/10" />
                      <p className="text-white/30 text-sm font-arabic">
                        {adminT.sessions.emptyFromBooking}
                      </p>
                      <button
                        onClick={() => navigate('/admin/bookings')}
                        className="mt-1 px-4 py-2 bg-ember/10 hover:bg-ember/20 border border-ember/25 text-ember text-xs rounded-lg transition-all font-arabic"
                      >
                        {adminT.sessions.goToBookings}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((row) => <SessionTableRow key={row.id} row={row} />)
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Calendar/Timeline view ── */}
      {viewMode === 'calendar' && (
        <div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-white/4 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <CalendarClock className="size-10 text-white/10" />
              <p className="text-white/30 text-sm font-arabic">
                {adminT.sessions.emptyFromBooking}
              </p>
              <button
                onClick={() => navigate('/admin/bookings')}
                className="mt-1 px-4 py-2 bg-ember/10 hover:bg-ember/20 border border-ember/25 text-ember text-xs rounded-lg transition-all font-arabic"
              >
                {adminT.sessions.goToBookings}
              </button>
            </div>
          ) : (
            <CalendarView sessions={sessions} />
          )}
        </div>
      )}

      {/* New session slide panel */}
      <AnimatePresence>
        {showNewPanel && (
          <NewSessionPanel key="new-session" onClose={() => setShowNewPanel(false)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
