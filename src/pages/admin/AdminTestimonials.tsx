import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Tables } from '@/integrations/supabase/types';

type Testimonial = Tables<'testimonials'>;
type TestimonialInsert = {
  quote: string;
  author_name: string;
  author_role?: string | null;
  company?: string | null;
  order_index?: number;
  published?: boolean;
};

// ── Data hooks ────────────────────────────────────────────────────────────────

function useTestimonials() {
  return useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as Testimonial[];
    },
    staleTime: 30_000,
  });
}

// ── Form modal ────────────────────────────────────────────────────────────────

const EMPTY_FORM: TestimonialInsert = {
  quote: '',
  author_name: '',
  author_role: '',
  company: '',
  order_index: 0,
  published: true,
};

interface FormModalProps {
  initial: Testimonial | null; // null = new
  onClose: () => void;
  maxOrder: number;
}

function FormModal({ initial, onClose, maxOrder }: FormModalProps) {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const isEdit = initial !== null;

  const [form, setForm] = useState<TestimonialInsert>(
    initial
      ? {
          quote: initial.quote,
          author_name: initial.author_name,
          author_role: initial.author_role ?? '',
          company: initial.company ?? '',
          order_index: initial.order_index,
          published: initial.published,
        }
      : { ...EMPTY_FORM, order_index: maxOrder + 1 }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof TestimonialInsert, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: TestimonialInsert = {
      ...form,
      author_role: form.author_role || null,
      company: form.company || null,
    };

    let err;
    if (isEdit) {
      ({ error: err } = await supabase
        .from('testimonials')
        .update(payload)
        .eq('id', initial!.id));
    } else {
      ({ error: err } = await supabase.from('testimonials').insert(payload));
    }

    setSaving(false);

    if (err) {
      setError(err.message);
      return;
    }

    await qc.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
    // Also invalidate the public testimonials cache
    await qc.invalidateQueries({ queryKey: ['testimonials'] });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Quote className="size-4 text-ember" />
            <h2 className="text-sm text-white/80 tracking-wide">
              {isEdit ? 'تعديل شهادة' : adminT.testimonials.add}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Quote */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.25em] uppercase text-white/40">
              {adminT.testimonials.form.quote} <span className="text-ember">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={form.quote}
              onChange={(e) => set('quote', e.target.value)}
              placeholder="What the founder said…"
              className="w-full px-4 py-3 bg-white/4 border border-white/8 rounded-lg text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-ember/40 transition-colors resize-none"
            />
          </div>

          {/* Author name */}
          <div className="space-y-2">
            <label className="text-[10px] tracking-[0.25em] uppercase text-white/40">
              {adminT.testimonials.form.authorName} <span className="text-ember">*</span>
            </label>
            <input
              type="text"
              required
              value={form.author_name}
              onChange={(e) => set('author_name', e.target.value)}
              placeholder="Founder / Co-founder"
              className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-lg text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-ember/40 transition-colors"
            />
          </div>

          {/* Role + Company */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/40">
                {adminT.testimonials.form.authorRole}
              </label>
              <input
                type="text"
                value={form.author_role ?? ''}
                onChange={(e) => set('author_role', e.target.value)}
                placeholder="e.g. CEO · Seed · SaaS"
                className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-lg text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-ember/40 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/40">
                {adminT.testimonials.form.company}
              </label>
              <input
                type="text"
                value={form.company ?? ''}
                onChange={(e) => set('company', e.target.value)}
                placeholder="e.g. Riyadh"
                className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-lg text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-ember/40 transition-colors"
              />
            </div>
          </div>

          {/* Order + Published */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/40">
                ترتيب العرض
              </label>
              <input
                type="number"
                min={0}
                value={form.order_index}
                onChange={(e) => set('order_index', parseInt(e.target.value, 10) || 0)}
                className="w-full px-4 py-2.5 bg-white/4 border border-white/8 rounded-lg text-sm text-white/80 focus:outline-none focus:border-ember/40 transition-colors"
              />
              <p className="text-[10px] text-white/25">الأقل يُعرض أولاً</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/40">
                الظهور
              </label>
              <button
                type="button"
                onClick={() => set('published', !form.published)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-all ${
                  form.published
                    ? 'bg-recovery/10 border-recovery/25 text-recovery'
                    : 'bg-white/4 border-white/8 text-white/40'
                }`}
              >
                {form.published ? (
                  <><Eye className="size-4" /> {adminT.testimonials.form.published}</>
                ) : (
                  <><EyeOff className="size-4" /> مخفية</>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-crimson/8 border border-crimson/20 rounded-lg">
              <AlertCircle className="size-4 text-crimson shrink-0 mt-0.5" />
              <p className="text-xs text-crimson/80">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
            >
              {adminT.testimonials.form.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ember hover:bg-ember-dim text-[#fff] text-sm rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <span className="size-4 border-2 border-[#fff] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saving ? 'جارٍ الحفظ...' : isEdit ? adminT.testimonials.form.save : adminT.testimonials.add}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  row,
  onClose,
}: {
  row: Testimonial;
  onClose: () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    const { error: err } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', row.id);
    setDeleting(false);
    if (err) {
      setError(err.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
    await qc.invalidateQueries({ queryKey: ['testimonials'] });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-sm bg-[#0f0f0f] border border-white/8 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="size-9 flex items-center justify-center rounded-full bg-crimson/10 border border-crimson/20">
            <Trash2 className="size-4 text-crimson" />
          </div>
          <h2 className="text-sm text-white/80">حذف الشهادة؟</h2>
        </div>
        <p className="text-sm text-white/50 leading-relaxed mb-5">
          سيتم حذف شهادة{' '}
          <strong className="text-white/70">{row.author_name}</strong> نهائياً. لا يمكن التراجع عن هذا الإجراء.
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-crimson/8 border border-crimson/20 rounded-lg mb-4">
            <AlertCircle className="size-4 text-crimson shrink-0 mt-0.5" />
            <p className="text-xs text-crimson/80">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-white/50 hover:text-white/80 transition-all"
          >
            {adminT.common.cancel}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-crimson hover:bg-crimson-dim text-[#fff] text-sm rounded-lg transition-all disabled:opacity-50"
          >
            {deleting ? (
              <span className="size-4 border-2 border-[#fff] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {deleting ? 'جارٍ الحذف...' : adminT.common.delete}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Quick toggle published ────────────────────────────────────────────────────

function useTogglePublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from('testimonials')
        .update({ published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
      qc.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminTestimonials() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading, error } = useTestimonials();
  const togglePublished = useTogglePublished();

  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [target, setTarget] = useState<Testimonial | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const maxOrder = data ? Math.max(0, ...data.map((t) => t.order_index)) : 0;

  const openEdit = (t: Testimonial) => {
    setTarget(t);
    setModal('edit');
  };

  const openDelete = (t: Testimonial) => {
    setTarget(t);
    setModal('delete');
  };

  const handleToggle = async (t: Testimonial) => {
    try {
      await togglePublished.mutateAsync({ id: t.id, published: !t.published });
      setSuccessMsg(!t.published ? 'تم نشر الشهادة.' : 'تم إخفاء الشهادة.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // Error shown by mutation
    }
  };

  return (
    <AdminLayout
      title={adminT.testimonials.title}
      subtitle={`${data?.length ?? '…'} شهادة · ${data?.filter((t) => t.published).length ?? '…'} منشورة`}
    >
      {/* Top actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-emerald-400 text-sm"
            >
              <CheckCircle2 className="size-4" />
              {successMsg}
            </motion.div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-crimson text-sm">
              <AlertCircle className="size-4" />
              تعذّر تحميل الشهادات. تحقق من إعدادات قاعدة البيانات.
            </div>
          )}
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-ember hover:bg-ember-dim text-[#fff] text-[11px] tracking-[0.2em] uppercase transition-all duration-300 rounded-lg"
        >
          <Plus className="size-4" />
          {adminT.testimonials.add}
        </button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-[#0d0d0d] border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Quote className="size-10 text-white/10 mb-4" />
          <p className="text-white/30 text-sm">{adminT.testimonials.empty}</p>
          <button
            onClick={() => setModal('add')}
            className="mt-4 text-[11px] tracking-[0.2em] uppercase text-ember/60 hover:text-ember transition-colors"
          >
            {adminT.testimonials.add} ←
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`flex gap-4 p-5 bg-[#0d0d0d] border rounded-xl transition-all ${
                t.published ? 'border-white/6' : 'border-white/3 opacity-60'
              }`}
            >
              {/* Drag handle (visual) */}
              <div className="flex items-center text-white/15 shrink-0">
                <GripVertical className="size-4" />
              </div>

              {/* Order badge */}
              <div className="size-7 shrink-0 flex items-center justify-center rounded-md bg-white/5 text-[11px] text-white/30 font-mono">
                {t.order_index}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <blockquote className="text-sm text-white/70 leading-relaxed line-clamp-2 italic mb-2">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-white/60 font-medium">{t.author_name}</span>
                  {t.author_role && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-white/35">{t.author_role}</span>
                    </>
                  )}
                  {t.company && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-white/25">{t.company}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Toggle published */}
                <button
                  onClick={() => handleToggle(t)}
                  title={t.published ? 'إخفاء' : 'نشر'}
                  className={`size-8 flex items-center justify-center rounded-lg transition-all ${
                    t.published
                      ? 'text-recovery/70 hover:bg-recovery/10 hover:text-recovery'
                      : 'text-white/25 hover:bg-white/5 hover:text-white/60'
                  }`}
                >
                  {t.published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>

                {/* Edit */}
                <button
                  onClick={() => openEdit(t)}
                  title="Edit"
                  className="size-8 flex items-center justify-center rounded-lg text-white/25 hover:bg-white/5 hover:text-white/60 transition-all"
                >
                  <Pencil className="size-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => openDelete(t)}
                  title="Delete"
                  className="size-8 flex items-center justify-center rounded-lg text-white/25 hover:bg-red-950/30 hover:text-red-400 transition-all"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <FormModal
            key="form"
            initial={modal === 'edit' ? target : null}
            onClose={() => { setModal(null); setTarget(null); }}
            maxOrder={maxOrder}
          />
        )}
        {modal === 'delete' && target && (
          <DeleteConfirm
            key="delete"
            row={target}
            onClose={() => { setModal(null); setTarget(null); }}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
