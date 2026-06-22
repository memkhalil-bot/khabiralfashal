import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import {
  Search,
  Mail,
  Building2,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  CalendarPlus,
  Inbox,
  Package,
  UserCircle,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type AdminT = ReturnType<typeof useAdminLanguage>['t'];

type SourceType = 'valley' | 'booking' | 'report' | 'failkit' | 'assessment';

interface ValleyRow {
  id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  country: string | null;
  completed: boolean;
  requested_report: boolean;
  requested_session: boolean;
  risk_level: string | null;
  last_contacted_at: string | null;
  retargeting_notes: string | null;
  created_at: string;
}

interface BookingRow {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  session_type: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface ReportRow {
  id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  report_type: string;
  workflow_status: string;
  risk_level: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface FailKitRow {
  id: string;
  full_name: string;
  email: string;
  failure_category: string | null;
  severity: string | null;
  recommended_service: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface AssessmentRow {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  country: string | null;
  risk_level: string | null;
  primary_failure_mode: string | null;
  insight: string | null;
  created_at: string | null;
}

type Contact =
  | { source: 'valley'; row: ValleyRow }
  | { source: 'booking'; row: BookingRow }
  | { source: 'report'; row: ReportRow }
  | { source: 'failkit'; row: FailKitRow }
  | { source: 'assessment'; row: AssessmentRow };

type TemplateKey =
  | 'newInquiry'
  | 'bookingConfirmation'
  | 'reportRequest'
  | 'failKitRequest'
  | 'followUp'
  | 'needsClarification';

const TEMPLATE_KEYS: TemplateKey[] = [
  'newInquiry',
  'bookingConfirmation',
  'reportRequest',
  'failKitRequest',
  'followUp',
  'needsClarification',
];

const SOURCE_META: Record<SourceType, { icon: React.ElementType; route: string }> = {
  valley:      { icon: TrendingUp,   route: '/admin/valley-leads' },
  booking:     { icon: CalendarPlus, route: '/admin/bookings' },
  report:      { icon: Inbox,        route: '/admin/report-queue' },
  failkit:     { icon: Package,      route: '/admin/fail-kit' },
  assessment:  { icon: UserCircle,   route: '/admin/founders' },
};

// ── Query ─────────────────────────────────────────────────────────────────────

function useEmailContacts() {
  return useQuery({
    queryKey: ['admin', 'email', 'contacts'],
    queryFn: async () => {
      const [valley, booking, report, failkit, assessment] = await Promise.all([
        (supabase as any)
          .from('valley_leads')
          .select('id, full_name, email, company, country, completed, requested_report, requested_session, risk_level, last_contacted_at, retargeting_notes, created_at')
          .order('created_at', { ascending: false })
          .limit(300),
        (supabase as any)
          .from('booking_requests')
          .select('id, full_name, email, company, session_type, description, status, created_at')
          .order('created_at', { ascending: false })
          .limit(300),
        (supabase as any)
          .from('report_requests')
          .select('id, full_name, email, company, report_type, workflow_status, risk_level, admin_notes, created_at')
          .order('created_at', { ascending: false })
          .limit(300),
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, full_name, email, failure_category, severity, recommended_service, status, admin_notes, created_at')
          .order('created_at', { ascending: false })
          .limit(300),
        (supabase as any)
          .from('founder_assessments')
          .select('id, name, email, company, country, risk_level, primary_failure_mode, insight, created_at')
          .order('created_at', { ascending: false })
          .limit(300),
      ]);

      for (const r of [valley, booking, report, failkit, assessment]) {
        if (r.error) throw r.error;
      }

      const contacts: Contact[] = [
        ...(valley.data ?? []).map((row: ValleyRow) => ({ source: 'valley' as const, row })),
        ...(booking.data ?? []).map((row: BookingRow) => ({ source: 'booking' as const, row })),
        ...(report.data ?? []).map((row: ReportRow) => ({ source: 'report' as const, row })),
        ...(failkit.data ?? []).map((row: FailKitRow) => ({ source: 'failkit' as const, row })),
        ...(assessment.data ?? []).map((row: AssessmentRow) => ({ source: 'assessment' as const, row })),
      ];

      contacts.sort((a, b) => {
        const da = a.row.created_at ? new Date(a.row.created_at).getTime() : 0;
        const db = b.row.created_at ? new Date(b.row.created_at).getTime() : 0;
        return db - da;
      });

      return contacts;
    },
    staleTime: 30_000,
  });
}

// ── Accessors ─────────────────────────────────────────────────────────────────

function contactId(c: Contact): string {
  return `${c.source}:${c.row.id}`;
}

function contactName(c: Contact): string | null {
  return c.source === 'assessment' ? c.row.name : c.row.full_name;
}

function contactEmail(c: Contact): string | null {
  return c.row.email;
}

function contactCompany(c: Contact): string | null {
  return c.source === 'failkit' ? null : c.row.company;
}

function contactCreatedAt(c: Contact): string | null {
  return c.row.created_at;
}

function statusLabel(c: Contact, t: AdminT): string | null {
  switch (c.source) {
    case 'valley':
      return c.row.completed ? t.valleyLeads.status.completed : t.valleyLeads.status.abandoned;
    case 'booking':
      return t.bookings.status[c.row.status] ?? c.row.status;
    case 'report':
      return t.reportQueue.workflowStatus[c.row.workflow_status] ?? c.row.workflow_status;
    case 'failkit':
      return t.failKit.statuses[c.row.status] ?? c.row.status;
    case 'assessment':
      return null;
  }
}

function requestTypeLabel(c: Contact, t: AdminT): string | null {
  switch (c.source) {
    case 'valley':
      return null;
    case 'booking':
      return t.bookings.sessionTypes[c.row.session_type] ?? c.row.session_type;
    case 'report':
      return c.row.report_type;
    case 'failkit':
      return (
        c.row.recommended_service ??
        (c.row.failure_category ? (t.failKit.category[c.row.failure_category] ?? c.row.failure_category) : null)
      );
    case 'assessment':
      return c.row.primary_failure_mode;
  }
}

function contactNotes(c: Contact): string | null {
  switch (c.source) {
    case 'valley':
      return c.row.retargeting_notes;
    case 'booking':
      return c.row.description;
    case 'report':
      return c.row.admin_notes;
    case 'failkit':
      return c.row.admin_notes;
    case 'assessment':
      return c.row.insight;
  }
}

function needsFollowUp(c: Contact): boolean {
  switch (c.source) {
    case 'valley':
      return !c.row.completed || ((c.row.requested_report || c.row.requested_session) && !c.row.last_contacted_at);
    case 'booking':
      return c.row.status === 'pending';
    case 'report':
      return c.row.workflow_status === 'pending_review' || c.row.workflow_status === 'draft_ready';
    case 'failkit':
      return ['requested', 'under_review', 'follow_up'].includes(c.row.status);
    case 'assessment':
      return false;
  }
}

function canMarkContacted(c: Contact): boolean {
  return c.source === 'valley';
}

// ── Draft generation ──────────────────────────────────────────────────────────

function defaultTemplateFor(c: Contact): TemplateKey {
  if (needsFollowUp(c) && (c.source === 'valley' || c.source === 'assessment')) return 'followUp';
  switch (c.source) {
    case 'valley':
      return 'newInquiry';
    case 'booking':
      return 'bookingConfirmation';
    case 'report':
      return 'reportRequest';
    case 'failkit':
      return 'failKitRequest';
    case 'assessment':
      return 'newInquiry';
  }
}

function generateDraft(c: Contact, template: TemplateKey, t: AdminT): string {
  const name = contactName(c);
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const company = contactCompany(c);
  const companyClause = company ? ` من ${company}` : '';
  const reqType = requestTypeLabel(c, t);

  let body = '';
  switch (template) {
    case 'newInquiry':
      body = `شكراً لتواصلك مع خبير الفشل${companyClause}. استلمنا طلبك وسنراجعه ونعاود التواصل معك في أقرب وقت.\n\nإذا كان لديك أي تفاصيل إضافية تود إضافتها، يسعدنا استقبالها.`;
      break;
    case 'bookingConfirmation': {
      const clause = reqType ? ` لجلسة ${reqType}` : '';
      body = `نشكرك على طلبك${clause}. سنتواصل معك قريباً لتأكيد موعد الجلسة وتفاصيلها.`;
      break;
    }
    case 'reportRequest': {
      const clause = reqType ? ` لتقرير ${reqType}` : '';
      body = `استلمنا طلبك${clause}. فريقنا يعمل على مراجعته وسنوافيك بالتحديثات بمجرد جاهزية التقرير.`;
      break;
    }
    case 'failKitRequest': {
      const clause = reqType ? ` (${reqType})` : '';
      body = `استلمنا طلبك لحقيبة الفشل${clause}. سنراجع التفاصيل ونوافيك بالخطوات التالية قريباً.`;
      break;
    }
    case 'followUp': {
      const clause = reqType ? ` بخصوص ${reqType}` : '';
      body = `نتابع معك${clause}. هل ما زلت مهتماً بالمتابعة؟ يسعدنا مساعدتك في الخطوة التالية في أي وقت يناسبك.`;
      break;
    }
    case 'needsClarification': {
      const clause = reqType ? ` بخصوص ${reqType}` : '';
      body = `شكراً لتواصلك معنا${companyClause}. قبل المتابعة${clause}، نحتاج بعض التوضيح الإضافي لنتمكن من مساعدتك بأفضل شكل. هل يمكنك تزويدنا بمزيد من التفاصيل؟`;
      break;
    }
  }

  return `${greeting}\n\n${body}\n\nمع التحية،\nفريق خبير الفشل`;
}

// ── Badges ────────────────────────────────────────────────────────────────────

function SourceBadge({ source, t }: { source: SourceType; t: AdminT }) {
  const Icon = SOURCE_META[source].icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-white/5 text-white/45 border-white/10 font-arabic whitespace-nowrap">
      <Icon className="size-2.5 shrink-0" />
      {t.email.source[source]}
    </span>
  );
}

function StatusPill({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-white/5 text-white/40 border-white/10 font-arabic whitespace-nowrap">
      {label}
    </span>
  );
}

function FollowUpDot() {
  return <span className="size-2 rounded-full bg-ember shrink-0" title="needs follow-up" />;
}

// ── Left column: contact list ────────────────────────────────────────────────

function ContactRow({
  contact,
  selected,
  onSelect,
  t,
}: {
  contact:  Contact;
  selected: boolean;
  onSelect: () => void;
  t:        AdminT;
}) {
  const name    = contactName(contact);
  const email   = contactEmail(contact);
  const company = contactCompany(contact);
  const created = contactCreatedAt(contact);
  const status  = statusLabel(contact, t);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-start px-4 py-3 border-b border-white/5 hover:bg-white/4 transition-colors',
        selected && 'bg-ember/5'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-sm text-white/80 font-arabic truncate">{name ?? t.email.noName}</p>
        {needsFollowUp(contact) && <FollowUpDot />}
      </div>
      <p className="text-xs text-white/35 truncate mb-2">{email ?? '—'}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <SourceBadge source={contact.source} t={t} />
        <StatusPill label={status} />
        {company && (
          <span className="inline-flex items-center gap-1 text-[10px] text-white/30 font-arabic">
            <Building2 className="size-2.5 shrink-0" />
            {company}
          </span>
        )}
      </div>
      {created && <p className="text-[10px] text-white/20 mt-1.5">{format(new Date(created), 'PP')}</p>}
    </button>
  );
}

// ── Middle column: selected contact details ──────────────────────────────────

function DetailPanel({ contact, t }: { contact: Contact | null; t: AdminT }) {
  if (!contact) {
    return (
      <div className="flex-1 rounded-xl border border-white/6 flex flex-col items-center justify-center text-center gap-2 py-24">
        <Mail className="size-8 text-white/10" />
        <p className="text-sm text-white/40 font-arabic">{t.email.noSelection}</p>
        <p className="text-xs text-white/20 font-arabic max-w-[260px]">{t.email.noSelectionHint}</p>
      </div>
    );
  }

  const name    = contactName(contact);
  const email   = contactEmail(contact);
  const company = contactCompany(contact);
  const created = contactCreatedAt(contact);
  const status  = statusLabel(contact, t);
  const reqType = requestTypeLabel(contact, t);
  const notes   = contactNotes(contact);
  const route   = SOURCE_META[contact.source].route;

  return (
    <div className="flex-1 min-w-0 rounded-xl border border-white/6 bg-[#0b0b0b] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="min-w-0">
          <p className="text-sm text-white/85 font-arabic truncate">{name ?? t.email.noName}</p>
          <p className="text-xs text-white/35 truncate">{email ?? '—'}</p>
        </div>
        <Link
          to={route}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-colors font-arabic shrink-0"
        >
          <ExternalLink className="size-3" />
          {t.email.viewSource}
        </Link>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <SourceBadge source={contact.source} t={t} />
          <StatusPill label={status} />
          {needsFollowUp(contact) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border bg-ember/10 text-ember border-ember/25 font-arabic">
              <AlertCircle className="size-2.5" />
              {t.email.needsFollowUp}
            </span>
          )}
        </div>

        <div className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 space-y-3">
          {company && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <Building2 className="size-3.5 text-white/25 shrink-0" />
              <span className="font-arabic truncate">{company}</span>
            </div>
          )}
          {reqType && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <Inbox className="size-3.5 text-white/25 shrink-0" />
              <span className="font-arabic truncate">{reqType}</span>
            </div>
          )}
          {created && (
            <div className="flex items-center gap-3 text-xs text-white/60">
              <CalendarDays className="size-3.5 text-white/25 shrink-0" />
              <span>{format(new Date(created), 'PPP')}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-white/20 font-arabic mb-1.5">
            {t.email.fields.notes}
          </p>
          <p className="text-xs text-white/50 font-arabic leading-relaxed whitespace-pre-wrap">
            {notes || t.email.noNotes}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Right column: reply draft ────────────────────────────────────────────────

function ReplyDraftPanel({
  contact,
  t,
}: {
  contact: Contact | null;
  t:       AdminT;
}) {
  const qc = useQueryClient();
  const [template, setTemplate]   = useState<TemplateKey>('newInquiry');
  const [draftText, setDraftText] = useState('');
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (!contact) {
      setDraftText('');
      return;
    }
    const next = defaultTemplateFor(contact);
    setTemplate(next);
    setDraftText(generateDraft(contact, next, t));
  }, [contact ? contactId(contact) : null]);

  useEffect(() => {
    if (contact) setDraftText(generateDraft(contact, template, t));
  }, [template]);

  const markContacted = useMutation({
    mutationFn: async (id: string) =>
      (supabase as any).from('valley_leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'email', 'contacts'] }),
  });

  function handleCopy() {
    navigator.clipboard.writeText(draftText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="w-full lg:w-[340px] shrink-0 rounded-xl border border-white/6 bg-[#0b0b0b] overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-sm text-white/70 font-arabic">{t.email.draft.title}</p>
      </div>

      <div className="p-5 space-y-4 flex-1 flex flex-col">
        <div>
          <label className="text-[10px] tracking-[0.15em] uppercase text-white/20 font-arabic mb-1.5 block">
            {t.email.draft.template}
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateKey)}
            disabled={!contact}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 font-arabic cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {TEMPLATE_KEYS.map((key) => (
              <option key={key} value={key}>
                {t.email.draft.templates[key]}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          disabled={!contact}
          dir="rtl"
          className="flex-1 min-h-[200px] bg-[#0f0f0f] border border-white/6 rounded-xl px-3.5 py-3 text-xs text-white/60 font-arabic leading-relaxed resize-none focus:outline-none focus:border-white/15 disabled:opacity-40"
        />

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!contact}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold font-arabic transition-all border disabled:opacity-40 disabled:cursor-not-allowed',
              copied
                ? 'bg-recovery/10 text-recovery border-recovery/25'
                : 'bg-ember/10 hover:bg-ember/20 text-ember border-ember/25'
            )}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t.email.draft.copied : t.email.draft.copy}
          </button>

          {contact && canMarkContacted(contact) && (
            <button
              onClick={() => markContacted.mutate(contact.row.id)}
              disabled={markContacted.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-arabic border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 transition-colors disabled:opacity-40"
            >
              {markContacted.isPending ? '...' : t.email.markContacted}
            </button>
          )}
        </div>

        {contact?.source === 'valley' && (
          <p className="text-[10px] text-white/20 font-arabic">
            {contact.row.last_contacted_at
              ? `${t.email.contactedAt} ${format(new Date(contact.row.last_contacted_at), 'PP')}`
              : t.email.notContactedYet}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const FILTER_SOURCES: Array<SourceType | 'all'> = ['all', 'valley', 'booking', 'report', 'failkit', 'assessment'];

export default function AdminEmail() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading, error } = useEmailContacts();

  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<SourceType | 'all'>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const contacts = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter !== 'all' && c.source !== filter) return false;
      if (!q) return true;
      const name    = (contactName(c) ?? '').toLowerCase();
      const email   = (contactEmail(c) ?? '').toLowerCase();
      const company = (contactCompany(c) ?? '').toLowerCase();
      return name.includes(q) || email.includes(q) || company.includes(q);
    });
  }, [contacts, search, filter]);

  const selected = useMemo(
    () => contacts.find((c) => contactId(c) === selectedKey) ?? null,
    [contacts, selectedKey]
  );

  const hasAny = contacts.length > 0;

  return (
    <AdminLayout title={adminT.email.title} subtitle={adminT.email.subtitle}>
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-crimson/8 border border-crimson/20 rounded-lg">
          <AlertCircle className="size-4 text-crimson shrink-0" />
          <p className="text-sm text-crimson/80 font-arabic">{adminT.email.errorHint}</p>
        </div>
      )}

      {!isLoading && !hasAny ? (
        <div className="rounded-xl border border-white/6 flex flex-col items-center justify-center text-center gap-3 py-24">
          <Mail className="size-10 text-white/10" />
          <p className="text-white/30 text-sm font-arabic">{adminT.email.empty}</p>
          <p className="text-white/20 text-xs font-arabic max-w-sm">{adminT.email.emptyHint}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: contact list */}
          <div className="w-full lg:w-[300px] shrink-0 rounded-xl border border-white/6 bg-[#0b0b0b] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/5 space-y-2">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-white/20" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={adminT.email.searchPlaceholder}
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg ps-9 pe-3 py-2 text-xs text-white/70 font-arabic focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {FILTER_SOURCES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[10px] font-arabic border transition-colors',
                      filter === s
                        ? 'bg-ember/10 text-ember border-ember/25'
                        : 'bg-white/3 text-white/35 border-white/8 hover:text-white/60'
                    )}
                  >
                    {s === 'all' ? adminT.email.filters.all : adminT.email.source[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[640px]">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 border-b border-white/4 bg-white/2 animate-pulse" />
                ))
              ) : filtered.length === 0 ? (
                <p className="text-xs text-white/20 font-arabic p-6 text-center">{adminT.email.empty}</p>
              ) : (
                filtered.map((c) => (
                  <ContactRow
                    key={contactId(c)}
                    contact={c}
                    selected={selectedKey === contactId(c)}
                    onSelect={() => setSelectedKey(contactId(c))}
                    t={adminT}
                  />
                ))
              )}
            </div>
          </div>

          {/* Middle: details */}
          <DetailPanel contact={selected} t={adminT} />

          {/* Right: reply draft */}
          <ReplyDraftPanel contact={selected} t={adminT} />
        </div>
      )}
    </AdminLayout>
  );
}
