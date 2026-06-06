import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EntityType,
  getNextTransitions,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_STYLES,
  TRANSITION_ACTION_LABELS,
} from '@/lib/workflowEngine';
import { useWorkflowTransition } from '@/hooks/useWorkflowTransition';

interface ExtraField {
  name:      string;
  label:     string;
  type:      'datetime-local' | 'text' | 'date';
  required?: boolean;
}

interface WorkflowStatusManagerProps {
  entityType:        EntityType;
  entityId:          string;
  currentStatus:     string;
  entityName?:       string;
  invalidateKeys?:   string[][];
  onSuccess?:        () => void;
  transitionFields?: Record<string, ExtraField[]>;
}

const DANGER_STATES  = new Set(['cancelled', 'rejected', 'no_show']);
const RECOVERY_STATES = new Set(['sent', 'completed', 'closed']);

function getButtonClass(state: string): string {
  if (DANGER_STATES.has(state)) {
    return 'bg-crimson/8 text-crimson border-crimson/20 hover:bg-crimson/15';
  }
  if (RECOVERY_STATES.has(state)) {
    return 'bg-recovery/8 text-recovery border-recovery/20 hover:bg-recovery/12';
  }
  return 'bg-white/6 text-white/60 border-white/8 hover:bg-white/10 hover:text-white/80';
}

export function WorkflowStatusManager({
  entityType,
  entityId,
  currentStatus,
  entityName,
  invalidateKeys,
  onSuccess,
  transitionFields,
}: WorkflowStatusManagerProps) {
  const [pendingTransition, setPendingTransition] = useState<string | null>(null);
  const [notes, setNotes]                         = useState('');
  const [extraValues, setExtraValues]             = useState<Record<string, string>>({});
  const [mutationError, setMutationError]         = useState<string | null>(null);

  const transition = useWorkflowTransition(entityType, invalidateKeys);

  const nextStates   = getNextTransitions(entityType, currentStatus);
  const statusLabel  = WORKFLOW_STATUS_LABELS[entityType]?.[currentStatus] ?? currentStatus;
  const statusStyles = WORKFLOW_STATUS_STYLES[currentStatus] ?? 'bg-white/5 text-white/40 border-white/8';

  function handleSelectTransition(state: string) {
    setPendingTransition(state);
    setNotes('');
    setExtraValues({});
    setMutationError(null);
  }

  function handleCancel() {
    setPendingTransition(null);
    setNotes('');
    setExtraValues({});
    setMutationError(null);
  }

  function handleConfirm() {
    if (!pendingTransition) return;

    const fields = transitionFields?.[pendingTransition] ?? [];
    const additionalUpdates: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.required && !extraValues[field.name]) {
        setMutationError(`الحقل "${field.label}" مطلوب`);
        return;
      }
      if (extraValues[field.name]) {
        additionalUpdates[field.name] = extraValues[field.name];
      }
    }

    setMutationError(null);
    transition.mutate(
      {
        entityId,
        currentStatus,
        newStatus:         pendingTransition,
        notes:             notes.trim() || undefined,
        additionalUpdates: Object.keys(additionalUpdates).length ? additionalUpdates : undefined,
      },
      {
        onSuccess: () => {
          setPendingTransition(null);
          setNotes('');
          setExtraValues({});
          onSuccess?.();
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
          setMutationError(msg);
        },
      }
    );
  }

  const confirmLabel = pendingTransition
    ? (TRANSITION_ACTION_LABELS[pendingTransition] ?? pendingTransition)
    : '';

  const extraFields = pendingTransition ? (transitionFields?.[pendingTransition] ?? []) : [];

  return (
    <div className="space-y-3" dir="rtl">
      {/* Current status */}
      <div>
        {entityName && (
          <p className="text-[9px] uppercase tracking-wider text-white/25 mb-1.5 font-arabic">
            {entityName}
          </p>
        )}
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-md border text-sm font-medium font-arabic',
            statusStyles
          )}
        >
          {statusLabel}
        </span>
      </div>

      {/* Action buttons or empty state */}
      {nextStates.length === 0 ? (
        <div className="flex items-center gap-1.5 text-white/25">
          <Lock className="size-3 shrink-0" />
          <span className="text-[11px] font-arabic">لا توجد إجراءات متاحة</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mt-3">
          {nextStates.map((state) => (
            <button
              key={state}
              onClick={() => handleSelectTransition(state)}
              disabled={transition.isPending}
              className={cn(
                'px-3 py-2 text-[12px] font-arabic border rounded-lg transition-all disabled:opacity-40',
                getButtonClass(state),
                pendingTransition === state && 'ring-1 ring-white/20'
              )}
            >
              {TRANSITION_ACTION_LABELS[state] ?? state}
            </button>
          ))}
        </div>
      )}

      {/* Confirm panel */}
      {pendingTransition && (
        <div className="mt-3 p-4 bg-[#0f141c] border border-white/10 rounded-xl space-y-3 animate-in slide-in-from-top-2">
          <p className="text-[12px] font-arabic text-white/60 font-medium">{confirmLabel}</p>

          {/* Extra fields */}
          {extraFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label className="text-[10px] text-white/35 font-arabic block">
                {field.label}
                {field.required && <span className="text-crimson mr-0.5">*</span>}
              </label>
              <input
                type={field.type}
                value={extraValues[field.name] ?? ''}
                onChange={(e) =>
                  setExtraValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                }
                required={field.required}
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-white/25"
              />
            </div>
          ))}

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات (اختياري)"
            rows={2}
            className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 font-arabic placeholder-white/20 focus:outline-none focus:border-white/25 resize-none"
          />

          {/* Error */}
          {mutationError && (
            <p className="text-[11px] text-crimson font-arabic mt-1">{mutationError}</p>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleConfirm}
              disabled={transition.isPending}
              className="py-2 px-4 bg-recovery/10 text-recovery border border-recovery/20 rounded-lg text-[12px] font-arabic hover:bg-recovery/15 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {transition.isPending && (
                <Loader2 className="size-3 animate-spin shrink-0" />
              )}
              تأكيد
            </button>
            <button
              onClick={handleCancel}
              disabled={transition.isPending}
              className="py-2 px-4 bg-white/5 text-white/40 border border-white/8 rounded-lg text-[12px] font-arabic hover:bg-white/10 transition-all disabled:opacity-40"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
