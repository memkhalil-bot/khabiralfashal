import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
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
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlignLeft,
  CalendarDays,
  Clock,
  Monitor,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isFuture, isPast, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import { WorkflowStatusManager } from '@/components/admin/WorkflowStatusManager';
import { WorkflowTimeline } from '@/components/admin/WorkflowTimeline';

// ── Extended session type ──────────────────────────────────────────────────────

interface ExtendedSession {
  id:                   string;
  founder_name:         string;
  founder_email:        string;
  company:              string | null;
  session_type:         string | null;
  scheduled_at:         string | null;
  duration_minutes:     number | null;
  status:               string | null;
  risk_level:           string | null;
  notes:                string | null;
  created_at:           string | null;
  updated_at:           string | null;
  session_value:        number | null;
  payment_status:       string | null;
  source_booking_id:    string | null;
  meeting_method:       string | null;
  meeting_link:         string | null;
  session_instructions: string | null;
  calendar_event_id:    string | null;
  calendar_provider:    string | null;
  workflow_status:      string | null;
}

// ── Meeting method constants ───────────────────────────────────────────────────

const MEETING_METHODS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Phone Call', 'Other'] as const;
type MeetingMethod = typeof MEETING_METHODS[number];
const LINK_REQUIRED: MeetingMethod[] = ['Google Meet', 'Zoom', 'Microsoft Teams'];

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
  const { t: adminT } = useAdminLanguage();
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
  const { t: adminT } = useAdminLanguage();
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
  const { t: adminT } = useAdminLanguage();
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

function MeetingMethodIcon({ method, className }: { method: string | null; className?: string }) {
  const cls = className ?? 'size-3 shrink-0 text-white/30';
  if (!method) return null;
  if (method === 'Phone Call') return <Phone className={cls} />;
  if (method === 'Microsoft Teams') return <Monitor className={cls} />;
  if (method === 'Google Meet' || method === 'Zoom') return <Video className={cls} />;
  return <Link2 className={cls} />;
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

function StatusActions({ session, onStatusChange }: { session: ExtendedSession; onStatusChange?: () => void }) {
  const { t: adminT } = useAdminLanguage();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase.from('advisory_sessions').update({ status: newStatus }).eq('id', session.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'session-snapshot'] });
      setOpen(false);
      onStatusChange?.();
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
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 rounded-lg transition-colors font-arabic"
      >
        {adminT.common.edit} <ChevronDown className="size-3" />
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
              className="absolute right-0 top-full mt-1 z-30 bg-[#111] border border-white/10 rounded-lg py-1 w-44 shadow-xl"
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

// ── Session Drawer ────────────────────────────────────────────────────────────

