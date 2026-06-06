import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { format, differenceInHours } from 'date-fns';
import { cn } from '@/lib/utils';
import { Copy, Check, Download, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ValleyLead {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  country: string | null;
  risk_score: number | null;
  risk_level: string | null;
  started_at: string | null;
  completed: boolean;
  completed_at: string | null;
  requested_report: boolean;
  requested_session: boolean;
  last_contacted_at: string | null;
  retargeting_notes: string | null;
  created_at: string;
}

interface BookingRequest {
  id: string;
  full_name: string | null;
  email: string;
  company: string | null;
  status: string;
  created_at: string;
}

type Segment = 'abandoned' | 'noReport' | 'noSession' | 'unconfirmed' | 'highRisk';

interface RetargetingData {
  abandoned: ValleyLead[];
  noReport: ValleyLead[];
  noSession: ValleyLead[];
  unconfirmed: BookingRequest[];
  highRisk: ValleyLead[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const RISK_BADGE: Record<string, string> = {
  'INSIDE THE VALLEY':   'text-crimson bg-crimson/10 border-crimson/25',
  'COLLAPSE PROXIMITY':  'text-crimson bg-crimson/10 border-crimson/25',
  'APPROACHING VALLEY':  'text-amber-400 bg-amber-950/25 border-amber-800/30',
  'STABLE':              'text-recovery bg-recovery/8 border-recovery/20',
};

function riskBadgeClass(level: string | null) {
  return level ? (RISK_BADGE[level] ?? 'text-white/40 bg-white/5 border-white/8') : 'text-white/40 bg-white/5 border-white/8';
}

function priorityCritical() {
  return 'text-crimson bg-crimson/10 border-crimson/25';
}
function priorityHigh() {
  return 'text-amber-400 bg-amber-950/25 border-amber-800/30';
}

function abandonedPriority(lead: ValleyLead): string {
  if (!lead.started_at) return priorityHigh();
  const hours = differenceInHours(new Date(), new Date(lead.started_at));
  return hours > 48 ? priorityCritical() : priorityHigh();
}

function noReportPriority(lead: ValleyLead): string {
  const critical = ['INSIDE THE VALLEY', 'COLLAPSE PROXIMITY'];
  return critical.includes(lead.risk_level ?? '') ? priorityCritical() : priorityHigh();
}

function unconfirmedPriority(req: BookingRequest): string {
  const hours = differenceInHours(new Date(), new Date(req.created_at));
  return hours > 24 ? priorityCritical() : priorityHigh();
}

function priorityLabel(cls: string) {
  return cls.includes('crimson') ? 'حرج' : 'عالٍ';
}

function exportCSV(leads: Array<Record<string, unknown>>, filename: string) {
  const headers = ['name', 'email', 'company', 'country', 'risk_level', 'last_contacted_at'];
  const rows = leads.map((l) =>
    headers.map((h) => {
      const v = l[h === 'name' ? 'full_name' : h];
      return `"${String(v ?? '').replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Hook: data fetching ────────────────────────────────────────────────────────

function useRetargetingData() {
  return useQuery<RetargetingData>({
    queryKey: ['admin', 'retargeting'],
    queryFn: async () => {
      const [
        abandonedRes,
        noReportRes,
        noSessionRes,
        unconfirmedRes,
        highRiskRes,
      ] = await Promise.all([
        (supabase as any)
          .from('valley_leads')
          .select('*')
          .eq('completed', false)
          .order('started_at', { ascending: true }),
        (supabase as any)
          .from('valley_leads')
          .select('*')
          .eq('completed', true)
          .eq('requested_report', false),
        (supabase as any)
          .from('valley_leads')
          .select('*')
          .eq('requested_report', true)
          .eq('requested_session', false),
        (supabase as any)
          .from('booking_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
        (supabase as any)
          .from('valley_leads')
          .select('*')
          .in('risk_level', ['INSIDE THE VALLEY', 'COLLAPSE PROXIMITY'])
          .eq('requested_report', false)
          .eq('requested_session', false),
      ]);

      return {
        abandoned:   abandonedRes.data  ?? [],
        noReport:    noReportRes.data   ?? [],
        noSession:   noSessionRes.data  ?? [],
        unconfirmed: unconfirmedRes.data ?? [],
        highRisk:    highRiskRes.data   ?? [],
      };
    },
  });
}

// ── Lead Card ─────────────────────────────────────────────────────────────────

interface LeadCardProps {
  name: string | null;
  email: string;
  company: string | null;
  country?: string | null;
  riskLevel?: string | null;
  riskScore?: number | null;
  dateLabel: string;
  dateValue: string | null;
  lastContacted?: string | null;
  priorityClass: string;
  onMarkContacted: () => void;
  markContactedLoading: boolean;
  contactedSegmentD?: boolean;  // booking_requests segment
  notes?: string | null;
  onSaveNote?: (notes: string) => void;
  saveNoteLoading?: boolean;
}

function LeadCard({
  name,
  email,
  company,
  country,
  riskLevel,
  riskScore,
  dateLabel,
  dateValue,
  lastContacted,
  priorityClass,
  onMarkContacted,
  markContactedLoading,
  contactedSegmentD = false,
  notes,
  onSaveNote,
  saveNoteLoading,
}: LeadCardProps) {
  const [copied, setCopied] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState(notes ?? '');
  const [contactedMessage, setContactedMessage] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleMarkContacted() {
    if (contactedSegmentD) {
      setContactedMessage(true);
      setTimeout(() => setContactedMessage(false), 2500);
      return;
    }
    onMarkContacted();
  }

  return (
    <div className="bg-[#161d27] border border-white/6 rounded-xl p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-arabic text-white/90 font-semibold text-sm truncate">
            {name ?? '—'}
          </span>
          {company && (
            <span className="font-arabic text-white/50 text-xs truncate">{company}</span>
          )}
          <span className="text-white/40 text-xs truncate">{email}</span>
        </div>
        <span className={cn('text-[10px] font-arabic font-medium border rounded-full px-2 py-0.5 shrink-0', priorityClass)}>
          {priorityLabel(priorityClass)}
        </span>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        {country && (
          <span className="text-[10px] text-white/40 bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
            {country}
          </span>
        )}
        {riskLevel && (
          <span className={cn('text-[10px] border rounded-full px-2 py-0.5 font-arabic', riskBadgeClass(riskLevel))}>
            {riskLevel}
          </span>
        )}
        {riskScore !== undefined && riskScore !== null && (
          <span className="text-[10px] text-white/40 bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
            نقاط المخاطرة: {riskScore}
          </span>
        )}
      </div>

      {/* Dates */}
      <div className="flex flex-col gap-1 text-xs text-white/40">
        {dateValue && (
          <span className="font-arabic">
            {dateLabel}: {format(new Date(dateValue), 'MMM d, yyyy HH:mm')}
          </span>
        )}
        {lastContacted && (
          <span className="font-arabic">
            آخر تواصل: {format(new Date(lastContacted), 'MMM d, yyyy HH:mm')}
          </span>
        )}
      </div>

      {/* Contacted message (segment D) */}
      <AnimatePresence>
        {contactedMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-arabic text-recovery bg-recovery/8 border border-recovery/20 rounded-lg px-3 py-1.5 text-center"
          >
            تم تسجيل التواصل
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Mark contacted */}
        <button
          onClick={handleMarkContacted}
          disabled={markContactedLoading && !contactedSegmentD}
          title={contactedSegmentD ? 'التعديل متاح من صفحة الحجوزات' : undefined}
          className={cn(
            'flex-1 text-xs font-arabic py-1.5 rounded-lg border transition-colors',
            contactedSegmentD
              ? 'text-white/20 bg-white/3 border-white/6 cursor-not-allowed opacity-50'
              : 'text-white/70 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white',
          )}
        >
          {markContactedLoading && !contactedSegmentD ? '...' : 'تم التواصل'}
        </button>

        {/* Copy email */}
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1 text-xs font-arabic py-1.5 rounded-lg border text-white/70 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-recovery" /> : <Copy size={12} />}
          {copied ? '✓' : 'نسخ البريد'}
        </button>

        {/* Add note */}
        {!contactedSegmentD && onSaveNote && (
          <button
            onClick={() => setNoteOpen((o) => !o)}
            title={contactedSegmentD ? 'التعديل متاح من صفحة الحجوزات' : undefined}
            className="flex-1 flex items-center justify-center gap-1 text-xs font-arabic py-1.5 rounded-lg border text-white/70 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronDown size={12} className={cn('transition-transform', noteOpen && 'rotate-180')} />
            إضافة ملاحظة
          </button>
        )}
        {contactedSegmentD && (
          <button
            disabled
            title="التعديل متاح من صفحة الحجوزات"
            className="flex-1 text-xs font-arabic py-1.5 rounded-lg border text-white/20 bg-white/3 border-white/6 cursor-not-allowed opacity-50"
          >
            إضافة ملاحظة
          </button>
        )}
      </div>

      {/* Note textarea */}
      <AnimatePresence>
        {noteOpen && onSaveNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-1">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="أضف ملاحظة..."
                className="font-arabic w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 resize-none"
              />
              <button
                onClick={() => {
                  onSaveNote(noteText);
                  setNoteOpen(false);
                }}
                disabled={saveNoteLoading}
                className="self-end text-xs font-arabic px-4 py-1.5 rounded-lg bg-ember/10 text-ember border border-ember/20 hover:bg-ember/20 transition-colors"
              >
                {saveNoteLoading ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Segment Header ─────────────────────────────────────────────────────────────

function SegmentHeader({
  title,
  count,
  onExport,
}: {
  title: string;
  count: number;
  onExport: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="font-arabic text-white/80 font-semibold text-sm">{title}</h2>
        <span className="text-xs text-white/40 bg-white/5 border border-white/8 rounded-full px-2 py-0.5">
          {count}
        </span>
      </div>
      <button
        onClick={onExport}
        className="flex items-center gap-1.5 text-xs font-arabic text-white/50 hover:text-white/80 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 transition-colors"
      >
        <Download size={12} />
        تصدير CSV
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<Segment, string> = {
  abandoned:   'بدأوا وتركوا',
  noReport:    'أكملوا بلا تقرير',
  noSession:   'طلبوا تقريراً بلا جلسة',
  unconfirmed: 'حجزوا بلا تأكيد',
  highRisk:    'مخاطر عالية بلا إجراء',
};

const SEGMENTS: Segment[] = ['abandoned', 'noReport', 'noSession', 'unconfirmed', 'highRisk'];

export default function AdminRetargeting() {
  const [activeSegment, setActiveSegment] = useState<Segment>('abandoned');
  const qc = useQueryClient();
  const { data, isLoading } = useRetargetingData();

  const markContacted = useMutation({
    mutationFn: async (id: string) =>
      (supabase as any)
        .from('valley_leads')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'retargeting'] }),
  });

  const saveNote = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) =>
      (supabase as any)
        .from('valley_leads')
        .update({ retargeting_notes: notes })
        .eq('id', id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'retargeting'] }),
  });

  const segmentCounts: Record<Segment, number> = {
    abandoned:   data?.abandoned.length  ?? 0,
    noReport:    data?.noReport.length   ?? 0,
    noSession:   data?.noSession.length  ?? 0,
    unconfirmed: data?.unconfirmed.length ?? 0,
    highRisk:    data?.highRisk.length   ?? 0,
  };

  // ── Export helpers ───────────────────────────────────────────────────────────

  function exportValleyLeads(leads: ValleyLead[], filename: string) {
    exportCSV(leads as unknown as Array<Record<string, unknown>>, filename);
  }

  function exportBookingRequests(bookings: BookingRequest[], filename: string) {
    const mapped = bookings.map((b) => ({
      full_name: b.full_name,
      email: b.email,
      company: b.company,
      country: null,
      risk_level: null,
      last_contacted_at: null,
    }));
    exportCSV(mapped as Array<Record<string, unknown>>, filename);
  }

  // ── Segment content ──────────────────────────────────────────────────────────

  function renderSegment() {
    if (isLoading || !data) {
      return (
        <div className="flex items-center justify-center py-16 text-white/30 font-arabic text-sm">
          جارٍ التحميل...
        </div>
      );
    }

    if (activeSegment === 'abandoned') {
      const leads = data.abandoned;
      return (
        <>
          <SegmentHeader
            title={SEGMENT_LABELS.abandoned}
            count={leads.length}
            onExport={() => exportValleyLeads(leads, 'abandoned-leads.csv')}
          />
          {leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  name={lead.full_name}
                  email={lead.email}
                  company={lead.company}
                  country={lead.country}
                  dateLabel="بدأ في"
                  dateValue={lead.started_at}
                  lastContacted={lead.last_contacted_at}
                  priorityClass={abandonedPriority(lead)}
                  onMarkContacted={() => markContacted.mutate(lead.id)}
                  markContactedLoading={markContacted.isPending}
                  notes={lead.retargeting_notes}
                  onSaveNote={(notes) => saveNote.mutate({ id: lead.id, notes })}
                  saveNoteLoading={saveNote.isPending}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (activeSegment === 'noReport') {
      const leads = data.noReport;
      return (
        <>
          <SegmentHeader
            title={SEGMENT_LABELS.noReport}
            count={leads.length}
            onExport={() => exportValleyLeads(leads, 'no-report-leads.csv')}
          />
          {leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  name={lead.full_name}
                  email={lead.email}
                  company={lead.company}
                  riskLevel={lead.risk_level}
                  dateLabel="أكمل في"
                  dateValue={lead.completed_at}
                  lastContacted={lead.last_contacted_at}
                  priorityClass={noReportPriority(lead)}
                  onMarkContacted={() => markContacted.mutate(lead.id)}
                  markContactedLoading={markContacted.isPending}
                  notes={lead.retargeting_notes}
                  onSaveNote={(notes) => saveNote.mutate({ id: lead.id, notes })}
                  saveNoteLoading={saveNote.isPending}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (activeSegment === 'noSession') {
      const leads = data.noSession;
      return (
        <>
          <SegmentHeader
            title={SEGMENT_LABELS.noSession}
            count={leads.length}
            onExport={() => exportValleyLeads(leads, 'no-session-leads.csv')}
          />
          {leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  name={lead.full_name}
                  email={lead.email}
                  company={lead.company}
                  riskLevel={lead.risk_level}
                  dateLabel="تاريخ الإنشاء"
                  dateValue={lead.created_at}
                  lastContacted={lead.last_contacted_at}
                  priorityClass={priorityHigh()}
                  onMarkContacted={() => markContacted.mutate(lead.id)}
                  markContactedLoading={markContacted.isPending}
                  notes={lead.retargeting_notes}
                  onSaveNote={(notes) => saveNote.mutate({ id: lead.id, notes })}
                  saveNoteLoading={saveNote.isPending}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (activeSegment === 'unconfirmed') {
      const bookings = data.unconfirmed;
      return (
        <>
          <SegmentHeader
            title={SEGMENT_LABELS.unconfirmed}
            count={bookings.length}
            onExport={() => exportBookingRequests(bookings, 'unconfirmed-bookings.csv')}
          />
          {bookings.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {bookings.map((booking) => (
                <LeadCard
                  key={booking.id}
                  name={booking.full_name}
                  email={booking.email}
                  company={booking.company}
                  dateLabel="تاريخ الحجز"
                  dateValue={booking.created_at}
                  priorityClass={unconfirmedPriority(booking)}
                  onMarkContacted={() => {}}
                  markContactedLoading={false}
                  contactedSegmentD
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (activeSegment === 'highRisk') {
      const leads = data.highRisk;
      return (
        <>
          <SegmentHeader
            title={SEGMENT_LABELS.highRisk}
            count={leads.length}
            onExport={() => exportValleyLeads(leads, 'high-risk-leads.csv')}
          />
          {leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  name={lead.full_name}
                  email={lead.email}
                  company={lead.company}
                  riskLevel={lead.risk_level}
                  riskScore={lead.risk_score}
                  dateLabel="تاريخ الإنشاء"
                  dateValue={lead.created_at}
                  lastContacted={lead.last_contacted_at}
                  priorityClass={priorityCritical()}
                  onMarkContacted={() => markContacted.mutate(lead.id)}
                  markContactedLoading={markContacted.isPending}
                  notes={lead.retargeting_notes}
                  onSaveNote={(notes) => saveNote.mutate({ id: lead.id, notes })}
                  saveNoteLoading={saveNote.isPending}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    return null;
  }

  return (
    <AdminLayout title="إعادة الاستهداف" subtitle="العملاء المحتاجون للمتابعة">
      {/* Segment tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SEGMENTS.map((seg) => (
          <button
            key={seg}
            onClick={() => setActiveSegment(seg)}
            className={cn(
              'flex items-center gap-2 text-xs font-arabic px-4 py-2 rounded-full border transition-colors',
              activeSegment === seg
                ? 'bg-ember/10 text-white border-ember/20'
                : 'text-white/50 bg-white/3 border-white/8 hover:bg-white/8 hover:text-white/80',
            )}
          >
            {SEGMENT_LABELS[seg]}
            <span
              className={cn(
                'text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center',
                activeSegment === seg
                  ? 'bg-ember/20 text-ember'
                  : 'bg-white/8 text-white/40',
              )}
            >
              {segmentCounts[seg]}
            </span>
          </button>
        ))}
      </div>

      {/* Segment content */}
      <div>{renderSegment()}</div>
    </AdminLayout>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
        <Check size={20} className="text-white/20" />
      </div>
      <span className="font-arabic text-sm">لا يوجد عملاء في هذا القسم</span>
    </div>
  );
}
