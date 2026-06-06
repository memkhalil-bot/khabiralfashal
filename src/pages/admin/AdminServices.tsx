import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Plus, X, CheckSquare, Square, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  service_name: string;
  service_key: string;
  category: string;
  price: number;
  duration_minutes: number | null;
  active: boolean;
  accepts_promo_codes: boolean;
  description_ar: string | null;
  description_en: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FormState {
  service_name: string;
  service_key: string;
  category: string;
  price: string;
  duration_minutes: string;
  accepts_promo_codes: boolean;
  description_ar: string;
  description_en: string;
  active: boolean;
}

const DEFAULT_FORM: FormState = {
  service_name: '',
  service_key: '',
  category: 'session',
  price: '0',
  duration_minutes: '',
  accepts_promo_codes: false,
  description_ar: '',
  description_en: '',
  active: true,
};

const CATEGORIES = ['report', 'session', 'program', 'advisory'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  report:   'تقرير',
  session:  'جلسة',
  program:  'برنامج',
  advisory: 'استشارة',
};

const CATEGORY_STYLES: Record<string, string> = {
  report:   'text-violet-400 bg-violet-950/20 border-violet-800/30',
  session:  'text-sky-400 bg-sky-950/20 border-sky-800/30',
  program:  'text-amber-400 bg-amber-950/20 border-amber-800/30',
  advisory: 'text-white/50 bg-white/5 border-white/8',
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useServices() {
  return useQuery({
    queryKey: ['admin', 'services'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Service[];
    },
    staleTime: 30_000,
  });
}

// ── Category Badge ────────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] ?? 'text-white/50 bg-white/5 border-white/8';
  const label = CATEGORY_LABELS[category] ?? category;
  return (
    <span
      className={cn(
        'inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic',
        style
      )}
    >
      {label}
    </span>
  );
}

// ── Service Modal ─────────────────────────────────────────────────────────────

