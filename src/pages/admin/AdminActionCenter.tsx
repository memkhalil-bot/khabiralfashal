import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, isPast, isToday, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CalendarPlus,
  Inbox,
  CheckCircle2,
  Send,
  Bell,
  Tag,
  CalendarClock,
  ChevronDown,
  AlertTriangle,
  ArrowLeft,
  Zap,
  LayoutDashboard,
  Skull,
  Search,
  PackageCheck,
  Flame,
  Ban,
} from 'lucide-react';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';

// ── Priority system ───────────────────────────────────────────────────────────

type Priority = 'critical' | 'high' | 'normal';

const PRIORITY_STYLES: Record<Priority, { badge: string; bar: string; label: string }> = {
  critical: {
    badge: 'text-crimson bg-crimson/10 border border-crimson/25',
    bar:   'bg-crimson',
    label: 'عاجل جداً',
  },
  high: {
    badge: 'text-amber-400 bg-amber-950/25 border border-amber-800/30',
    bar:   'bg-amber-400',
    label: 'عالي',
  },
  normal: {
    badge: 'text-white/40 bg-white/5 border border-white/8',
    bar:   'bg-white/20',
    label: 'عادي',
  },
};

function maxPriority(items: { priority: Priority }[]): Priority {
  if (items.some((i) => i.priority === 'critical')) return 'critical';
  if (items.some((i) => i.priority === 'high')) return 'high';
  return 'normal';
}

// ── Risk level badge ──────────────────────────────────────────────────────────

const RISK_STYLES: Record<string, string> = {
  'COLLAPSE PROXIMITY': 'text-crimson bg-crimson/10 border-crimson/25',
  'INSIDE THE VALLEY':  'text-orange-400 bg-orange-950/25 border-orange-800/30',
  EXPOSED:              'text-yellow-400 bg-yellow-950/25 border-yellow-800/30',
  STABLE:               'text-recovery bg-recovery/10 border-recovery/25',
};

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const style = RISK_STYLES[level] ?? 'text-white/40 bg-white/5 border-white/10';
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border font-arabic ${style}`}>
      {level}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium font-arabic ${s.badge}`}>
      {s.label}
    </span>
  );
}

// ── Fail Kit meta badges (severity / urgency / category) ─────────────────────

const FAIL_KIT_SEVERITY_STYLES: Record<string, string> = {
  Low:      'text-white/40 bg-white/5 border-white/10',
  Medium:   'text-amber-400 bg-amber-950/25 border-amber-800/30',
  High:     'text-orange-400 bg-orange-950/25 border-orange-800/30',
  Critical: 'text-crimson bg-crimson/10 border-crimson/25',
};

const FAIL_KIT_URGENCY_STYLES: Record<string, string> = {
  Green:  'text-emerald-400 bg-emerald-950/25 border-emerald-800/30',
  Yellow: 'text-amber-400 bg-amber-950/25 border-amber-800/30',
  Red:    'text-crimson bg-crimson/10 border-crimson/25',
  Black:  'text-white/70 bg-white/10 border-white/20',
};

