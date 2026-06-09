import {
  Activity, DollarSign, Package, FileText, CalendarPlus, CalendarClock, Tag, Users, Settings,
  type LucideIcon,
} from 'lucide-react';

// Shared activity_log derivation helpers — used by AdminActivityLog (full page)
// and the AdminDashboard "Recent Activity" widget so both present identical
// categories / icons / labels / links from the same source of truth.
//
// IMPORTANT: this module only *derives display values* from data that is
// already stored (entity_type, action, metadata.new_status). It never
// changes what gets written to activity_log — workflowEngine.ts's
// executeTransition (the existing logger) is untouched.

export interface ActivityRecord {
  id: string;
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type Category =
  | 'system' | 'revenue' | 'fail_kit' | 'reports' | 'bookings'
  | 'sessions' | 'promo_codes' | 'users' | 'settings';

export const CATEGORY_KEYS: Category[] = [
  'system', 'revenue', 'fail_kit', 'reports', 'bookings', 'sessions', 'promo_codes', 'users', 'settings',
];

export const CATEGORY_BY_ENTITY: Record<string, Category> = {
  fail_kit_request:      'fail_kit',
  report_request:        'reports',
  booking_request:       'bookings',
  advisory_session:      'sessions',
  promo_code:            'promo_codes',
  promo_code_redemption: 'revenue',
  user_role:             'users',
  service:               'settings',
};

// Entity links navigate to the relevant list page — there is no existing
// "open exact record by id" infrastructure anywhere in the admin (verified:
// AdminFounders' query-string params only prefill new forms, never select
// existing records). Pointing here keeps the link honest about its target.
export const ENTITY_ROUTES: Record<string, string> = {
  fail_kit_request:      '/admin/fail-kit',
  report_request:        '/admin/report-queue',
  booking_request:       '/admin/bookings',
  advisory_session:      '/admin/sessions',
  promo_code:            '/admin/promo-codes',
  promo_code_redemption: '/admin/promo-codes',
  user_role:             '/admin/team',
  service:               '/admin/services',
};

// Display-only derivation of distinct event labels from the generic
// `<entity>_status_changed` actions that executeTransition already logs.
// Chooses a richer label to *show*, based on the language-neutral
// entity_type + metadata.new_status that are already stored — the stored
// action string / Arabic description are never altered.
const STATUS_DERIVED_ACTIONS: Record<string, Record<string, string>> = {
  fail_kit_request: { approved: 'fail_kit_approved', delivered: 'fail_kit_delivered', closed: 'fail_kit_closed' },
  report_request:   { approved: 'report_approved', scheduled: 'report_scheduled', sent: 'report_delivered', rejected: 'report_rejected' },
  booking_request:  { scheduled: 'session_confirmed', completed: 'session_completed', cancelled: 'session_cancelled' },
};

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  system:      Activity,
  revenue:     DollarSign,
  fail_kit:    Package,
  reports:     FileText,
  bookings:    CalendarPlus,
  sessions:    CalendarClock,
  promo_codes: Tag,
  users:       Users,
  settings:    Settings,
};

export const CATEGORY_ACCENTS: Record<Category, string> = {
  system:      'text-white/50',
  revenue:     'text-recovery',
  fail_kit:    'text-crimson',
  reports:     'text-sky-400',
  bookings:    'text-amber-400',
  sessions:    'text-violet-400',
  promo_codes: 'text-ember',
  users:       'text-blue-400',
  settings:    'text-white/60',
};

export const CRITICAL_ACTION_KEYS = new Set([
  'fail_kit_closed', 'session_cancelled', 'report_rejected', 'promo_code_disabled', 'settings_updated',
]);

export function categoryFor(record: ActivityRecord): Category {
  if (record.entity_type && CATEGORY_BY_ENTITY[record.entity_type]) return CATEGORY_BY_ENTITY[record.entity_type];
  return 'system';
}

export function actionKeyFor(record: ActivityRecord): string {
  if (record.action.endsWith('_status_changed') && record.entity_type) {
    const newStatus = (record.metadata as Record<string, unknown> | null)?.['new_status'] as string | undefined;
    const mapped = newStatus ? STATUS_DERIVED_ACTIONS[record.entity_type]?.[newStatus] : undefined;
    return mapped ?? 'status_changed';
  }
  return record.action;
}

export interface EnrichedActivity {
  record:     ActivityRecord;
  category:   Category;
  actionKey:  string;
  isCritical: boolean;
}

export function enrichActivity(record: ActivityRecord): EnrichedActivity {
  const actionKey = actionKeyFor(record);
  return { record, category: categoryFor(record), actionKey, isCritical: CRITICAL_ACTION_KEYS.has(actionKey) };
}
