import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { useSearchParams } from 'react-router-dom';
import { X, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isToday } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type FollowUp = Tables<'follow_ups'>;

// ── Filters ───────────────────────────────────────────────────────────────────

const FILTER_TABS = ['ALL', 'PENDING', 'IN PROGRESS', 'DONE', 'OVERDUE'] as const;
type FilterTab = typeof FILTER_TABS[number];

// ── Badges ────────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!priority) return null;
  const styles: Record<string, string> = {
    urgent: 'bg-crimson/10 text-crimson border-crimson/25',
    high:   'bg-orange-950/30 text-orange-400 border-orange-800/30',
    medium: 'bg-yellow-950/30 text-yellow-400 border-yellow-800/30',
    low:    'bg-white/5 text-white/35 border-white/8',
  };
  const style = styles[priority] ?? 'bg-white/5 text-white/35 border-white/8';
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border font-arabic ${style}`}>
      {adminT.followUps.priority[priority] ?? priority}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string | null }) {
  const colors: Record<string, string> = {
    urgent: 'bg-red-500',
    high:   'bg-orange-500',
    medium: 'bg-amber-500',
    low:    'bg-white/20',
  };
  return (
    <div className={`size-2 rounded-full shrink-0 mt-1.5 ${colors[priority ?? ''] ?? 'bg-white/20'}`} />
  );
}

function TypeBadge({ type }: { type: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!type) return null;
  const styles: Record<string, string> = {
    check_in: 'bg-sky-950/30 text-sky-400 border-sky-800/30',
    document: 'bg-violet-950/30 text-violet-400 border-violet-800/30',
    decision: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
    action:   'bg-recovery/10 text-recovery border-recovery/25',
    meeting:  'bg-blue-950/30 text-blue-400 border-blue-800/30',
  };
  const style = styles[type] ?? 'bg-white/5 text-white/35 border-white/8';
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border font-arabic ${style}`}>
      {adminT.followUps.type[type] ?? type.replace('_', ' ')}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!status) return null;
  const styles: Record<string, string> = {
    pending:     'bg-amber-950/30 text-amber-400 border-amber-800/30',
    in_progress: 'bg-sky-950/30 text-sky-400 border-sky-800/30',
    done:        'bg-recovery/10 text-recovery border-recovery/25',
  };
  const style = styles[status] ?? 'bg-white/5 text-white/35 border-white/8';
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium border font-arabic ${style}`}>
      {adminT.followUps.status[status] ?? status.replace('_', ' ')}
    </span>
  );
}

// ── Data hook ──────────────────────────────────────────────────────────────────

function useFollowUps(filterTab: FilterTab) {
  return useQuery({
    queryKey: ['admin', 'follow-ups', filterTab],
    queryFn: async () => {
      let q = supabase.from('follow_ups').select('*').order('due_date', { ascending: true, nullsFirst: false });
      if (filterTab === 'PENDING') {
        q = q.eq('status', 'pending');
      } else if (filterTab === 'IN PROGRESS') {
        q = q.eq('status', 'in_progress');
      } else if (filterTab === 'DONE') {
        q = q.eq('status', 'done');
      } else if (filterTab === 'OVERDUE') {
        q = q.neq('status', 'done').lt('due_date', new Date().toISOString().split('T')[0]);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as FollowUp[];
    },
    staleTime: 30_000,
  });
}

// ── Add Follow-up Panel ───────────────────────────────────────────────────────

function AddFollowUpPanel({ onClose }: { onClose: () => void }) {
  const { t: adminT } = useAdminLanguage();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [founderName, setFounderName]   = useState(searchParams.get('name') ?? '');
  const [founderEmail, setFounderEmail] = useState(searchParams.get('founder') ?? '');
  const [title, setTitle]               = useState('');
  const [note, setNote]                 = useState('');
  const [type, setType]                 = useState('check_in');
  const [priority, setPriority]         = useState('medium');
  const [dueDate, setDueDate]           = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('follow_ups').insert({
        founder_name:  founderName || null,
        founder_email: founderEmail || null,
        title,
        note:          note || null,
        type,
        priority,
        due_date:      dueDate || null,
        status:        'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'follow-ups'] });
      onClose();
    },
  });

  const inputCls = "w-full bg-transparent border-b border-white/15 focus:border-ember outline-none py-2 text-sm text-white/70 placeholder:text-white/20";
  const labelCls = "text-[10px] tracking-[0.25em] uppercase text-white/35 mb-1 block";

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
          <p className="text-white font-medium text-sm font-arabic">{adminT.followUps.new}</p>
          <button onClick={onClose} className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls}>{adminT.followUps.form.founderName}</label>
            <input type="text" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="الاسم الكامل" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{adminT.sessions.form.email}</label>
            <input type="email" value={founderEmail} onChange={(e) => setFounderEmail(e.target.value)} placeholder="email@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{adminT.followUps.form.title} *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المتابعة" className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>{adminT.followUps.form.notes}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="سياق إضافي..." rows={3} className={cn(inputCls, 'resize-none')} />
          </div>
          <div>
            <label className={labelCls}>{adminT.followUps.form.type}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={cn(inputCls, 'cursor-pointer font-arabic')}>
              <option value="check_in">{adminT.followUps.type.check_in}</option>
              <option value="document">{adminT.followUps.type.document}</option>
              <option value="decision">{adminT.followUps.type.decision}</option>
              <option value="action">{adminT.followUps.type.action}</option>
              <option value="meeting">{adminT.followUps.type.meeting}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{adminT.followUps.form.priority}</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={cn(inputCls, 'cursor-pointer font-arabic')}>
              <option value="low">{adminT.followUps.priority.low}</option>
              <option value="medium">{adminT.followUps.priority.medium}</option>
              <option value="high">{adminT.followUps.priority.high}</option>
              <option value="urgent">{adminT.followUps.priority.urgent}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{adminT.followUps.form.dueDate}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !title}
              className="flex-1 py-2.5 bg-ember text-[#fff] text-sm font-medium rounded-lg hover:bg-ember/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isPending ? 'جارٍ الحفظ...' : adminT.followUps.new}
            </button>
            <button onClick={onClose} className="px-4 text-white/40 hover:text-white/70 transition-colors text-sm font-arabic">
              {adminT.common.cancel}
            </button>
          </div>
          {mutation.isError && (
            <p className="text-crimson text-xs font-arabic">فشل الحفظ. يرجى المحاولة مرة أخرى.</p>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ── Follow-up card ────────────────────────────────────────────────────────────

function FollowUpCard({ item }: { item: FollowUp }) {
  const queryClient = useQueryClient();

  const isDone = item.status === 'done';
  const isOverdue = !isDone && !!item.due_date && isPast(new Date(item.due_date)) && !isToday(new Date(item.due_date));

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('follow_ups').update({
        status: 'done',
        completed_at: new Date().toISOString(),
      }).eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'follow-ups'] });
    },
  });

  return (
    <div className={cn(
      'bg-[#0d0d0d] border border-white/6 rounded-xl p-4 flex items-start gap-3 transition-all',
      isOverdue && 'border-l-2 border-l-red-500/40 bg-red-950/10 border-r-white/6 border-t-white/6 border-b-white/6',
      isDone && 'opacity-50'
    )}>
      <PriorityDot priority={item.priority} />

      <div className="flex-1 min-w-0">
        <p className={cn('text-white/80 text-sm font-medium', isDone && 'line-through text-white/40')}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.founder_name && (
            <span className="text-[11px] text-white/35">{item.founder_name}</span>
          )}
          <TypeBadge type={item.type} />
          {item.due_date && (
            <span className={cn('text-[10px]', isOverdue ? 'text-red-400' : 'text-white/30')}>
              {isToday(new Date(item.due_date))
                ? 'اليوم'
                : format(new Date(item.due_date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={item.status} />
        {!isDone && (
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            title="Mark as done"
            className="size-6 flex items-center justify-center rounded-md border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-950/20 text-white/25 hover:text-emerald-400 transition-colors"
          >
            <Check className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminFollowUps() {
  const { t: adminT } = useAdminLanguage();
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');
  const [showAddPanel, setShowAddPanel] = useState(false);

  const { data, isLoading, error } = useFollowUps(filterTab);

  const pending = data?.filter((f) => f.status === 'pending').length ?? 0;
  const overdue = data?.filter((f) =>
    f.status !== 'done' && !!f.due_date && isPast(new Date(f.due_date)) && !isToday(new Date(f.due_date))
  ).length ?? 0;

  return (
    <AdminLayout
      title={adminT.followUps.title}
      subtitle={adminT.followUps.subtitle}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map((f) => (
            <button
              key={f}
              onClick={() => setFilterTab(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] transition-colors font-arabic',
                filterTab === f
                  ? 'bg-white/10 text-white'
                  : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              )}
            >
              {adminT.followUps.filters[f] ?? f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddPanel(true)}
          className="flex items-center gap-2 px-4 py-2 bg-ember text-[#fff] text-xs rounded-lg hover:bg-ember/90 transition-colors shrink-0 font-arabic"
        >
          <Plus className="size-3.5" /> {adminT.followUps.new}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-crimson/10 border border-crimson/25 rounded-lg text-crimson text-sm font-arabic">
          تعذّر تحميل المتابعات.
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/4 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="py-16 text-center">
          <p className="text-white/25 text-sm font-arabic">{adminT.followUps.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <FollowUpCard item={item} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Add panel */}
      <AnimatePresence>
        {showAddPanel && (
          <AddFollowUpPanel key="add-followup" onClose={() => setShowAddPanel(false)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