function FailKitMetaBadges({ item }: { item: { failure_category: string | null; severity: string | null; urgency_level: string | null; risk_score: number | null } }) {
  const { t: adminT } = useAdminLanguage();
  return (
    <>
      {item.failure_category && (
        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium font-arabic text-white/40 bg-white/5 border border-white/10">
          {adminT.failKit.category[item.failure_category] ?? item.failure_category}
        </span>
      )}
      {item.severity && (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium font-arabic border ${FAIL_KIT_SEVERITY_STYLES[item.severity] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
          {adminT.failKit.severity[item.severity] ?? item.severity}
        </span>
      )}
      {item.urgency_level && (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium font-arabic border ${FAIL_KIT_URGENCY_STYLES[item.urgency_level] ?? 'text-white/40 bg-white/5 border-white/10'}`}>
          {adminT.failKit.urgency[item.urgency_level] ?? item.urgency_level}
        </span>
      )}
      {item.risk_score != null && (
        <span className="text-[10px] text-white/30 tabular-nums">{item.risk_score}/100</span>
      )}
    </>
  );
}

// ── ActionItemCard ────────────────────────────────────────────────────────────

interface ActionItemCardProps {
  priority: Priority;
  actionLabel: string;
  actionTo: string;
  children: React.ReactNode;
}

function ActionItemCard({ priority, actionLabel, actionTo, children }: ActionItemCardProps) {
  const barColor = PRIORITY_STYLES[priority].bar;
  return (
    <div className="flex items-stretch gap-0 bg-[#161d27] border border-white/6 rounded-lg overflow-hidden">
      {/* Priority stripe */}
      <div className={`w-[3px] shrink-0 ${barColor}`} />
      {/* Content */}
      <div className="flex-1 flex items-center justify-between gap-3 p-4 min-w-0">
        <div className="flex-1 min-w-0">{children}</div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <PriorityBadge priority={priority} />
          <Link
            to={actionTo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-medium font-arabic bg-white/6 text-white/60 hover:bg-ember/15 hover:text-ember border border-white/8 hover:border-ember/25 transition-all duration-200 whitespace-nowrap"
          >
            {actionLabel}
            <ArrowLeft className="size-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── ActionSection ─────────────────────────────────────────────────────────────

interface ActionSectionProps<T extends { priority: Priority }> {
  title: string;
  icon: React.ElementType;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyText?: string;
  defaultOpen?: boolean;
}

function ActionSection<T extends { priority: Priority }>({
  title,
  icon: Icon,
  items,
  renderItem,
  emptyText = 'لا يوجد إجراء مطلوب',
  defaultOpen,
}: ActionSectionProps<T>) {
  const count = items.length;
  const top = count > 0 ? maxPriority(items) : 'normal';
  const [open, setOpen] = useState(defaultOpen ?? count > 0);

  const countBadgeStyle =
    count === 0
      ? 'bg-white/5 text-white/25 border-white/6'
      : top === 'critical'
      ? 'bg-crimson/15 text-crimson border-crimson/25'
      : top === 'high'
      ? 'bg-amber-950/30 text-amber-400 border-amber-800/30'
      : 'bg-white/8 text-white/50 border-white/10';

  return (
    <div className="bg-[#0f141c] border border-white/5 rounded-xl mb-4 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Icon
            className={cn(
              'size-4 shrink-0 transition-colors',
              count > 0
                ? top === 'critical'
                  ? 'text-crimson'
                  : top === 'high'
                  ? 'text-amber-400'
                  : 'text-white/40'
                : 'text-white/20'
            )}
          />
          <h2 className="text-[12px] font-medium text-white/70 font-arabic">{title}</h2>
          <span
            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-[9px] font-semibold border font-arabic ${countBadgeStyle}`}
          >
            {count}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-white/25 transition-transform duration-200',
            open ? 'rotate-180' : ''
          )}
        />
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0.5">
              {count === 0 ? (
                <p className="text-[11px] text-recovery/60 font-arabic py-4 text-center">
                  ✓ لا يوجد {emptyText}
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.2 }}
                    >
                      {renderItem(item)}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Data types ────────────────────────────────────────────────────────────────

interface BookingItem {
  id: string;
  full_name: string | null;
  email: string | null;
  session_type: string | null;
  created_at: string;
  priority: Priority;
}

interface ReportReviewItem {
  id: string;
  full_name: string | null;
  company: string | null;
  risk_level: string | null;
  created_at: string;
  priority: Priority;
}

interface ReportApprovalItem {
  id: string;
  full_name: string | null;
  company: string | null;
  created_at: string;
  priority: Priority;
}

interface ReportScheduledItem {
  id: string;
  full_name: string | null;
  company: string | null;
  scheduled_for: string | null;
  overdue: boolean;
  priority: Priority;
}

interface FollowUpItem {
  id: string;
  title: string | null;
  founder_name: string | null;
  due_date: string | null;
  followup_priority: string | null;
  priority: Priority;
}

interface PromoItem {
  id: string;
  code: string;
  title: string | null;
  ends_at: string | null;
  daysRemaining: number;
  priority: Priority;
}

interface SessionItem {
  id: string;
  founder_name: string | null;
  company: string | null;
  session_type: string | null;
  created_at: string;
  priority: Priority;
}

interface HighRiskLeadItem {
  id: string;
  name: string | null;
  company: string | null;
  risk_level: string | null;
  risk_score: number | null;
  created_at: string;
  priority: Priority;
}

interface FailKitItem {
  id:               string;
  request_number:   string | null;
  full_name:        string | null;
  email:            string | null;
  failure_category: string | null;
  severity:         string | null;
  urgency_level:    string | null;
  risk_score:       number | null;
  status:           string;
  created_at:       string;
  priority:         Priority;
}

interface ActionData {
  bookings:             BookingItem[];
  reportsReview:        ReportReviewItem[];
  reportsApproval:      ReportApprovalItem[];
  reportsScheduled:     ReportScheduledItem[];
  followUpsToday:       FollowUpItem[];
  expiringPromos:       PromoItem[];
  awaitingSessions:     SessionItem[];
  highRiskLeads:        HighRiskLeadItem[];
  failKitAwaitingReview:   FailKitItem[];
  failKitAwaitingDelivery: FailKitItem[];
  failKitCritical:         FailKitItem[];
  failKitBlackUrgency:     FailKitItem[];
}

// ── Unified query ─────────────────────────────────────────────────────────────

function useActionItems() {
  return useQuery<ActionData>({
    queryKey: ['admin', 'action-center'],
    queryFn: async () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const in7Days = addDays(now, 7).toISOString();
      const in1Day  = addDays(now, 1).toISOString();

      const [
        bookingsRes,
        reportsReviewRes,
        reportsApprovalRes,
        reportsScheduledRes,
        followUpsRes,
        promosRes,
        sessionsRes,
        highRiskLeadsRes,
        failKitAwaitingReviewRes,
        failKitAwaitingDeliveryRes,
        failKitCriticalRes,
        failKitBlackUrgencyRes,
      ] = await Promise.all([
        // A) Pending booking requests
        (supabase as any)
          .from('booking_requests')
          .select('id, full_name, email, session_type, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),

        // B) Reports pending review
        (supabase as any)
          .from('report_requests')
          .select('id, full_name, company, risk_level, created_at')
          .eq('workflow_status', 'pending_review')
          .order('created_at', { ascending: true }),

        // C) Reports draft ready
        (supabase as any)
          .from('report_requests')
          .select('id, full_name, company, created_at')
          .eq('workflow_status', 'draft_ready')
          .order('created_at', { ascending: true }),

        // D) Reports scheduled but not sent
        (supabase as any)
          .from('report_requests')
          .select('id, full_name, company, scheduled_for')
          .eq('workflow_status', 'scheduled')
          .is('sent_at', null)
          .order('scheduled_for', { ascending: true }),

        // E) Follow-ups due today or overdue
        (supabase as any)
          .from('follow_ups')
          .select('id, title, founder_name, due_date, priority')
          .eq('status', 'pending')
          .lte('due_date', todayStr)
          .order('priority', { ascending: true })
          .order('due_date',  { ascending: true }),

        // F) Promo codes expiring within 7 days
        (supabase as any)
          .from('promo_codes')
          .select('id, code, title, ends_at, used_count, max_uses')
          .eq('active', true)
          .lte('ends_at', in7Days)
          .gt('ends_at', now.toISOString())
          .order('ends_at', { ascending: true }),

        // G) Advisory sessions awaiting confirmation
        (supabase as any)
          .from('advisory_sessions')
          .select('id, founder_name, company, session_type, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),

        // H) High-risk leads (recent assessments at high risk levels)
        supabase
          .from('founder_assessments')
          .select('id, name, company, risk_level, risk_score, created_at')
          .in('risk_level', ['COLLAPSE PROXIMITY', 'INSIDE THE VALLEY'])
          .order('created_at', { ascending: false })
          .limit(8),

        // I) Fail Kits awaiting review
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, request_number, full_name, email, failure_category, severity, urgency_level, risk_score, status, created_at')
          .in('status', ['requested', 'under_review'])
          .order('created_at', { ascending: true }),

        // J) Fail Kits awaiting delivery
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, request_number, full_name, email, failure_category, severity, urgency_level, risk_score, status, created_at')
          .in('status', ['approved', 'scheduled'])
          .order('created_at', { ascending: true }),

        // K) Critical-severity Fail Kits (still open)
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, request_number, full_name, email, failure_category, severity, urgency_level, risk_score, status, created_at')
          .eq('severity', 'Critical')
          .not('status', 'in', '(closed,delivered)')
          .order('created_at', { ascending: false }),

        // L) Black-urgency Fail Kit cases (still open)
        (supabase as any)
          .from('fail_kit_requests')
          .select('id, request_number, full_name, email, failure_category, severity, urgency_level, risk_score, status, created_at')
          .eq('urgency_level', 'Black')
          .not('status', 'in', '(closed,delivered)')
          .order('created_at', { ascending: false }),
      ]);

      // A) Bookings — critical if > 48 h old
      const bookings: BookingItem[] = ((bookingsRes.data ?? []) as any[]).map((r) => {
        const ageHours = (now.getTime() - new Date(r.created_at).getTime()) / 3_600_000;
        return { ...r, priority: ageHours > 48 ? 'critical' : 'high' };
      });

      // B) Reports review — critical if high-risk level
      const CRITICAL_RISK = ['COLLAPSE PROXIMITY', 'INSIDE THE VALLEY'];
      const reportsReview: ReportReviewItem[] = ((reportsReviewRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: CRITICAL_RISK.includes(r.risk_level ?? '') ? 'critical' : 'high',
      }));

      // C) Reports approval — high always
      const reportsApproval: ReportApprovalItem[] = ((reportsApprovalRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: 'high' as Priority,
      }));

      // D) Reports scheduled — critical if overdue
      const reportsScheduled: ReportScheduledItem[] = ((reportsScheduledRes.data ?? []) as any[]).map((r) => {
        const overdue = r.scheduled_for ? isPast(new Date(r.scheduled_for)) : false;
        return { ...r, overdue, priority: overdue ? 'critical' : 'normal' };
      });

      // E) Follow-ups — map DB priority to internal priority
      const priorityMap: Record<string, Priority> = {
        urgent: 'critical',
        high:   'high',
        medium: 'normal',
        low:    'normal',
      };
      const followUpsToday: FollowUpItem[] = ((followUpsRes.data ?? []) as any[]).map((r) => ({
        id:                r.id,
        title:             r.title,
        founder_name:      r.founder_name,
        due_date:          r.due_date,
        followup_priority: r.priority,
        priority:          priorityMap[r.priority ?? ''] ?? 'normal',
      }));

      // F) Promo codes — critical if < 1 day remaining
      const expiringPromos: PromoItem[] = ((promosRes.data ?? []) as any[]).map((r) => {
        const daysRemaining = differenceInDays(new Date(r.ends_at), now);
        const critical = r.ends_at < in1Day;
        return {
          id: r.id,
          code: r.code,
          title: r.title,
          ends_at: r.ends_at,
          daysRemaining,
          priority: critical ? 'critical' : 'normal',
        };
      });

      // G) Sessions — high always
      const awaitingSessions: SessionItem[] = ((sessionsRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: 'high' as Priority,
      }));

      // H) High-risk leads — critical if at collapse proximity, otherwise high
      const highRiskLeads: HighRiskLeadItem[] = ((highRiskLeadsRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: r.risk_level === 'COLLAPSE PROXIMITY' ? 'critical' : 'high',
      }));

      // I) Fail Kits awaiting review — critical if Black/Red urgency, otherwise high
      const failKitAwaitingReview: FailKitItem[] = ((failKitAwaitingReviewRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: ['Black', 'Red'].includes(r.urgency_level ?? '') ? 'critical' : 'high',
      }));

      // J) Fail Kits awaiting delivery — high always
      const failKitAwaitingDelivery: FailKitItem[] = ((failKitAwaitingDeliveryRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: 'high' as Priority,
      }));

      // K) Critical-severity Fail Kits — critical always
      const failKitCritical: FailKitItem[] = ((failKitCriticalRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: 'critical' as Priority,
      }));

      // L) Black-urgency Fail Kit cases — critical always
      const failKitBlackUrgency: FailKitItem[] = ((failKitBlackUrgencyRes.data ?? []) as any[]).map((r) => ({
        ...r,
        priority: 'critical' as Priority,
      }));

      return {
        bookings,
        reportsReview,
        reportsApproval,
        reportsScheduled,
        followUpsToday,
        expiringPromos,
        awaitingSessions,
        highRiskLeads,
        failKitAwaitingReview,
        failKitAwaitingDelivery,
        failKitCritical,
        failKitBlackUrgency,
      };
    },
    staleTime: 60_000,
  });
}

