import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Tag, Plus, Search, Copy, CheckCheck, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoCode {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  service_key: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  created_at: string;
}

interface FormState {
  code: string;
  title: string;
  description: string;
  service_key: string;
  discount_type: string;
  discount_value: string;
  max_uses: string;
  max_uses_per_customer: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

const DEFAULT_FORM: FormState = {
  code: '',
  title: '',
  description: '',
  service_key: 'all_services',
  discount_type: 'percentage',
  discount_value: '',
  max_uses: '',
  max_uses_per_customer: '1',
  starts_at: '',
  ends_at: '',
  active: true,
};

function usePromoCodes() {
  return useQuery({
    queryKey: ['admin', 'promo-codes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PromoCode[];
    },
    staleTime: 30_000,
  });
}

function isExpired(code: PromoCode): boolean {
  return !!code.ends_at && new Date(code.ends_at) < new Date();
}

function StatusBadge({ code }: { code: PromoCode }) {
  const { t: adminT } = useAdminLanguage();
  if (isExpired(code)) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-white/4 text-white/25 border-white/6 font-arabic">
        {adminT.promoCodes.expired}
      </span>
    );
  }
  if (code.active) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-recovery/8 text-recovery border-recovery/20 font-arabic">
        {adminT.promoCodes.active}
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border bg-white/4 text-white/35 border-white/8 font-arabic">
      {adminT.promoCodes.inactive}
    </span>
  );
}

function discountLabel(code: PromoCode, t: ReturnType<typeof useAdminLanguage>['t']): string {
  if (code.discount_type === 'free') return t.promoCodes.discountTypes.free;
  if (code.discount_type === 'percentage') return `${code.discount_value}%`;
  return `$${code.discount_value}`;
}

// ── Form Modal ────────────────────────────────────────────────────────────────

