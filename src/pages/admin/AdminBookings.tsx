import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminT } from '@/i18n/adminTranslations';
import {
  Search,
  CalendarPlus,
  AlertCircle,
  ChevronDown,
  Mail,
  Phone,
  Globe,
  Building2,
  CalendarDays,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Copy,
  X,
  Video,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingRequest {
  id:                   string;
  full_name:            string;
  email:                string;
  phone:                string;
  company:              string | null;
  country:              string;
  session_type:         string;
  preferred_date:       string | null;
  preferred_time:       string | null;
  description:          string;
  status:               string;
  admin_notes:          string | null;
  confirmed_date:       string | null;
  confirmed_time:       string | null;
  scheduled_at:         string | null;
  meeting_method:       string | null;
  meeting_link:         string | null;
  converted_session_id: string | null;
  created_at:           string;
  updated_at:           string;
}

// ── Badges ────────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-ember/10 text-ember border-ember/25',
  approved:  'bg-sky-950/30 text-sky-400 border-sky-800/30',
  scheduled: 'bg-recovery/10 text-recovery border-recovery/25',
  completed: 'bg-white/5 text-white/40 border-white/10',
  cancelled: 'bg-crimson/10 text-crimson border-crimson/25',
};

function StatusBadge({ status }: { status: string }) {
  const label = adminT.bookings.status[status] ?? status;
  const style = STATUS_STYLE[status] ?? 'bg-white/5 text-white/40 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
}

function SessionTypeBadge({ type }: { type: string }) {
  const label = adminT.bookings.sessionTypes[type] ?? type;
  const styles: Record<string, string> = {
    founder_call:      'bg-sky-950/30 text-sky-300 border-sky-800/30',
    startup_autopsy:   'bg-amber-950/30 text-amber-300 border-amber-800/30',
    emergency_session: 'bg-crimson/10 text-crimson border-crimson/25',
  };
  const style = styles[type] ?? 'bg-white/5 text-white/40 border-white/10';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
}

// ── Queries / mutations ───────────────────────────────────────────────────────

function useBookings() {
  return useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('booking_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as BookingRequest[];
    },
    staleTime: 30_000,
  });
}

function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookingRequest> }) => {
      const { error } = await (supabase as any)
        .from('booking_requests')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'bookings'] }),
  });
}

// ── Session type mapping ──────────────────────────────────────────────────────

const SESSION_TYPE_MAP: Record<string, string> = {
  founder_call:      'initial',
  startup_autopsy:   'intensive',
  emergency_session: 'emergency',
};

const DEFAULT_DURATION: Record<string, number> = {
  founder_call:      30,
  startup_autopsy:   60,
  emergency_session: 90,
};

const MEETING_METHODS = ['Zoom', 'Google Meet', 'WhatsApp Call', 'Phone Call', 'Other'] as const;

// ── Email builder ─────────────────────────────────────────────────────────────

function buildEmailText(
  booking: BookingRequest,
  date: string,
  time: string,
  duration: number,
  method: string,
  link: string,
): string {
  const typeAr = adminT.bookings.sessionTypes[booking.session_type] ?? booking.session_type;
  const typeEn = booking.session_type.replace(/_/g, ' ');

  return `Subject: ${adminT.bookings.emailPreview.subject}

مرحباً ${booking.full_name}،

يسعدنا إبلاغك بأنه تم تأكيد جلستك مع خبير الفشل.

تفاصيل الجلسة:
• النوع: ${typeAr}
• التاريخ: ${date}
• الوقت: ${time}
• المدة: ${duration} دقيقة
• طريقة الاجتماع: ${method}${link ? `\n• الرابط: ${link}` : ''}

هذه الجلسة سرية تماماً. لن تتم مشاركة أي معلومات مع المستثمرين أو أي طرف ثالث.

مع التحيات،
فريق خبير الفشل

──────────────────────────────────────

Subject: ${adminT.bookings.emailPreview.subjectEn}

Hi ${booking.full_name},

Your advisory session with Khabeer Al Fashal has been confirmed.

Session Details:
• Type: ${typeEn}
• Date: ${date}
• Time: ${time}
• Duration: ${duration} minutes
• Meeting: ${method}${link ? `\n• Link: ${link}` : ''}

This session is strictly confidential. No information will be shared with investors or third parties.

Best regards,
Khabeer Al Fashal Team`;
}

