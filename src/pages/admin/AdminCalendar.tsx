import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  AlertCircle,
  Mail,
  Building2,
  Video,
  X,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarBooking {
  id:             string;
  full_name:      string;
  email:          string;
  company:        string | null;
  session_type:   string;
  status:         string;
  confirmed_date: string | null;
  confirmed_time: string | null;
  scheduled_at:   string | null;
  meeting_method: string | null;
  meeting_link:   string | null;
}

interface CalendarEvent {
  booking: CalendarBooking;
  date:    Date;
}

// ── Status styling (mirrors AdminBookings StatusBadge) ───────────────────────

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-ember/10 text-ember border-ember/25',
  approved:  'bg-sky-950/30 text-sky-400 border-sky-800/30',
  scheduled: 'bg-recovery/10 text-recovery border-recovery/25',
  completed: 'bg-white/5 text-white/40 border-white/10',
  cancelled: 'bg-crimson/10 text-crimson border-crimson/25',
};

// ── Query ─────────────────────────────────────────────────────────────────────

function useCalendarBookings() {
  return useQuery({
    queryKey: ['admin', 'calendar', 'bookings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('booking_requests')
        .select(
          'id, full_name, email, company, session_type, status, confirmed_date, confirmed_time, scheduled_at, meeting_method, meeting_link'
        )
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CalendarBooking[];
    },
    staleTime: 30_000,
  });
}