// ── Session-type label ────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<string, string> = {
  initial:   'جلسة أولية',
  followup:  'متابعة',
  intensive: 'مكثفة',
  emergency: 'طارئة',
};

function sessionLabel(type: string | null) {
  return type ? (SESSION_TYPE_LABELS[type] ?? type) : '—';
}

// ── Relative time helper ──────────────────────────────────────────────────────

function relAge(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// ── Overview chip ─────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  count: number;
  accent: string;
}

function OverviewChip({ label, count, accent }: ChipProps) {
  const active = count > 0;
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-colors min-w-[90px]',
        active
          ? `${accent} border-current/20 bg-current/5`
          : 'text-white/25 border-white/6 bg-white/2'
      )}
    >
      <span className={cn('text-xl font-serif-display tabular-nums leading-none', active ? '' : 'text-white/20')}>
        {count}
      </span>
      <span className="text-[9px] font-arabic leading-tight text-center max-w-[80px] opacity-75">
        {label}
      </span>
    </div>
  );
}

// ── Quick links strip ─────────────────────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'مركز الإجراءات', to: '/admin/action-center', icon: Zap,           current: true  },
  { label: 'طابور التقارير',  to: '/admin/report-queue',  icon: Inbox,         current: false },
  { label: 'الحجوزات',        to: '/admin/bookings',       icon: CalendarPlus,  current: false },
  { label: 'الجلسات',         to: '/admin/sessions',       icon: CalendarClock, current: false },
];

