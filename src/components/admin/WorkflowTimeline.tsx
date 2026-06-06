import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  EntityType,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_STATUS_STYLES,
} from '@/lib/workflowEngine';

interface WorkflowHistoryEntry {
  id:          string;
  entity_type: string;
  entity_id:   string;
  old_status:  string | null;
  new_status:  string;
  changed_by:  string | null;
  notes:       string | null;
  created_at:  string;
}

interface WorkflowTimelineProps {
  entityType: EntityType;
  entityId:   string;
  createdAt?: string;
}

/** Extract the text-* colour class from a WORKFLOW_STATUS_STYLES value */
function extractTextColor(styleStr: string): string {
  const match = styleStr.match(/\btext-[\w/[\].]+/);
  return match ? match[0] : 'text-white/40';
}

function StatusBadge({ entityType, status }: { entityType: EntityType; status: string }) {
  const label  = WORKFLOW_STATUS_LABELS[entityType]?.[status] ?? status;
  const styles = WORKFLOW_STATUS_STYLES[status] ?? 'bg-white/5 text-white/40 border-white/8';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-arabic font-medium',
        styles
      )}
    >
      {label}
    </span>
  );
}

export function WorkflowTimeline({ entityType, entityId, createdAt }: WorkflowTimelineProps) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['workflow-history', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('workflow_history')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as WorkflowHistoryEntry[];
    },
    staleTime: 10_000,
  });

  // Reverse so latest is at top
  const reversed = entries ? [...entries].reverse() : [];

  return (
    <div className="mt-4 space-y-1" dir="rtl">
      <p className="text-[9px] uppercase tracking-wider text-white/25 flex items-center gap-1.5 mb-3">
        <Clock className="size-3" />
        سجل الحالات
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="size-2 rounded-full bg-white/4 animate-pulse mt-1 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-white/4 rounded animate-pulse" />
                <div className="h-2.5 w-32 bg-white/4 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : reversed.length === 0 && !createdAt ? (
        <p className="text-[11px] text-white/25 font-arabic">لا يوجد سجل حتى الآن</p>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          {(reversed.length > 0 || createdAt) && (
            <div className="absolute top-2 right-[3px] bottom-2 w-px bg-white/6" />
          )}

          <div className="space-y-4">
            {reversed.map((entry, idx) => {
              const dotColor = extractTextColor(
                WORKFLOW_STATUS_STYLES[entry.new_status] ?? ''
              );
              const oldLabel = entry.old_status
                ? (WORKFLOW_STATUS_LABELS[entityType]?.[entry.old_status] ?? entry.old_status)
                : null;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.2 }}
                  className="flex items-start gap-3 relative"
                >
                  {/* Dot */}
                  <div
                    className={cn('size-2 rounded-full shrink-0 mt-1 border border-current', dotColor)}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    {/* New status badge + old status arrow */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      <StatusBadge entityType={entityType} status={entry.new_status} />
                      {oldLabel && (
                        <span className="text-[10px] text-white/30 font-arabic">
                          {'← '}{oldLabel}
                        </span>
                      )}
                    </div>

                    {/* changed_by */}
                    {entry.changed_by && (
                      <p className="text-[10px] text-white/30 font-arabic truncate">
                        {entry.changed_by}
                      </p>
                    )}

                    {/* notes */}
                    {entry.notes && (
                      <p className="text-[10px] text-white/50 font-arabic mt-0.5">
                        {entry.notes}
                      </p>
                    )}

                    {/* created_at */}
                    <p className="text-[10px] text-white/20">
                      {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* Creation anchor */}
            {createdAt && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reversed.length * 0.06, duration: 0.2 }}
                className="flex items-start gap-3 relative"
              >
                <div className="size-2 rounded-full shrink-0 mt-1 bg-white/15 border border-white/20" />
                <div className="flex-1 space-y-0.5">
                  <p className="text-[10px] text-white/30 font-arabic">تم الإنشاء</p>
                  <p className="text-[10px] text-white/20">
                    {format(new Date(createdAt), 'MMM d, HH:mm')}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