function CodeModal({
  editCode,
  onClose,
}: {
  editCode: PromoCode | null;
  onClose: () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(
    editCode
      ? {
          code: editCode.code,
          title: editCode.title ?? '',
          description: editCode.description ?? '',
          service_key: editCode.service_key,
          discount_type: editCode.discount_type,
          discount_value: String(editCode.discount_value),
          max_uses: editCode.max_uses != null ? String(editCode.max_uses) : '',
          max_uses_per_customer: editCode.max_uses_per_customer != null ? String(editCode.max_uses_per_customer) : '1',
          starts_at: editCode.starts_at ? editCode.starts_at.split('T')[0] : '',
          ends_at: editCode.ends_at ? editCode.ends_at.split('T')[0] : '',
          active: editCode.active,
        }
      : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setErr('الكود مطلوب'); return; }
    if (!form.discount_value && form.discount_type !== 'free') { setErr('قيمة الخصم مطلوبة'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        title: form.title || null,
        description: form.description || null,
        service_key: form.service_key,
        discount_type: form.discount_type,
        discount_value: form.discount_type === 'free' ? 100 : Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        max_uses_per_customer: form.max_uses_per_customer ? Number(form.max_uses_per_customer) : 1,
        starts_at: form.starts_at || new Date().toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at + 'T23:59:59').toISOString() : '2099-12-31T23:59:59+00:00',
        active: form.active,
      };

      if (editCode) {
        const { error } = await (supabase as any).from('promo_codes').update(payload).eq('id', editCode.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('promo_codes').insert({ ...payload, used_count: 0 });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });
      onClose();
    } catch (e: any) {
      setErr(e.message ?? 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const services = Object.keys(adminT.promoCodes.services);
  const discountTypes = Object.keys(adminT.promoCodes.discountTypes);

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
        <div className="w-full max-w-lg bg-[#0a0d14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
            <h3 className="text-white font-semibold font-arabic">
              {editCode ? adminT.promoCodes.form.editTitle : adminT.promoCodes.form.title}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
              <X className="size-4 text-white/40" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {err && (
              <div className="p-3 bg-crimson/10 border border-crimson/20 rounded-lg text-crimson text-sm font-arabic">
                {err}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.code}
                </label>
                <input
                  value={form.code}
                  onChange={set('code')}
                  placeholder={adminT.promoCodes.form.codePlaceholder}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors font-mono uppercase"
                  dir="ltr"
                />
                <p className="text-[9px] text-white/20 mt-1 font-arabic">{adminT.promoCodes.form.codeHint}</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.title_field}
                </label>
                <input
                  value={form.title}
                  onChange={set('title')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors font-arabic"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.service}
                </label>
                <select
                  value={form.service_key}
                  onChange={set('service_key')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors font-arabic"
                >
                  {services.map((s) => (
                    <option key={s} value={s}>{adminT.promoCodes.services[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.discountType}
                </label>
                <select
                  value={form.discount_type}
                  onChange={set('discount_type')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors font-arabic"
                >
                  {discountTypes.map((d) => (
                    <option key={d} value={d}>{adminT.promoCodes.discountTypes[d]}</option>
                  ))}
                </select>
              </div>
            </div>

            {form.discount_type !== 'free' && (
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.discountValue}
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={set('discount_value')}
                  placeholder={adminT.promoCodes.form.discountValueHint}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.maxUses}
                </label>
                <input
                  type="number"
                  value={form.max_uses}
                  onChange={set('max_uses')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.maxUsesPerCustomer}
                </label>
                <input
                  type="number"
                  value={form.max_uses_per_customer}
                  onChange={set('max_uses_per_customer')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.startsAt}
                </label>
                <input
                  type="date"
                  value={form.starts_at}
                  onChange={set('starts_at')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  {adminT.promoCodes.form.endsAt}
                </label>
                <input
                  type="date"
                  value={form.ends_at}
                  onChange={set('ends_at')}
                  className="w-full bg-[#161b22] border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/20 transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="sr-only"
              />
              <div className={cn('w-10 h-5 rounded-full transition-colors relative', form.active ? 'bg-recovery' : 'bg-white/15')}>
                <div className={cn('absolute top-0.5 w-4 h-4 bg-[#fff] rounded-full shadow transition-transform', form.active ? 'translate-x-1' : 'translate-x-5')} />
              </div>
              <span className="text-sm text-white/70 font-arabic">{adminT.promoCodes.form.active}</span>
            </label>
          </div>

          <div className="px-6 py-4 border-t border-white/6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/40 hover:text-white/70 text-sm font-arabic transition-colors"
            >
              {adminT.promoCodes.form.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors disabled:opacity-50"
            >
              {saving ? '...' : adminT.promoCodes.form.save}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminPromoCodes() {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const { data: codes = [], isLoading } = usePromoCodes();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState<PromoCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any).from('promo_codes').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'promo-codes'] }),
  });

  const filtered = codes.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.code.toLowerCase().includes(q) ||
      (c.title ?? '').toLowerCase().includes(q)
    );
  });

  const copyCode = (code: PromoCode) => {
    navigator.clipboard.writeText(code.code).then(() => {
      setCopiedId(code.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const openEdit = (code: PromoCode) => {
    setEditCode(code);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditCode(null);
  };

  return (
    <AdminLayout title={adminT.promoCodes.title} subtitle={adminT.promoCodes.subtitle}>
      <AnimatePresence>
        {showModal && <CodeModal editCode={editCode} onClose={closeModal} />}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.promoCodes.search}
            className="w-full bg-[#161b22] border border-white/8 rounded-lg px-4 py-2.5 pr-9 text-sm text-white/80 placeholder-white/25 font-arabic focus:outline-none focus:border-white/20 transition-colors"
            dir="rtl"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors"
        >
          <Plus className="size-4" />
          {adminT.promoCodes.addCode}
        </button>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-[#161b22] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="py-20 text-center">
          <Tag className="size-10 text-white/8 mx-auto mb-4" />
          <p className="text-white/30 text-sm font-arabic">{adminT.promoCodes.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((code, i) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-[#161b22] border border-white/6 rounded-xl p-5 hover:border-white/12 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono font-bold text-white/90 bg-white/6 px-2 py-0.5 rounded">
                    {code.code}
                  </code>
                  <button
                    onClick={() => copyCode(code)}
                    className="p-1 rounded hover:bg-white/8 transition-colors"
                  >
                    {copiedId === code.id
                      ? <CheckCheck className="size-3 text-recovery" />
                      : <Copy className="size-3 text-white/30 hover:text-white/60" />}
                  </button>
                </div>
                <StatusBadge code={code} />
              </div>

              {/* Title */}
              {code.title && (
                <p className="text-sm text-white/60 font-arabic mb-2">{code.title}</p>
              )}

              {/* Discount + service */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-semibold text-ember">{discountLabel(code, adminT)}</span>
                <span className="text-[10px] text-white/30 font-arabic">
                  {adminT.promoCodes.services[code.service_key] ?? code.service_key}
                </span>
              </div>

              {/* Usage */}
              <div className="flex items-center gap-3 mb-1">
                <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ember/50 rounded-full"
                    style={{
                      width: code.max_uses
                        ? `${Math.min(100, (code.used_count / code.max_uses) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/30 tabular-nums shrink-0">
                  {code.used_count}{code.max_uses ? `/${code.max_uses}` : ''} {adminT.promoCodes.usedCount}
                </span>
              </div>
              {code.max_uses && (
                <p className="text-[10px] text-white/25 font-arabic mb-3">
                  متبقي: {Math.max(0, code.max_uses - code.used_count)}
                </p>
              )}
              {!code.max_uses && <div className="mb-3" />}

              {/* Validity */}
              {(code.starts_at || code.ends_at) && (
                <p className="text-[10px] text-white/20 mb-3 font-arabic">
                  {code.starts_at && format(new Date(code.starts_at), 'MMM d, yyyy')}
                  {code.starts_at && code.ends_at && ' — '}
                  {code.ends_at && format(new Date(code.ends_at), 'MMM d, yyyy')}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => openEdit(code)}
                  className="flex-1 py-1.5 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/6 rounded-lg transition-colors font-arabic"
                >
                  {adminT.common.edit}
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: code.id, active: !code.active })}
                  disabled={toggleMutation.isPending || isExpired(code)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] border transition-colors font-arabic disabled:opacity-40',
                    code.active
                      ? 'text-amber-400 border-amber-800/30 hover:bg-amber-950/20'
                      : 'text-recovery border-recovery/20 hover:bg-recovery/8'
                  )}
                >
                  {code.active
                    ? <><ToggleRight className="size-3" />{adminT.common.deactivate}</>
                    : <><ToggleLeft className="size-3" />{adminT.common.activate}</>}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