function QuickLinksStrip() {
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      <span className="text-[10px] text-white/30 font-arabic tracking-wide shrink-0">انتقل إلى:</span>
      {QUICK_LINKS.map((l) => {
        const Icon = l.icon;
        return (
          <Link
            key={l.to}
            to={l.to}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-arabic border transition-all duration-150',
              l.current
                ? 'bg-ember/12 text-ember border-ember/25 font-medium'
                : 'bg-white/4 text-white/45 border-white/8 hover:bg-white/8 hover:text-white/70 hover:border-white/15'
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="bg-[#0f141c] border border-white/5 rounded-xl mb-4 p-5 space-y-3">
      <div className="h-4 w-48 bg-white/6 rounded animate-pulse" />
      <div className="h-16 bg-white/4 rounded-lg animate-pulse" />
      <div className="h-16 bg-white/4 rounded-lg animate-pulse" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminActionCenter() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading, error } = useActionItems();

  const counts = {
    pendingBookings:  data?.bookings.length          ?? 0,
    pendingReview:    data?.reportsReview.length      ?? 0,
    draftReady:       data?.reportsApproval.length    ?? 0,
    scheduledReports: data?.reportsScheduled.length   ?? 0,
    followUpsToday:   data?.followUpsToday.length     ?? 0,
    expiringPromos:   data?.expiringPromos.length     ?? 0,
    awaitingSessions: data?.awaitingSessions.length   ?? 0,
    highRiskLeads:    data?.highRiskLeads.length      ?? 0,
    failKitAwaitingReview:   data?.failKitAwaitingReview.length   ?? 0,
    failKitAwaitingDelivery: data?.failKitAwaitingDelivery.length ?? 0,
    failKitCritical:         data?.failKitCritical.length         ?? 0,
    failKitBlackUrgency:     data?.failKitBlackUrgency.length     ?? 0,
  };

  const totalActions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout
      title={adminT.actionCenter.title}
      subtitle={adminT.actionCenter.subtitle}
    >
      {/* Error */}
      {error && (
        <div className="mb-5 p-4 bg-crimson/10 border border-crimson/25 rounded-lg text-crimson text-[12px] font-arabic">
          حدث خطأ أثناء تحميل البيانات. تأكد من الاتصال وإعادة المحاولة.
        </div>
      )}

      {/* Quick links */}
      <QuickLinksStrip />

      {/* Overview bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6 p-4 bg-[#0f141c] border border-white/5 rounded-xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-3.5 text-white/30" />
            <p className="text-[9px] tracking-[0.2em] uppercase text-white/25 font-arabic">
              نظرة عامة
            </p>
          </div>
          {isLoading ? (
            <span className="text-[10px] text-white/20 font-arabic animate-pulse">جاري التحميل…</span>
          ) : (
            <span
              className={cn(
                'text-[10px] font-arabic font-medium',
                totalActions > 0 ? 'text-ember' : 'text-recovery/60'
              )}
            >
              {totalActions > 0 ? `${totalActions} إجراء مطلوب` : 'لا توجد إجراءات معلقة ✓'}
            </span>
          )}
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          {isLoading ? (
            [...Array(12)].map((_, i) => (
              <div key={i} className="w-[90px] h-[62px] bg-white/4 rounded-xl animate-pulse" />
            ))
          ) : (
            <>
              <OverviewChip label="طلبات الحجز الجديدة"   count={counts.pendingBookings}  accent="text-amber-400" />
              <OverviewChip label="تقارير للمراجعة"        count={counts.pendingReview}    accent="text-violet-400" />
              <OverviewChip label="جاهزة للموافقة"         count={counts.draftReady}       accent="text-sky-400" />
              <OverviewChip label="مجدولة للإرسال"         count={counts.scheduledReports} accent="text-recovery" />
              <OverviewChip label="متابعات اليوم"          count={counts.followUpsToday}   accent="text-ember" />
              <OverviewChip label="أكواد منتهية قريباً"    count={counts.expiringPromos}   accent="text-orange-400" />
              <OverviewChip label="جلسات بانتظار التأكيد"  count={counts.awaitingSessions} accent="text-sky-300" />
              <OverviewChip label="مؤسسون عالي المخاطر"    count={counts.highRiskLeads}    accent="text-crimson" />
              <OverviewChip label="حقائب فشل بانتظار المراجعة" count={counts.failKitAwaitingReview}   accent="text-amber-400" />
              <OverviewChip label="حقائب فشل بانتظار التسليم"  count={counts.failKitAwaitingDelivery} accent="text-recovery" />
              <OverviewChip label="حقائب فشل حرجة"            count={counts.failKitCritical}         accent="text-crimson" />
              <OverviewChip label="حالات خطورة سوداء"         count={counts.failKitBlackUrgency}     accent="text-white/70" />
            </>
          )}
        </div>
      </motion.div>

      {/* Sections */}
      {isLoading ? (
        <>
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >

          {/* A) New Booking Requests */}
          <ActionSection
            title="طلبات الحجز الجديدة"
            icon={CalendarPlus}
            items={data?.bookings ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="عرض الطلب"
                actionTo="/admin/bookings"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'}
                </p>
                <p className="text-[11px] text-white/40 font-arabic mt-0.5">
                  {item.email ?? ''}
                  {item.session_type ? ` · ${sessionLabel(item.session_type)}` : ''}
                </p>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* B) Reports Waiting Review */}
          <ActionSection
            title="تقارير بانتظار المراجعة"
            icon={Inbox}
            items={data?.reportsReview ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="مراجعة التقرير"
                actionTo="/admin/report-queue"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.company && (
                    <span className="text-[11px] text-white/40 font-arabic">{item.company}</span>
                  )}
                  <RiskBadge level={item.risk_level} />
                </div>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* C) Reports Ready For Approval */}
          <ActionSection
            title="تقارير جاهزة للموافقة"
            icon={CheckCircle2}
            items={data?.reportsApproval ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="الموافقة على التقرير"
                actionTo="/admin/report-queue"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'}
                </p>
                {item.company && (
                  <p className="text-[11px] text-white/40 font-arabic mt-0.5">{item.company}</p>
                )}
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* D) Reports Scheduled But Not Sent */}
          <ActionSection
            title="تقارير مجدولة لم تُرسل"
            icon={Send}
            items={data?.reportsScheduled ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="تأكيد الإرسال"
                actionTo="/admin/report-queue"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'}
                </p>
                {item.company && (
                  <p className="text-[11px] text-white/40 font-arabic mt-0.5">{item.company}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {item.scheduled_for && (
                    <p className={cn('text-[10px]', item.overdue ? 'text-crimson' : 'text-white/30')}>
                      {format(new Date(item.scheduled_for), 'yyyy/MM/dd')}
                    </p>
                  )}
                  {item.overdue && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] text-crimson font-arabic">
                      <AlertTriangle className="size-2.5" />
                      متأخر
                    </span>
                  )}
                </div>
              </ActionItemCard>
            )}
          />

          {/* E) Follow-Ups Due Today */}
          <ActionSection
            title="متابعات مستحقة اليوم"
            icon={Bell}
            items={data?.followUpsToday ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="عرض المتابعة"
                actionTo="/admin/follow-ups"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.title ?? '—'}
                </p>
                {item.founder_name && (
                  <p className="text-[11px] text-white/40 font-arabic mt-0.5">{item.founder_name}</p>
                )}
                {item.due_date && (
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      isToday(new Date(item.due_date))
                        ? 'text-ember'
                        : isPast(new Date(item.due_date))
                        ? 'text-crimson'
                        : 'text-white/30'
                    )}
                  >
                    {isToday(new Date(item.due_date)) ? 'اليوم' : format(new Date(item.due_date), 'yyyy/MM/dd')}
                  </p>
                )}
              </ActionItemCard>
            )}
          />

          {/* F) Promo Codes Near Expiration */}
          <ActionSection
            title="أكواد خصم تنتهي قريباً"
            icon={Tag}
            items={data?.expiringPromos ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="إدارة الكود"
                actionTo="/admin/promo-codes"
              >
                <div className="flex items-center gap-2">
                  <code className="text-[12px] text-ember font-mono bg-ember/10 border border-ember/20 px-1.5 py-0.5 rounded">
                    {item.code}
                  </code>
                  {item.title && (
                    <span className="text-[11px] text-white/50 font-arabic">{item.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {item.ends_at && (
                    <p className="text-[10px] text-white/30">
                      ينتهي: {format(new Date(item.ends_at), 'yyyy/MM/dd HH:mm')}
                    </p>
                  )}
                  <span
                    className={cn(
                      'text-[9px] font-arabic px-1.5 py-0.5 rounded border',
                      item.daysRemaining < 1
                        ? 'text-crimson bg-crimson/10 border-crimson/25'
                        : 'text-amber-400 bg-amber-950/20 border-amber-800/25'
                    )}
                  >
                    {item.daysRemaining < 1
                      ? 'ينتهي خلال ساعات'
                      : `${item.daysRemaining} أيام متبقية`}
                  </span>
                </div>
              </ActionItemCard>
            )}
          />

          {/* G) Sessions Awaiting Confirmation */}
          <ActionSection
            title="جلسات بانتظار التأكيد"
            icon={CalendarClock}
            items={data?.awaitingSessions ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="تأكيد الجلسة"
                actionTo="/admin/sessions"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.founder_name ?? '—'}
                </p>
                <p className="text-[11px] text-white/40 font-arabic mt-0.5">
                  {item.company ?? ''}
                  {item.session_type ? ` · ${sessionLabel(item.session_type)}` : ''}
                </p>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* H) High-Risk Leads */}
          <ActionSection
            title="مؤسسون عالي المخاطر"
            icon={Skull}
            items={data?.highRiskLeads ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="عرض الملف"
                actionTo="/admin/founders"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.name ?? '—'}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {item.company && (
                    <span className="text-[11px] text-white/40 font-arabic">{item.company}</span>
                  )}
                  <RiskBadge level={item.risk_level} />
                  {item.risk_score != null && (
                    <span className="text-[10px] text-white/30 tabular-nums">{item.risk_score}/100</span>
                  )}
                </div>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* I) Fail Kits awaiting review */}
          <ActionSection
            title="حقائب فشل بانتظار المراجعة"
            icon={Search}
            items={data?.failKitAwaitingReview ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="فتح الطلب"
                actionTo="/admin/fail-kit"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'} {item.request_number ? `· ${item.request_number}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <FailKitMetaBadges item={item} />
                </div>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* J) Fail Kits awaiting delivery */}
          <ActionSection
            title="حقائب فشل بانتظار التسليم"
            icon={PackageCheck}
            items={data?.failKitAwaitingDelivery ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="فتح الطلب"
                actionTo="/admin/fail-kit"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'} {item.request_number ? `· ${item.request_number}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <FailKitMetaBadges item={item} />
                </div>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* K) Critical Fail Kits */}
          <ActionSection
            title="حقائب فشل حرجة"
            icon={Flame}
            items={data?.failKitCritical ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="فتح الطلب"
                actionTo="/admin/fail-kit"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'} {item.request_number ? `· ${item.request_number}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <FailKitMetaBadges item={item} />
                </div>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

          {/* L) Black Urgency Cases */}
          <ActionSection
            title="حالات خطورة سوداء"
            icon={Ban}
            items={data?.failKitBlackUrgency ?? []}
            renderItem={(item) => (
              <ActionItemCard
                key={item.id}
                priority={item.priority}
                actionLabel="فتح الطلب"
                actionTo="/admin/fail-kit"
              >
                <p className="text-[13px] text-white/85 font-arabic leading-snug">
                  {item.full_name ?? '—'} {item.request_number ? `· ${item.request_number}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <FailKitMetaBadges item={item} />
                </div>
                <p className="text-[10px] text-white/25 mt-1">{relAge(item.created_at)}</p>
              </ActionItemCard>
            )}
          />

        </motion.div>
      )}
    </AdminLayout>
  );
}
