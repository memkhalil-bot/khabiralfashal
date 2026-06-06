import { supabase } from '@/integrations/supabase/client';

export type EntityType = 'report_request' | 'booking_request' | 'advisory_session';

// Transition graph — only allowed next states listed
export const WORKFLOW_TRANSITIONS: Record<EntityType, Record<string, string[]>> = {
  report_request: {
    pending_review: ['draft_ready', 'rejected'],
    draft_ready:    ['approved', 'rejected'],
    approved:       ['scheduled', 'rejected'],
    scheduled:      ['sent'],
    sent:           [],
    rejected:       [],
  },
  booking_request: {
    pending:    ['reviewed', 'cancelled'],
    reviewed:   ['scheduled', 'cancelled'],
    scheduled:  ['completed', 'cancelled', 'no_show'],
    completed:  [],
    cancelled:  [],
    no_show:    [],
  },
  advisory_session: {
    scheduled:     ['reminder_sent', 'held', 'closed'],
    reminder_sent: ['held', 'closed'],
    held:          ['follow_up', 'closed'],
    follow_up:     ['closed'],
    closed:        [],
  },
} as const;

// Arabic labels for each status (shown in badges)
export const WORKFLOW_STATUS_LABELS: Record<EntityType, Record<string, string>> = {
  report_request: {
    pending_review: 'بانتظار المراجعة',
    draft_ready:    'المسودة جاهزة',
    approved:       'موافق عليه',
    scheduled:      'مجدول للإرسال',
    sent:           'تم الإرسال',
    rejected:       'مرفوض',
  },
  booking_request: {
    pending:    'معلق',
    reviewed:   'تمت المراجعة',
    scheduled:  'مجدول',
    completed:  'مكتمل',
    cancelled:  'ملغى',
    no_show:    'لم يحضر',
  },
  advisory_session: {
    scheduled:     'مجدولة',
    reminder_sent: 'أُرسل تذكير',
    held:          'عُقدت',
    follow_up:     'قيد المتابعة',
    closed:        'مغلقة',
  },
};

// Arabic labels for transition ACTION buttons (what doing this transition means)
export const TRANSITION_ACTION_LABELS: Record<string, string> = {
  draft_ready:    'تأكيد جاهزية المسودة',
  approved:       'الموافقة على التقرير',
  scheduled:      'جدولة الإرسال',
  sent:           'تأكيد الإرسال',
  rejected:       'رفض',
  reviewed:       'تمت المراجعة',
  completed:      'تم الإكمال',
  cancelled:      'إلغاء',
  no_show:        'لم يحضر',
  reminder_sent:  'إرسال تذكير',
  held:           'تم عقد الجلسة',
  follow_up:      'إضافة متابعة',
  closed:         'إغلاق',
};

// Tailwind style classes for each status badge
export const WORKFLOW_STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
  draft_ready:    'bg-sky-950/30 text-sky-400 border-sky-800/30',
  approved:       'bg-violet-950/30 text-violet-400 border-violet-800/30',
  scheduled:      'bg-recovery/8 text-recovery border-recovery/20',
  sent:           'bg-white/5 text-white/35 border-white/8',
  rejected:       'bg-crimson/10 text-crimson border-crimson/20',
  pending:        'bg-amber-950/30 text-amber-400 border-amber-800/30',
  reviewed:       'bg-sky-950/30 text-sky-400 border-sky-800/30',
  completed:      'bg-white/5 text-white/35 border-white/8',
  cancelled:      'bg-crimson/10 text-crimson border-crimson/20',
  no_show:        'bg-white/5 text-white/25 border-white/8',
  reminder_sent:  'bg-amber-950/30 text-amber-400 border-amber-800/30',
  held:           'bg-violet-950/30 text-violet-400 border-violet-800/30',
  follow_up:      'bg-sky-950/30 text-sky-400 border-sky-800/30',
  closed:         'bg-white/5 text-white/30 border-white/8',
};

export function canTransition(entityType: EntityType, from: string, to: string): boolean {
  return (WORKFLOW_TRANSITIONS[entityType]?.[from] ?? []).includes(to);
}

export function getNextTransitions(entityType: EntityType, currentStatus: string): string[] {
  return WORKFLOW_TRANSITIONS[entityType]?.[currentStatus] ?? [];
}

// Maps advisory_session workflow_status → legacy status column value
function sessionWorkflowToLegacy(wf: string): string {
  if (wf === 'closed') return 'completed';
  return 'confirmed';
}

const TABLE_MAP: Record<EntityType, string> = {
  report_request:   'report_requests',
  booking_request:  'booking_requests',
  advisory_session: 'advisory_sessions',
};

export interface TransitionParams {
  entityType:         EntityType;
  entityId:           string;
  currentStatus:      string;
  newStatus:          string;
  adminEmail:         string;
  adminUserId:        string | null;
  notes?:             string;
  additionalUpdates?: Record<string, unknown>;
}

export interface TransitionResult {
  success: boolean;
  error?:  string;
}

export async function executeTransition(params: TransitionParams): Promise<TransitionResult> {
  const { entityType, entityId, currentStatus, newStatus, adminEmail, adminUserId, notes, additionalUpdates } = params;

  if (!canTransition(entityType, currentStatus, newStatus)) {
    return {
      success: false,
      error: `انتقال غير مسموح: ${WORKFLOW_STATUS_LABELS[entityType]?.[currentStatus] ?? currentStatus} → ${WORKFLOW_STATUS_LABELS[entityType]?.[newStatus] ?? newStatus}`,
    };
  }

  const table = TABLE_MAP[entityType];
  const now   = new Date().toISOString();

  const payload: Record<string, unknown> = {
    previous_status: currentStatus,
    updated_by:      adminEmail,
    updated_at:      now,
    ...additionalUpdates,
  };

  if (entityType === 'advisory_session') {
    payload.workflow_status = newStatus;
    payload.status          = sessionWorkflowToLegacy(newStatus);
  } else if (entityType === 'report_request') {
    payload.workflow_status = newStatus;
    if (newStatus === 'approved') payload.approved_at = now;
    if (newStatus === 'sent')     payload.sent_at     = now;
  } else {
    payload.status = newStatus;
  }

  const { error: updateErr } = await (supabase as any)
    .from(table)
    .update(payload)
    .eq('id', entityId);

  if (updateErr) return { success: false, error: updateErr.message };

  // workflow_history — fire and forget
  (supabase as any).from('workflow_history').insert({
    entity_type: entityType,
    entity_id:   entityId,
    old_status:  currentStatus,
    new_status:  newStatus,
    changed_by:  adminEmail,
    notes:       notes ?? null,
    created_at:  now,
  }).then(() => {}).catch(() => {});

  // activity_log — fire and forget
  const fromLabel = WORKFLOW_STATUS_LABELS[entityType]?.[currentStatus] ?? currentStatus;
  const toLabel   = WORKFLOW_STATUS_LABELS[entityType]?.[newStatus]     ?? newStatus;
  ;(supabase as any).from('activity_log').insert({
    admin_user_id: adminUserId,
    admin_email:   adminEmail,
    action:        `${entityType}_status_changed`,
    entity_type:   entityType,
    entity_id:     entityId,
    description:   `${fromLabel} → ${toLabel}`,
    metadata:      { old_status: currentStatus, new_status: newStatus, notes: notes ?? null },
    created_at:    now,
  }).then(() => {}).catch(() => {});

  return { success: true };
}