function eventDateOf(b: CalendarBooking): Date | null {
  if (b.scheduled_at) return new Date(b.scheduled_at);
  if (b.confirmed_date) return parseISO(b.confirmed_date);
  return null;
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  booking,
  onClose,
}: {
  booking: CalendarBooking;
  onClose: () => void;
}) {
  const { t: adminT } = useAdminLanguage();

  const dateLabel = booking.scheduled_at
    ? format(new Date(booking.scheduled_at), 'PPP p')
    : booking.confirmed_date
      ? `${booking.confirmed_date}${booking.confirmed_time ? ` · ${booking.confirmed_time}` : ''}`
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-[340px] shrink-0 bg-[#0b0b0b] border-s border-white/5 rounded-e-xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="min-w-0">
          <p className="text-sm text-white/80 font-arabic truncate">{booking.full_name}</p>
          {dateLabel && <p className="text-[10px] text-white/35 mt-0.5">{dateLabel}</p>}
        </div>
        <button
          onClick={onClose}
          className="size-7 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5 shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Status + type */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic whitespace-nowrap',
              STATUS_STYLE[booking.status] ?? 'bg-white/5 text-white/40 border-white/10'
            )}
          >
            {adminT.bookings.status[booking.status] ?? booking.status}
          </span>
          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border border-white/10 bg-white/5 text-white/50 font-arabic whitespace-nowrap">
            {adminT.bookings.sessionTypes[booking.session_type] ?? booking.session_type}
          </span>
        </div>

        {/* Contact + meeting info */}
        <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 text-xs text-white/60">
            <Mail className="size-3.5 text-white/25 shrink-0" />
            <span className="truncate">{booking.email}</span>
          </div>
          {booking.company && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <Building2 className="size-3.5 text-white/25 shrink-0" />
              <span className="font-arabic truncate">{booking.company}</span>
            </div>
          )}
          {booking.meeting_method && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <Video className="size-3.5 text-white/25 shrink-0" />
              <span>{booking.meeting_method}</span>
            </div>
          )}
          {booking.meeting_link && (
            <a
              href={booking.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-sky-400 hover:text-sky-300 truncate"
            >
              {booking.meeting_link}
            </a>
          )}
        </div>

        <Link
          to="/admin/bookings"
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-ember/10 hover:bg-ember/20 border border-ember/25 text-ember text-sm font-semibold rounded-xl transition-all font-arabic"
        >
          <ExternalLink className="size-4 shrink-0" />
          {adminT.calendar.viewInBookings}
        </Link>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminCalendar() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading, error } = useCalendarBookings();

  const [month, setMonth]       = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<CalendarBooking | null>(null);

  const events = useMemo<CalendarEvent[]>(() => {
    return (data ?? [])
      .map((booking) => ({ booking, date: eventDateOf(booking) }))
      .filter((e): e is CalendarEvent => e.date !== null);
  }, [data]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = format(e.date, 'yyyy-MM-dd');
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end   = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const sessionTypeLabel = (type: string) => adminT.bookings.sessionTypes[type] ?? type;

  const hasAnyEvents = events.length > 0;

  return (
    <AdminLayout title={adminT.calendar.title} subtitle={adminT.calendar.subtitle}>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="size-8 flex items-center justify-center text-white/40 hover:text-white/80 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Previous month"
          >
            <ChevronRight className="size-4" />
          </button>
          <p className="text-sm text-white/70 font-medium min-w-[140px] text-center select-none">
            {format(month, 'MMMM yyyy')}
          </p>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="size-8 flex items-center justify-center text-white/40 hover:text-white/80 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Next month"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>
        <button
          onClick={() => setMonth(startOfMonth(new Date()))}
          className="px-3 py-1.5 text-[11px] tracking-wide rounded-lg border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors font-arabic"
        >
          {adminT.calendar.today}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-crimson/8 border border-crimson/20 rounded-lg">
          <AlertCircle className="size-4 text-crimson shrink-0" />
          <p className="text-sm text-crimson/80 font-arabic">{adminT.calendar.errorHint}</p>
        </div>
      )}

      {!isLoading && !hasAnyEvents ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 border border-white/6 rounded-xl">
          <CalendarDays className="size-10 text-white/10" />
          <p className="text-white/30 text-sm font-arabic">{adminT.calendar.empty}</p>
          <p className="text-white/20 text-xs font-arabic max-w-sm text-center px-6">
            {adminT.calendar.emptyHint}
          </p>
        </div>
      ) : (
        <div className="flex gap-0">
          {/* Grid */}
          <div
            className={cn(
              'flex-1 min-w-0 rounded-xl border border-white/6 overflow-hidden',
              selected && 'rounded-e-none border-e-0'
            )}
          >
            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-[#0a0a0a]">
              {days.slice(0, 7).map((d) => (
                <div
                  key={d.toISOString()}
                  className="px-2 py-2 text-[10px] tracking-[0.15em] uppercase text-white/30 text-center"
                >
                  {format(d, 'EEE')}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {isLoading
                ? [...Array(35)].map((_, i) => (
                    <div key={i} className="h-24 border-b border-e border-white/4 bg-white/2 animate-pulse" />
                  ))
                : days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDay.get(key) ?? [];
                    const inMonth = isSameMonth(day, month);
                    return (
                      <div
                        key={key}
                        className={cn(
                          'min-h-24 p-1.5 border-b border-e border-white/4 last:border-e-0',
                          !inMonth && 'bg-white/[0.015]'
                        )}
                      >
                        <p
                          className={cn(
                            'text-[11px] mb-1',
                            isToday(day)
                              ? 'text-ember font-semibold'
                              : inMonth
                                ? 'text-white/50'
                                : 'text-white/15'
                          )}
                        >
                          {format(day, 'd')}
                        </p>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(({ booking }) => (
                            <button
                              key={booking.id}
                              onClick={() => setSelected(booking)}
                              title={`${booking.full_name} — ${sessionTypeLabel(booking.session_type)}`}
                              className={cn(
                                'w-full text-start px-1.5 py-1 rounded-md text-[10px] truncate border transition-colors',
                                STATUS_STYLE[booking.status] ?? 'bg-white/5 text-white/40 border-white/10',
                                selected?.id === booking.id && 'ring-1 ring-ember/40'
                              )}
                            >
                              {booking.full_name}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[9px] text-white/25 px-1.5">+{dayEvents.length - 3}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && <DetailPanel key={selected.id} booking={selected} onClose={() => setSelected(null)} />}
          </AnimatePresence>
        </div>
      )}
    </AdminLayout>
  );
}