function SessionDrawer({
  session,
  onClose,
}: {
  session: ExtendedSession;
  onClose: () => void;
}) {
  const { t: adminT, language } = useAdminLanguage();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const isRTL = language === 'ar';
  const qa = adminT.sessions.quickActions;
  const dr = adminT.sessions.drawer;

  const linkRequiresUrl = session.meeting_method
    ? LINK_REQUIRED.includes(session.meeting_method as MeetingMethod)
    : false;

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('advisory_sessions')
        .update({ status: newStatus })
        .eq('id', session.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'session-snapshot'] });
      onClose();
    },
  });

  const handleCopyLink = () => {
    if (!session.meeting_link) return;
    navigator.clipboard.writeText(session.meeting_link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20 bg-black/40" />
      <motion.div
        initial={{ [isRTL ? 'left' : 'right']: -440 }}
        animate={{ [isRTL ? 'left' : 'right']: 0 }}
        exit={{ [isRTL ? 'left' : 'right']: -440 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ [isRTL ? 'left' : 'right']: 0 }}
        className="fixed top-0 bottom-0 w-[420px] z-30 bg-[#0d0d0d] border-l border-white/6 overflow-y-auto flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/5 sticky top-0 bg-[#0d0d0d] z-10">
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm font-arabic truncate">{session.founder_name}</p>
            <p className="text-[11px] text-white/35 font-arabic mt-0.5 truncate">{session.founder_email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={session.status} />
              <TypeBadge type={session.session_type} />
              <SourceBadge sourceBookingId={session.source_booking_id} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors shrink-0 ms-3"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-5">

          {/* When */}
          <div className="bg-[#111] border border-white/6 rounded-xl p-4 space-y-2.5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-arabic mb-3">
              {adminT.sessions.table.scheduled}
            </p>
            {session.scheduled_at ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <CalendarDays className="size-3.5 text-sky-400/60 shrink-0" />
                  <span>{format(new Date(session.scheduled_at), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Clock className="size-3.5 text-sky-400/60 shrink-0" />
                  <span>{format(new Date(session.scheduled_at), 'HH:mm')}</span>
                  {session.duration_minutes && (
                    <span className="text-white/35">
                      · {session.duration_minutes} {dr.minutes}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-white/25 text-xs font-arabic">—</p>
            )}
          </div>

          {/* Meeting */}
          <div className="bg-[#111] border border-white/6 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-arabic mb-3">
              {dr.meetingDetails}
            </p>

            {session.meeting_method && (
              <div className="flex items-center gap-2 mb-3">
                <MeetingMethodIcon method={session.meeting_method} className="size-3.5 text-sky-400/60" />
                <span className="text-sm text-white/70 font-arabic">
                  {adminT.sessions.meetingMethods[session.meeting_method] ?? session.meeting_method}
                </span>
              </div>
            )}

            {session.meeting_link ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 bg-white/4 border border-white/8 rounded-lg">
                  <Link2 className="size-3.5 text-sky-400/60 shrink-0" />
                  <span className="text-xs text-sky-400 truncate flex-1">{session.meeting_link}</span>
                </div>
                {/* Quick action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/6 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-white/60 hover:text-white/90 transition-all font-arabic"
                  >
                    <Copy className="size-3 shrink-0" />
                    {copied ? qa.linkCopied : qa.copyLink}
                  </button>
                  <a
                    href={session.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-950/40 hover:bg-sky-950/60 border border-sky-800/30 rounded-lg text-[11px] text-sky-400 hover:text-sky-300 transition-all font-arabic"
                  >
                    <ExternalLink className="size-3 shrink-0" />
                    {qa.openMeeting}
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 bg-amber-950/20 border border-amber-800/20 rounded-lg">
                <AlertCircle className="size-3.5 text-amber-400/60 shrink-0" />
                <span className="text-xs text-amber-400/70 font-arabic">
                  {linkRequiresUrl ? dr.missingLink : qa.noLink}
                </span>
              </div>
            )}
          </div>

          {/* Session Instructions */}
          <div className="bg-[#111] border border-white/6 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-arabic mb-3 flex items-center gap-2">
              <AlignLeft className="size-3" />
              {dr.sessionInstructions}
            </p>
            {session.session_instructions ? (
              <p className="text-sm text-white/65 leading-relaxed font-arabic">
                {session.session_instructions}
              </p>
            ) : (
              <p className="text-xs text-white/20 font-arabic">{dr.noInstructions}</p>
            )}
          </div>

          {/* Company info */}
          {session.company && (
            <div className="flex items-center gap-2 text-xs text-white/45 font-arabic">
              <span className="text-white/20">🏢</span>
              <span>{session.company}</span>
            </div>
          )}

          {/* Notes */}
          {session.notes && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-arabic mb-2">
                {adminT.sessions.form.notes}
              </p>
              <p className="text-sm text-white/55 leading-relaxed font-arabic bg-[#111] border border-white/6 rounded-xl p-4">
                {session.notes}
              </p>
            </div>
          )}

          {/* Quick status actions */}
          {session.status !== 'completed' && session.status !== 'cancelled' && (
            <div className="space-y-2">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 font-arabic">
                {adminT.sessions.table.actions}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => statusMutation.mutate('completed')}
                  disabled={statusMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-recovery/10 hover:bg-recovery/20 border border-recovery/25 rounded-lg text-[11px] text-recovery transition-all disabled:opacity-40 font-arabic"
                >
                  <CheckCircle2 className="size-3 shrink-0" />
                  {qa.markCompleted}
                </button>
                <button
                  onClick={() => statusMutation.mutate('cancelled')}
                  disabled={statusMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-crimson/10 hover:bg-crimson/20 border border-crimson/25 rounded-lg text-[11px] text-crimson transition-all disabled:opacity-40 font-arabic"
                >
                  <XCircle className="size-3 shrink-0" />
                  {qa.cancelSession}
                </button>
              </div>
            </div>
          )}

          {/* Workflow status manager */}
          <div className="bg-[#111] border border-white/6 rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/25 mb-3 font-arabic">
              إدارة الحالة
            </p>
            <WorkflowStatusManager
              entityType="advisory_session"
              entityId={session.id}
              currentStatus={session.workflow_status ?? 'scheduled'}
              invalidateKeys={[['admin', 'sessions']]}
            />
          </div>

          {/* Timeline */}
          <WorkflowTimeline
            entityType="advisory_session"
            entityId={session.id}
            createdAt={session.created_at ?? undefined}
          />

        </div>
      </motion.div>
    </>
  );
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionTableRow({
  row,
  onOpen,
}: {
  row: ExtendedSession;
  onOpen: (s: ExtendedSession) => void;
}) {
  const { t: adminT } = useAdminLanguage();
  return (
    <tr
      className="hover:bg-white/2 transition-colors cursor-pointer group"
      onClick={() => onOpen(row)}
    >
      <td className="px-4 py-3">
        <p className="text-white/80 group-hover:text-white transition-colors">{row.founder_name}</p>
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
          <span className="text-white/25 text-xs font-arabic">—</span>
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
            {row.meeting_link ? (
              <a
                href={row.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sky-400/70 hover:text-sky-400 transition-colors"
              >
                <Link2 className="size-3" />
              </a>
            ) : (
              LINK_REQUIRED.includes(row.meeting_method as MeetingMethod) && (
                <AlertCircle className="size-3 text-amber-400/50" title="No meeting link" />
              )
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
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <StatusActions session={row} />
      </td>
    </tr>
  );
}

// ── Calendar card ─────────────────────────────────────────────────────────────

function CalendarCard({
  session,
  onOpen,
}: {
  session: ExtendedSession;
  onOpen: (s: ExtendedSession) => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const wfStatus = session.workflow_status ?? 'scheduled';

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session.meeting_link) return;
    navigator.clipboard.writeText(session.meeting_link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#0d0d0d] border border-white/6 rounded-xl hover:border-white/10 transition-colors overflow-hidden">
      <div
        className="flex items-start gap-4 p-4 cursor-pointer"
        onClick={() => onOpen(session)}
      >
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
              </span>
            )}
          </div>
          {session.duration_minutes && (
            <p className="text-white/25 text-[10px] mt-1">
              {session.duration_minutes} {adminT.sessions.drawer.minutes}
            </p>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Meeting link quick actions */}
          {session.meeting_link && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyLink}
                title={adminT.sessions.quickActions.copyLink}
                className="p-1 rounded text-white/25 hover:text-sky-400 hover:bg-sky-950/30 transition-colors"
              >
                {copied ? <CheckCircle2 className="size-3 text-recovery" /> : <Copy className="size-3" />}
              </button>
              <a
                href={session.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                title={adminT.sessions.quickActions.openMeeting}
                className="p-1 rounded text-white/25 hover:text-sky-400 hover:bg-sky-950/30 transition-colors"
              >
                <ExternalLink className="size-3" />
              </a>
            </div>
          )}
          {!session.meeting_link && LINK_REQUIRED.includes((session.meeting_method ?? '') as MeetingMethod) && (
            <AlertCircle className="size-3.5 text-amber-400/50" title="No meeting link" />
          )}
          <SourceBadge sourceBookingId={session.source_booking_id} />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded-md text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
          >
            <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Expandable workflow section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-4 space-y-4" dir="rtl">
              {session.session_instructions && (
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/20 mb-2 font-arabic">
                    {adminT.sessions.drawer.sessionInstructions}
                  </p>
                  <p className="text-xs text-white/50 font-arabic leading-relaxed">
                    {session.session_instructions}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/25 mb-3 font-arabic">إدارة الحالة</p>
                <WorkflowStatusManager
                  entityType="advisory_session"
                  entityId={session.id}
                  currentStatus={wfStatus}
                  invalidateKeys={[['admin', 'sessions']]}
                />
              </div>
              <WorkflowTimeline
                entityType="advisory_session"
                entityId={session.id}
                createdAt={session.created_at ?? undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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

function CalendarView({
  sessions,
  onOpen,
}: {
  sessions: ExtendedSession[];
  onOpen: (s: ExtendedSession) => void;
}) {
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
              {items.map((s) => <CalendarCard key={s.id} session={s} onOpen={onOpen} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── New Session Form Panel ────────────────────────────────────────────────────

function NewSessionPanel({ onClose }: { onClose: () => void }) {
  const { t: adminT } = useAdminLanguage();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [founderName, setFounderName]     = useState(searchParams.get('name') ?? '');
  const [founderEmail, setFounderEmail]   = useState(searchParams.get('founder') ?? '');
  const [company, setCompany]             = useState('');
  const [sessionType, setSessionType]     = useState('initial');
  const [scheduledAt, setScheduledAt]     = useState('');
  const [duration, setDuration]           = useState(60);
  const [riskLevel, setRiskLevel]         = useState('');
  const [notes, setNotes]                 = useState('');
  const [meetingMethod, setMeetingMethod] = useState<MeetingMethod>('Google Meet');
  const [meetingLink, setMeetingLink]     = useState('');
  const [sessionInstructions, setSessionInstructions] = useState('');

  const linkRequired = LINK_REQUIRED.includes(meetingMethod);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('advisory_sessions').insert({
        founder_name:         founderName,
        founder_email:        founderEmail,
        company:              company || null,
        session_type:         sessionType,
        scheduled_at:         scheduledAt || null,
        duration_minutes:     duration,
        risk_level:           riskLevel || null,
        notes:                notes || null,
        status:               'pending',
        workflow_status:      'scheduled',
        meeting_method:       meetingMethod,
        meeting_link:         meetingLink || null,
        session_instructions: sessionInstructions || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'session-snapshot'] });
      onClose();
    },
  });

  const inputCls  = 'w-full bg-transparent border-b border-white/15 focus:border-ember outline-none py-2 text-sm text-white/70 placeholder:text-white/20';
  const labelCls  = 'text-[10px] tracking-[0.25em] uppercase text-white/35 mb-1 block';
  const canSubmit = founderName.trim().length > 0 && founderEmail.trim().length > 0;

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
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors"
          >
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
            <label className={labelCls}>{adminT.sessions.drawer.duration}</label>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} step={15} className={inputCls} />
          </div>

          {/* Meeting type */}
          <div>
            <label className={labelCls}>{adminT.sessions.form.meetingType}</label>
            <select
              value={meetingMethod}
              onChange={(e) => setMeetingMethod(e.target.value as MeetingMethod)}
              className={cn(inputCls, 'cursor-pointer font-arabic')}
            >
              {MEETING_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Meeting link */}
          <div>
            <label className={labelCls}>
              {adminT.sessions.form.meetingLink}
              {linkRequired && <span className="text-amber-400/60 ms-1">*</span>}
            </label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder={meetingMethod === 'Google Meet' ? 'https://meet.google.com/...' : 'https://...'}
              className={inputCls}
            />
          </div>

          {/* Session instructions */}
          <div>
            <label className={labelCls}>{adminT.sessions.form.sessionInstructions}</label>
            <textarea
              value={sessionInstructions}
              onChange={(e) => setSessionInstructions(e.target.value)}
              placeholder={adminT.sessions.form.instructionsPlaceholder}
              rows={3}
              className={cn(inputCls, 'resize-none')}
            />
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
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات داخلية..." rows={3} className={cn(inputCls, 'resize-none')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !canSubmit}
              className="flex-1 py-2.5 bg-ember text-[#fff] text-sm font-medium rounded-lg hover:bg-ember/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-arabic"
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
  const { t: adminT } = useAdminLanguage();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [viewMode, setViewMode]         = useState<ViewMode>('table');
  const [showNewPanel, setShowNewPanel] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);

  const { data, isLoading, error } = useSessions(statusFilter);
  const sessions = data ?? [];
  const isEmpty = !isLoading && sessions.length === 0;

  const handleOpen = (s: ExtendedSession) => setSelectedSession(s);
  const handleCloseDrawer = () => setSelectedSession(null);

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
          className="flex items-center gap-2 px-4 py-2 bg-ember text-[#fff] text-xs rounded-lg hover:bg-ember/90 transition-colors shrink-0 font-arabic"
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
                  adminT.sessions.drawer.duration,
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
                sessions.map((row) => (
                  <SessionTableRow key={row.id} row={row} onOpen={handleOpen} />
                ))
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
            <CalendarView sessions={sessions} onOpen={handleOpen} />
          )}
        </div>
      )}

      {/* Session detail drawer */}
      <AnimatePresence>
        {selectedSession && (
          <SessionDrawer
            key={selectedSession.id}
            session={selectedSession}
            onClose={handleCloseDrawer}
          />
        )}
      </AnimatePresence>

      {/* New session slide panel */}
      <AnimatePresence>
        {showNewPanel && (
          <NewSessionPanel key="new-session" onClose={() => setShowNewPanel(false)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
