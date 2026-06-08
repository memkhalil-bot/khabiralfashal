import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { UserCheck, Plus, X, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  display_name: string | null;
  active: boolean | null;
  created_at: string;
}

const ROLES = ['owner', 'admin', 'reviewer', 'assistant', 'read_only'] as const;

const ROLE_COLORS: Record<string, string> = {
  owner:     'bg-ember/10 text-ember border-ember/20',
  admin:     'bg-sky-950/30 text-sky-400 border-sky-800/30',
  reviewer:  'bg-violet-950/30 text-violet-400 border-violet-800/30',
  assistant: 'bg-amber-950/30 text-amber-400 border-amber-800/30',
  read_only: 'bg-white/5 text-white/35 border-white/8',
};

function useTeam() {
  return useQuery({
    queryKey: ['admin', 'team'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_roles')
        .select('id, user_id, role, display_name, active, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
    staleTime: 60_000,
  });
}

function RoleBadge({ role }: { role: string }) {
  const { t: adminT } = useAdminLanguage();
  const style = ROLE_COLORS[role] ?? 'bg-white/5 text-white/35 border-white/8';
  const label = adminT.team.roles[role] ?? role;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic', style)}>
      <Shield className="size-2.5" />
      {label}
    </span>
  );
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('admin');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!userId.trim()) { setErr('معرّف المستخدم مطلوب'); return; }
    setSaving(true);
    setErr('');
    try {
      const { error } = await (supabase as any).from('user_roles').insert({
        user_id: userId.trim(),
        role,
        display_name: name || null,
        active: true,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['admin', 'team'] });
      onClose();
    } catch (e: any) {
      setErr(e.message ?? 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-20"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 flex items-center justify-center z-30 p-4"
        dir="rtl"
      >
        <div className="w-full max-w-md bg-[#0a0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
            <h3 className="text-white font-semibold font-arabic">{adminT.team.form.title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
              <X className="size-4 text-white/40" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {err && (
              <div className="p-3 bg-crimson/10 border border-crimson/20 rounded-lg text-crimson text-sm font-arabic">
                {err}
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                User ID (Supabase Auth UUID)
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors font-mono"
                dir="ltr"
              />
              <p className="text-[9px] text-white/20 mt-1 font-arabic">{adminT.team.form.hint}</p>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                {adminT.team.form.name}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors font-arabic"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                {adminT.team.form.role}
              </label>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <label key={r} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={role === r}
                      onChange={() => setRole(r)}
                      className="sr-only"
                    />
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors flex items-center justify-center',
                      role === r ? 'border-ember bg-ember/20' : 'border-white/15 group-hover:border-white/30'
                    )}>
                      {role === r && <div className="w-1.5 h-1.5 rounded-full bg-ember" />}
                    </div>
                    <div>
                      <p className="text-sm text-white/80 font-arabic">{adminT.team.roles[r]}</p>
                      <p className="text-[11px] text-white/30 font-arabic">{adminT.team.roleDescriptions[r]}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-white/6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/40 hover:text-white/70 text-sm font-arabic transition-colors"
            >
              {adminT.team.form.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors disabled:opacity-50"
            >
              {saving ? '...' : adminT.team.form.save}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminTeam() {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const { data: members = [], isLoading } = useTeam();
  const [showAdd, setShowAdd] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from('user_roles').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'team'] }),
  });

  return (
    <AdminLayout title={adminT.team.title} subtitle={adminT.team.subtitle}>
      <AnimatePresence>
        {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
      </AnimatePresence>

      {/* Add button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors"
        >
          <Plus className="size-4" />
          {adminT.team.addMember}
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 mb-8">
        {ROLES.map((r) => (
          <div key={r} className="bg-[#161b22] border border-white/6 rounded-lg p-4">
            <RoleBadge role={r} />
            <p className="text-[11px] text-white/35 mt-2 font-arabic">{adminT.team.roleDescriptions[r]}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-white/6 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_120px_120px] gap-4 px-6 py-3 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-wider font-arabic">
          <span>{adminT.team.table.member}</span>
          <span>User ID</span>
          <span>{adminT.team.table.role}</span>
          <span>{adminT.team.table.status}</span>
          <span>{adminT.team.table.created}</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-white/4 rounded animate-pulse" />
            ))}
          </div>
        ) : !members.length ? (
          <div className="py-20 text-center">
            <Users className="size-10 text-white/8 mx-auto mb-4" />
            <p className="text-white/30 text-sm font-arabic">{adminT.team.empty}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {members.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[2fr_1fr_1fr_120px_120px] gap-4 px-6 py-4 items-center"
              >
                <div>
                  <p className="text-sm text-white/80 font-arabic">
                    {m.display_name ?? 'عضو'}
                  </p>
                </div>
                <p className="text-[10px] text-white/30 font-mono truncate">
                  {m.user_id.slice(0, 8)}…
                </p>
                <RoleBadge role={m.role} />
                <button
                  onClick={() => toggleMutation.mutate({ id: m.id, active: !(m.active ?? true) })}
                  disabled={toggleMutation.isPending}
                  className={cn(
                    'text-[11px] px-2.5 py-1 rounded-md border transition-colors font-arabic disabled:opacity-40',
                    (m.active ?? true)
                      ? 'text-recovery border-recovery/20 hover:bg-recovery/8'
                      : 'text-white/35 border-white/8 hover:bg-white/6'
                  )}
                >
                  {(m.active ?? true) ? adminT.team.active : adminT.team.inactive}
                </button>
                <span className="text-[10px] text-white/25">
                  {format(new Date(m.created_at), 'MMM d, yyyy')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