// ── Confirm Session Modal ─────────────────────────────────────────────────────

function ConfirmSessionModal({
  booking,
  onClose,
}: {
  booking: BookingRequest;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const [date, setDate]       = useState(booking.preferred_date ?? '');
  const [time, setTime]       = useState(booking.preferred_time ?? '');
  const [duration, setDuration] = useState(DEFAULT_DURATION[booking.session_type] ?? 60);
  const [method, setMethod]   = useState<string>('Zoom');
  const [link, setLink]       = useState('');
  const [notes, setNotes]     = useState(booking.admin_notes ?? '');

  const [phase, setPhase]     = useState<'form' | 'success'>('form');
  const [emailText, setEmailText] = useState('');
  const [copied, setCopied]   = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const scheduledAt = date && time ? `${date}T${time}:00` : null;
      const sessionType = SESSION_TYPE_MAP[booking.session_type] ?? 'initial';

      const { data: session, error: sessionErr } = await (supabase as any)
        .from('advisory_sessions')
        .insert({
          founder_name:      booking.full_name,
          founder_email:     booking.email,
          company:           booking.company ?? null,
          session_type:      sessionType,
          scheduled_at:      scheduledAt,
          duration_minutes:  duration,
          status:            'confirmed',
          notes:             notes || null,
          source_booking_id: booking.id,
          meeting_method:    method,
          meeting_link:      link || null,
        })
        .select('id')
        .single();

      if (sessionErr) throw sessionErr;

      const { error: bookingErr } = await (supabase as any)
        .from('booking_requests')
        .update({
          status:               'scheduled',
          confirmed_date:       date || null,
          confirmed_time:       time || null,
          scheduled_at:         scheduledAt,
          meeting_method:       method,
          meeting_link:         link || null,
          admin_notes:          notes || booking.admin_notes,
          converted_session_id: session.id,
        })
        .eq('id', booking.id);

      if (bookingErr) throw bookingErr;

      await (supabase as any)
        .from('admin_notifications')
        .insert({
          type:          'session_confirmed',
          title:         'تم تأكيد الجلسة',
          related_table: 'advisory_sessions',
          related_id:    session.id,
          priority:      'high',
          status:        'unread',
        })
        .then(() => {})
        .catch(() => {});

      return { date, time, duration, method, link };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      qc.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setEmailText(buildEmailText(booking, result.date, result.time, result.duration, result.method, result.link));
      setPhase('success');
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(emailText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const inputCls = 'w-full bg-transparent border-b border-white/15 focus:border-ember outline-none py-2 text-sm text-white/70 placeholder:text-white/20 font-arabic';
  const labelCls = 'text-[10px] tracking-[0.25em] uppercase text-white/35 mb-1.5 block';

  const canSubmit = date.length > 0 && time.length > 0 && method.length > 0;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20 bg-black/50" />
      <motion.div
        initial={{ x: 500 }}
        animate={{ x: 0 }}
        exit={{ x: 500 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        dir="rtl"
        className="fixed right-0 top-0 bottom-0 w-[500px] z-30 bg-[#0d0d0d] border-l border-white/6 overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#0d0d0d] z-10">
          <div>
            <p className="text-white font-semibold text-sm font-arabic">
              {adminT.bookings.confirmForm.title}
            </p>
            <p className="text-[11px] text-white/40 font-arabic mt-0.5">{booking.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Form phase ── */}
          {phase === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-6 space-y-5"
            >
              {/* Session type hint */}
              <div className="flex items-center gap-2 p-3 bg-white/3 border border-white/6 rounded-lg">
                <SessionTypeBadge type={booking.session_type} />
                <span className="text-white/40 text-xs font-arabic">{booking.full_name}</span>
              </div>

              {/* Date */}
              <div>
                <label className={labelCls}>{adminT.bookings.confirmForm.confirmedDate} *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Time */}
              <div>
                <label className={labelCls}>{adminT.bookings.confirmForm.confirmedTime} *</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className={labelCls}>{adminT.bookings.confirmForm.durationMinutes} *</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={15}
                  step={15}
                  className={inputCls}
                />
              </div>

              {/* Meeting method */}
              <div>
                <label className={labelCls}>{adminT.bookings.confirmForm.meetingMethod} *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className={cn(inputCls, 'cursor-pointer')}
                  required
                >
                  {MEETING_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Meeting link — shown for Zoom/Google Meet */}
              <div>
                <label className={labelCls}>
                  {adminT.bookings.confirmForm.meetingLink}
                  {(method === 'Zoom' || method === 'Google Meet') && (
                    <span className="text-ember/70 ms-1">*</span>
                  )}
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder={adminT.bookings.confirmForm.linkPlaceholder}
                  className={inputCls}
                />
              </div>

              {/* Admin notes */}
              <div>
                <label className={labelCls}>{adminT.bookings.confirmForm.adminNotes}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={adminT.bookings.notes.placeholder}
                  rows={3}
                  className={cn(inputCls, 'resize-none')}
                />
              </div>

              {/* Submit */}
              <div className="pt-2 space-y-3">
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending || !canSubmit}
                  className="w-full py-3 bg-recovery text-[#060606] text-sm font-bold rounded-xl hover:bg-recovery/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-arabic tracking-wide"
                >
                  {mutation.isPending
                    ? adminT.bookings.confirmForm.submitting
                    : adminT.bookings.confirmForm.submit}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-white/35 hover:text-white/60 text-sm transition-colors font-arabic"
                >
                  {adminT.common.cancel}
                </button>
              </div>

              {mutation.isError && (
                <p className="text-crimson text-xs font-arabic p-3 bg-crimson/8 border border-crimson/20 rounded-lg">
                  فشل تأكيد الجلسة. يرجى المحاولة مرة أخرى.
                </p>
              )}
            </motion.div>
          )}

          {/* ── Success phase ── */}
          {phase === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 p-6 space-y-5"
            >
              {/* Success banner */}
              <div className="flex items-start gap-3 p-4 bg-recovery/10 border border-recovery/25 rounded-xl">
                <CheckCircle2 className="size-5 text-recovery shrink-0 mt-0.5" />
                <p className="text-recovery text-sm font-arabic leading-relaxed">
                  {adminT.bookings.sessionConfirmed}
                </p>
              </div>

              {/* Email preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className={`text-[10px] tracking-[0.25em] uppercase text-white/35 font-arabic`}>
                    {adminT.bookings.emailPreview.title}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/6 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-[11px] text-white/60 hover:text-white/90 transition-all font-arabic"
                  >
                    <Copy className="size-3 shrink-0" />
                    {copied ? adminT.bookings.emailPreview.copied : adminT.bookings.emailPreview.copy}
                  </button>
                </div>
                <pre className="w-full p-4 bg-[#080808] border border-white/8 rounded-xl text-[11px] text-white/50 font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-96 text-left">
                  {emailText}
                </pre>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 border border-white/10 hover:border-white/20 text-white/40 hover:text-white/70 text-sm rounded-xl transition-all font-arabic"
              >
                {adminT.common.close}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({
  booking,
  onClose,
  onConfirm,
}: {
  booking: BookingRequest;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [notes, setNotes]       = useState(booking.admin_notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const update = useUpdateBooking();

  const handleStatusChange = (status: string) => {
    update.mutate({ id: booking.id, updates: { status } });
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await update.mutateAsync({ id: booking.id, updates: { admin_notes: notes } });
    setSavingNotes(false);
  };

  const canConfirm = ['pending', 'approved'].includes(booking.status);

  const statusActions = [
    { key: 'approved',  label: adminT.bookings.actions.approve,  show: booking.status === 'pending' },
    { key: 'completed', label: adminT.bookings.actions.complete,  show: booking.status === 'scheduled' },
    { key: 'cancelled', label: adminT.bookings.actions.cancel,    show: !['completed','cancelled'].includes(booking.status) },
  ].filter((a) => a.show);

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
          <p className="text-sm text-white/80 font-arabic">{booking.full_name}</p>
          <p className="text-[10px] text-white/35 font-arabic mt-0.5">
            {booking.created_at && format(new Date(booking.created_at), 'PPP')}
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

        {/* Status + type */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={booking.status} />
          <SessionTypeBadge type={booking.session_type} />
        </div>

        {/* Confirm Session CTA */}
        {canConfirm && (
          <button
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-recovery/15 hover:bg-recovery/25 border border-recovery/30 hover:border-recovery/50 text-recovery text-sm font-semibold rounded-xl transition-all font-arabic"
          >
            <Video className="size-4 shrink-0" />
            {adminT.bookings.confirmSession}
          </button>
        )}

        {/* Scheduled info (after confirmation) */}
        {booking.status === 'scheduled' && booking.confirmed_date && (
          <div className="p-3 bg-recovery/8 border border-recovery/20 rounded-xl space-y-1.5">
            <p className="text-[10px] text-recovery/70 uppercase tracking-widest font-arabic mb-2">مجدولة</p>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <CalendarDays className="size-3 text-recovery/50" />
              <span>{booking.confirmed_date}</span>
              {booking.confirmed_time && (
                <>
                  <Clock className="size-3 text-recovery/50" />
                  <span>{booking.confirmed_time}</span>
                </>
              )}
            </div>
            {booking.meeting_method && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Video className="size-3 text-recovery/50" />
                <span>{booking.meeting_method}</span>
              </div>
            )}
            {booking.meeting_link && (
              <a
                href={booking.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-sky-400 hover:text-sky-300 truncate mt-1"
              >
                {booking.meeting_link}
              </a>
            )}
          </div>
        )}

        {/* Contact info */}
        <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 space-y-3">
          {[
            { icon: Mail,      val: booking.email },
            { icon: Phone,     val: booking.phone },
            { icon: Globe,     val: booking.country },
            { icon: Building2, val: booking.company },
          ].map(({ icon: Icon, val }) => val && (
            <div key={val} className="flex items-center gap-3 text-xs text-white/60">
              <Icon className="size-3.5 text-white/25 shrink-0" />
              <span className="font-arabic">{val}</span>
            </div>
          ))}
          {booking.preferred_date && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <CalendarDays className="size-3.5 text-white/25 shrink-0" />
              <span className="text-white/40 text-[10px] uppercase tracking-widest font-arabic">مفضّل:</span>
              <span>{booking.preferred_date}</span>
              {booking.preferred_time && <span>{booking.preferred_time}</span>}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-arabic">الوصف</p>
          <p className="text-sm text-white/65 leading-relaxed font-arabic">{booking.description}</p>
        </div>

        {/* Status actions (non-confirm) */}
        {statusActions.length > 0 && (
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-arabic">
              {adminT.bookings.table.actions}
            </p>
            <div className="flex flex-wrap gap-2">
              {statusActions.map((a) => {
                const isDanger = a.key === 'cancelled';
                return (
                  <button
                    key={a.key}
                    onClick={() => handleStatusChange(a.key)}
                    disabled={update.isPending}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[11px] border transition-all font-arabic disabled:opacity-50',
                      isDanger
                        ? 'border-crimson/25 text-crimson hover:bg-crimson/10'
                        : 'border-ember/25 text-ember hover:bg-ember/10'
                    )}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin notes */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 font-arabic">
            {adminT.bookings.notes.label}
          </p>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={adminT.bookings.notes.placeholder}
            className="w-full px-3 py-2.5 bg-white/4 border border-white/8 rounded-lg text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-ember/40 transition-colors resize-none font-arabic text-right"
          />
          <button
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="mt-2 px-4 py-1.5 bg-ember/10 hover:bg-ember/20 border border-ember/25 text-ember text-[11px] rounded-lg transition-all disabled:opacity-50 font-arabic"
          >
            {savingNotes ? adminT.common.loading : adminT.bookings.actions.saveNotes}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ['ALL','PENDING','APPROVED','SCHEDULED','COMPLETED','CANCELLED'] as const;
const TYPE_FILTERS   = ['ALL','founder_call','startup_autopsy','emergency_session'] as const;

export default function AdminBookings() {
  const { data, isLoading, error } = useBookings();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState<string>('ALL');
  const [typeFilter, setType]         = useState<string>('ALL');
  const [selected, setSelected]       = useState<BookingRequest | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<BookingRequest | null>(null);

  const filtered = (data ?? []).filter((b) => {
    const q = search.toLowerCase();
    if (q && !b.full_name.toLowerCase().includes(q) &&
             !b.email.toLowerCase().includes(q) &&
             !(b.company ?? '').toLowerCase().includes(q)) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter.toLowerCase()) return false;
    if (typeFilter !== 'ALL' && b.session_type !== typeFilter) return false;
    return true;
  });

  const total   = data?.length ?? 0;
  const pending = data?.filter((b) => b.status === 'pending').length ?? 0;

  const handleConfirmClose = () => {
    setConfirmBooking(null);
    setSelected(null);
  };

  return (
    <AdminLayout
      title={adminT.bookings.title}
      subtitle={`${total} طلب · ${pending} معلق`}
    >
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 size-4 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.bookings.search}
            className="w-full bg-[#0d0d0d] border border-white/8 rounded-lg pe-10 ps-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-ember/40 font-arabic"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none bg-[#0d0d0d] border border-white/8 rounded-lg ps-4 pe-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-ember/40 font-arabic cursor-pointer"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f} value={f}>{adminT.bookings.filters[f]}</option>
            ))}
          </select>
          <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            className="appearance-none bg-[#0d0d0d] border border-white/8 rounded-lg ps-4 pe-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-ember/40 font-arabic cursor-pointer"
          >
            <option value="ALL">{adminT.common.all}</option>
            {Object.entries(adminT.bookings.sessionTypes).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 size-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-crimson/8 border border-crimson/20 rounded-lg">
          <AlertCircle className="size-4 text-crimson shrink-0" />
          <p className="text-sm text-crimson/80 font-arabic">
            تعذّر تحميل طلبات الحجز. تأكد من تطبيق ترحيل قاعدة البيانات.
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
              <CalendarPlus className="size-10 text-white/10" />
              <p className="text-white/30 text-sm font-arabic">{adminT.bookings.empty}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-[#0a0a0a]">
                  {[
                    adminT.bookings.table.founder,
                    adminT.bookings.table.sessionType,
                    adminT.bookings.table.country,
                    adminT.bookings.table.preferredDate,
                    adminT.bookings.table.status,
                    adminT.bookings.table.created,
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
                {filtered.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    onClick={() => setSelected((prev) => prev?.id === b.id ? null : b)}
                    className={cn(
                      'cursor-pointer transition-colors group',
                      selected?.id === b.id ? 'bg-ember/5' : 'hover:bg-white/3'
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white/80 font-arabic font-medium">{b.full_name}</p>
                      <p className="text-[11px] text-white/35 font-arabic mt-0.5">{b.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <SessionTypeBadge type={b.session_type} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/55 font-arabic text-xs">{b.country}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/45 text-xs">
                        {b.preferred_date ?? <span className="text-white/20">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white/35 text-xs">
                        {b.created_at && format(new Date(b.created_at), 'MMM d, yyyy')}
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
              booking={selected}
              onClose={() => setSelected(null)}
              onConfirm={() => setConfirmBooking(selected)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Confirm session modal */}
      <AnimatePresence>
        {confirmBooking && (
          <ConfirmSessionModal
            key={`confirm-${confirmBooking.id}`}
            booking={confirmBooking}
            onClose={handleConfirmClose}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