function ServiceModal({
  editService,
  onClose,
}: {
  editService: Service | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(
    editService
      ? {
          service_name: editService.service_name,
          service_key: editService.service_key,
          category: editService.category,
          price: String(editService.price),
          duration_minutes: editService.duration_minutes != null ? String(editService.duration_minutes) : '',
          accepts_promo_codes: editService.accepts_promo_codes,
          description_ar: editService.description_ar ?? '',
          description_en: editService.description_en ?? '',
          active: editService.active,
        }
      : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const handleSave = async () => {
    if (!form.service_name.trim()) { setErr('اسم الخدمة مطلوب'); return; }
    if (!form.service_key.trim()) { setErr('مفتاح الخدمة مطلوب'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload: Record<string, unknown> = {
        service_name: form.service_name.trim(),
        service_key: form.service_key.trim(),
        category: form.category,
        price: Number(form.price) || 0,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        accepts_promo_codes: form.accepts_promo_codes,
        description_ar: form.description_ar || null,
        description_en: form.description_en || null,
        active: form.active,
      };

      if (editService) {
        payload.updated_at = new Date().toISOString();
        const { error } = await (supabase as any)
          .from('services')
          .update(payload)
          .eq('id', editService.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('services')
          .insert({ ...payload, sort_order: 999 });
        if (error) throw error;
      }

      qc.invalidateQueries({ queryKey: ['admin', 'services'] });
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
        <div className="w-full max-w-lg bg-[#0f141c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/6">
            <h3 className="text-white font-semibold font-arabic">
              {editService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors">
              <X className="size-4 text-white/40" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {err && (
              <div className="p-3 bg-crimson/10 border border-crimson/20 rounded-lg text-crimson text-sm font-arabic">
                {err}
              </div>
            )}

            {/* service_name */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                اسم الخدمة *
              </label>
              <input
                value={form.service_name}
                onChange={set('service_name')}
                dir="rtl"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors font-arabic"
              />
            </div>

            {/* service_key */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                مفتاح الخدمة *
              </label>
              <input
                value={form.service_key}
                onChange={set('service_key')}
                dir="ltr"
                placeholder="lowercase_with_underscores"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors font-mono"
              />
              <p className="text-[9px] text-white/20 mt-1 font-arabic">lowercase_with_underscores</p>
            </div>

            {/* category + price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  الفئة
                </label>
                <select
                  value={form.category}
                  onChange={set('category')}
                  className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors font-arabic"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                  السعر ($)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={set('price')}
                  dir="ltr"
                  className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>
            </div>

            {/* duration_minutes */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                المدة (دقائق) — اختياري
              </label>
              <input
                type="number"
                min="0"
                value={form.duration_minutes}
                onChange={set('duration_minutes')}
                dir="ltr"
                placeholder="—"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>

            {/* description_ar */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                الوصف بالعربية
              </label>
              <textarea
                value={form.description_ar}
                onChange={set('description_ar')}
                rows={3}
                dir="rtl"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors resize-none font-arabic"
              />
            </div>

            {/* description_en */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                الوصف بالإنجليزية
              </label>
              <textarea
                value={form.description_en}
                onChange={set('description_en')}
                rows={3}
                dir="ltr"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors resize-none"
              />
            </div>

            {/* accepts_promo_codes */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.accepts_promo_codes}
                onChange={(e) => setForm((f) => ({ ...f, accepts_promo_codes: e.target.checked }))}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors relative',
                  form.accepts_promo_codes ? 'bg-recovery' : 'bg-white/15'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.accepts_promo_codes ? 'translate-x-1' : 'translate-x-5'
                  )}
                />
              </div>
              <span className="text-sm text-white/70 font-arabic">يقبل كودات الخصم</span>
            </label>

            {/* active */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-10 h-5 rounded-full transition-colors relative',
                  form.active ? 'bg-recovery' : 'bg-white/15'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.active ? 'translate-x-1' : 'translate-x-5'
                  )}
                />
              </div>
              <span className="text-sm text-white/70 font-arabic">نشط</span>
            </label>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white/40 hover:text-white/70 text-sm font-arabic transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors disabled:opacity-50"
            >
              {saving ? '...' : 'حفظ'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminServices() {
  const qc = useQueryClient();
  const { data: services = [], isLoading } = useServices();
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any)
        .from('services')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'services'] }),
  });

  const totalServices = services.length;
  const activeServices = services.filter((s) => s.active).length;
  const categoriesCount = new Set(services.map((s) => s.category)).size;

  const openEdit = (s: Service) => {
    setEditService(s);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditService(null);
  };

  return (
    <AdminLayout title="الخدمات والأسعار" subtitle="إدارة الخدمات والتسعير">
      <AnimatePresence>
        {showModal && <ServiceModal editService={editService} onClose={closeModal} />}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161d27] border border-white/6 rounded-lg">
          <span className="text-[10px] uppercase tracking-wider text-white/30 font-arabic">إجمالي الخدمات</span>
          <span className="text-sm font-semibold text-white tabular-nums">{totalServices}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161d27] border border-white/6 rounded-lg">
          <span className="text-[10px] uppercase tracking-wider text-white/30 font-arabic">الخدمات النشطة</span>
          <span className="text-sm font-semibold text-recovery tabular-nums">{activeServices}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161d27] border border-white/6 rounded-lg">
          <span className="text-[10px] uppercase tracking-wider text-white/30 font-arabic">الفئات</span>
          <span className="text-sm font-semibold text-white tabular-nums">{categoriesCount}</span>
        </div>

        <div className="flex-1" />

        {/* Add button */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors"
        >
          <Plus className="size-4" />
          إضافة خدمة
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#161d27] border border-white/6 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_100px_80px] gap-4 px-6 py-3 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-wider font-arabic">
          <span>الخدمة</span>
          <span>الفئة</span>
          <span>السعر</span>
          <span>المدة</span>
          <span>كود خصم</span>
          <span>الحالة</span>
          <span>الإجراءات</span>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-white/4 rounded animate-pulse" />
            ))}
          </div>
        ) : !services.length ? (
          <div className="py-20 text-center">
            <Settings className="size-10 text-white/8 mx-auto mb-4" />
            <p className="text-white/30 text-sm font-arabic">لا توجد خدمات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_100px_80px] gap-4 px-6 py-4 items-center hover:bg-white/2 transition-colors"
              >
                {/* الخدمة */}
                <div className="min-w-0">
                  <p className="text-sm text-white/85 font-arabic font-medium truncate">
                    {service.service_name}
                  </p>
                  <code className="text-[10px] text-white/25 font-mono">
                    {service.service_key}
                  </code>
                </div>

                {/* الفئة */}
                <CategoryBadge category={service.category} />

                {/* السعر */}
                <span className="text-sm tabular-nums font-arabic">
                  {service.price === 0 ? (
                    <span className="text-recovery">مجاناً</span>
                  ) : (
                    <span className="text-white/75">${service.price}</span>
                  )}
                </span>

                {/* المدة */}
                <span className="text-sm text-white/50 tabular-nums font-arabic">
                  {service.duration_minutes != null ? `${service.duration_minutes} د` : '—'}
                </span>

                {/* كود خصم */}
                <div className="flex justify-center">
                  {service.accepts_promo_codes ? (
                    <CheckSquare className="size-4 text-recovery" />
                  ) : (
                    <Square className="size-4 text-white/20" />
                  )}
                </div>

                {/* الحالة — clickable toggle */}
                <button
                  onClick={() =>
                    toggleMutation.mutate({ id: service.id, active: !service.active })
                  }
                  disabled={toggleMutation.isPending}
                  className={cn(
                    'inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-medium border transition-colors font-arabic disabled:opacity-40 cursor-pointer',
                    service.active
                      ? 'text-recovery bg-recovery/8 border-recovery/20 hover:bg-recovery/15'
                      : 'text-white/25 bg-white/4 border-white/8 hover:bg-white/8'
                  )}
                >
                  {service.active ? 'نشط' : 'معطّل'}
                </button>

                {/* الإجراءات */}
                <button
                  onClick={() => openEdit(service)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/80 hover:bg-white/6 border border-transparent hover:border-white/8 transition-colors font-arabic"
                >
                  <Pencil className="size-3" />
                  تعديل
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
