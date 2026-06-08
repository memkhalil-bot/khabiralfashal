import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Plus, X, Pencil, Copy, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportTemplate {
  id: string;
  template_name: string;
  category: string;
  title: string;
  summary: string | null;
  recommendations: string | null;
  tags: string[];
  active: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

interface FormState {
  template_name: string;
  category: string;
  title: string;
  summary: string;
  recommendations: string;
  active: boolean;
}

const DEFAULT_FORM: FormState = {
  template_name: '',
  category: 'general',
  title: '',
  summary: '',
  recommendations: '',
  active: true,
};

const CATEGORIES = ['crisis', 'governance', 'financial', 'product', 'recovery', 'general'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  crisis:     'أزمة',
  governance: 'حوكمة',
  financial:  'مالي',
  product:    'منتج',
  recovery:   'تعافٍ',
  general:    'عام',
};

const CATEGORY_STYLES: Record<string, string> = {
  crisis:     'text-crimson bg-crimson/10 border-crimson/20',
  governance: 'text-sky-400 bg-sky-950/20 border-sky-800/30',
  financial:  'text-amber-400 bg-amber-950/20 border-amber-800/30',
  product:    'text-violet-400 bg-violet-950/20 border-violet-800/30',
  recovery:   'text-recovery bg-recovery/8 border-recovery/20',
  general:    'text-white/50 bg-white/5 border-white/8',
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useReportTemplates() {
  return useQuery({
    queryKey: ['admin', 'report-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReportTemplate[];
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

// ── Template Card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: ReportTemplate;
  index: number;
  onEdit: (t: ReportTemplate) => void;
  onDuplicate: (t: ReportTemplate) => void;
  archivingId: string | null;
  onArchiveRequest: (id: string) => void;
  onArchiveCancel: () => void;
  onArchiveConfirm: (id: string) => void;
}

function TemplateCard({
  template,
  index,
  onEdit,
  onDuplicate,
  archivingId,
  onArchiveRequest,
  onArchiveCancel,
  onArchiveConfirm,
}: TemplateCardProps) {
  const isConfirming = archivingId === template.id;

  return (
    <motion.div
      key={template.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-[#161d27] border border-white/6 rounded-xl p-5 flex flex-col gap-3"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-white/90 font-arabic leading-snug">
              {template.template_name}
            </p>
            <CategoryBadge category={template.category} />
          </div>
          <p className="text-[12px] text-white/50 font-arabic leading-snug">
            {template.title}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic',
            template.active
              ? 'text-recovery bg-recovery/8 border-recovery/20'
              : 'text-white/25 bg-white/4 border-white/8'
          )}
        >
          {template.active ? 'نشط' : 'معطّل'}
        </span>
      </div>

      {/* Summary */}
      {template.summary && (
        <p className="text-[12px] text-white/45 font-arabic leading-relaxed line-clamp-2">
          {template.summary}
        </p>
      )}

      {/* Use count */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-white/25 font-arabic">استُخدم</span>
        <span className="text-[10px] text-white/50 tabular-nums font-semibold">{template.use_count}</span>
        <span className="text-[10px] text-white/25 font-arabic">مرة</span>
      </div>

      {/* Archive confirm inline */}
      {isConfirming && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-3 px-3 py-2.5 bg-crimson/8 border border-crimson/20 rounded-lg"
        >
          <p className="text-[11px] text-crimson/80 font-arabic flex-1">
            سيتم إخفاء هذا القالب
          </p>
          <button
            onClick={() => onArchiveConfirm(template.id)}
            className="text-[11px] text-crimson font-arabic hover:text-crimson/80 transition-colors"
          >
            تأكيد
          </button>
          <button
            onClick={onArchiveCancel}
            className="text-[11px] text-white/30 font-arabic hover:text-white/60 transition-colors"
          >
            إلغاء
          </button>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onEdit(template)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/80 hover:bg-white/6 border border-transparent hover:border-white/8 transition-colors font-arabic"
        >
          <Pencil className="size-3" />
          تعديل
        </button>
        <button
          onClick={() => onDuplicate(template)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/40 hover:text-white/80 hover:bg-white/6 border border-transparent hover:border-white/8 transition-colors font-arabic"
        >
          <Copy className="size-3" />
          تكرار
        </button>
        {template.active && !isConfirming && (
          <button
            onClick={() => onArchiveRequest(template.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-crimson/70 hover:bg-crimson/6 border border-transparent hover:border-crimson/15 transition-colors font-arabic"
          >
            <Archive className="size-3" />
            أرشفة
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminReportTemplates() {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useReportTemplates();

  // Modal state: null = closed, 'new' = add, ReportTemplate = edit/duplicate
  const [modalTemplate, setModalTemplate] = useState<ReportTemplate | 'new' | null>(null);

  // When duplicating, we pre-fill with " (نسخة)" suffix and treat as new insert
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<ReportTemplate | null>(null);

  // Archive confirm state
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('report_templates')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'report-templates'] });
      setArchivingId(null);
    },
  });

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((t) => t.active).length;
  const categoriesCount = new Set(templates.map((t) => t.category)).size;

  // Category filter
  const allCategories = Array.from(new Set(templates.map((t) => t.category)));
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const filtered =
    activeFilter === 'ALL'
      ? templates
      : templates.filter((t) => t.category === activeFilter);

  const openAdd = () => {
    setIsDuplicating(false);
    setDuplicateSource(null);
    setModalTemplate('new');
  };

  const openEdit = (t: ReportTemplate) => {
    setIsDuplicating(false);
    setDuplicateSource(null);
    setModalTemplate(t);
  };

  const openDuplicate = (t: ReportTemplate) => {
    setIsDuplicating(true);
    setDuplicateSource(t);
    // Build a fake "new" template pre-filled with source data + " (نسخة)"
    setModalTemplate({
      ...t,
      id: '',                                      // empty id → triggers insert path
      template_name: `${t.template_name} (نسخة)`,
    });
  };

  const closeModal = () => {
    setModalTemplate(null);
    setIsDuplicating(false);
    setDuplicateSource(null);
  };

  // For the modal: if id is empty string it's a duplicate/new insert
  const modalEditTemplate: ReportTemplate | null =
    modalTemplate === 'new' || modalTemplate === null
      ? null
      : (modalTemplate as ReportTemplate).id === ''
      ? null
      : (modalTemplate as ReportTemplate);

  // Pre-fill for duplicate: pass the modified template object (no id) as the source
  const modalSourceForDuplicate: ReportTemplate | null =
    isDuplicating && modalTemplate !== null && modalTemplate !== 'new'
      ? (modalTemplate as ReportTemplate)
      : null;

  // The modal receives editTemplate:
  //   - null → new blank form
  //   - ReportTemplate with real id → edit existing
  // For duplicate: we pass null but we need to pre-fill form — handled inside modal via a separate prop approach
  // Simplest: pass a specialised prop for duplicate pre-fill
  const modalOpen = modalTemplate !== null;

  return (
    <AdminLayout title="قوالب التقارير" subtitle="قوالب جاهزة لتقارير التشريح">
      <AnimatePresence>
        {modalOpen && (
          <TemplateDupeAwareModal
            editTemplate={modalEditTemplate}
            duplicateFrom={modalSourceForDuplicate}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161d27] border border-white/6 rounded-lg">
          <span className="text-[10px] uppercase tracking-wider text-white/30 font-arabic">
            إجمالي القوالب
          </span>
          <span className="text-sm font-semibold text-white tabular-nums">{totalTemplates}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161d27] border border-white/6 rounded-lg">
          <span className="text-[10px] uppercase tracking-wider text-white/30 font-arabic">
            النشطة
          </span>
          <span className="text-sm font-semibold text-recovery tabular-nums">{activeTemplates}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161d27] border border-white/6 rounded-lg">
          <span className="text-[10px] uppercase tracking-wider text-white/30 font-arabic">
            الفئات
          </span>
          <span className="text-sm font-semibold text-white tabular-nums">{categoriesCount}</span>
        </div>

        <div className="flex-1" />

        {/* Add button */}
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-ember/10 hover:bg-ember/15 text-ember border border-ember/20 rounded-lg text-sm font-arabic transition-colors"
        >
          <Plus className="size-4" />
          إضافة قالب
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-[11px] font-arabic transition-colors border',
            activeFilter === 'ALL'
              ? 'bg-white/10 border-white/15 text-white/80'
              : 'bg-transparent border-white/6 text-white/35 hover:text-white/60 hover:bg-white/5'
          )}
        >
          الكل
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-arabic transition-colors border',
              activeFilter === cat
                ? 'bg-white/10 border-white/15 text-white/80'
                : 'bg-transparent border-white/6 text-white/35 hover:text-white/60 hover:bg-white/5'
            )}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-[#161d27] border border-white/6 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="py-20 text-center">
          <FileText className="size-10 text-white/8 mx-auto mb-4" />
          <p className="text-white/30 text-sm font-arabic">لا توجد قوالب بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={i}
              onEdit={openEdit}
              onDuplicate={openDuplicate}
              archivingId={archivingId}
              onArchiveRequest={(id) => setArchivingId(id)}
              onArchiveCancel={() => setArchivingId(null)}
              onArchiveConfirm={(id) => archiveMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// ── Dupe-aware modal wrapper ───────────────────────────────────────────────────
// Handles both edit (real id) and duplicate/new (no id, pre-filled form)

function TemplateDupeAwareModal({
  editTemplate,
  duplicateFrom,
  onClose,
}: {
  editTemplate: ReportTemplate | null;
  duplicateFrom: ReportTemplate | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const initialForm: FormState = editTemplate
    ? {
        template_name: editTemplate.template_name,
        category: editTemplate.category,
        title: editTemplate.title,
        summary: editTemplate.summary ?? '',
        recommendations: editTemplate.recommendations ?? '',
        active: editTemplate.active,
      }
    : duplicateFrom
    ? {
        template_name: `${duplicateFrom.template_name} (نسخة)`,
        category: duplicateFrom.category,
        title: duplicateFrom.title,
        summary: duplicateFrom.summary ?? '',
        recommendations: duplicateFrom.recommendations ?? '',
        active: duplicateFrom.active,
      }
    : DEFAULT_FORM;

  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const isEditing = editTemplate !== null;
  const modalTitle = isEditing
    ? 'تعديل القالب'
    : duplicateFrom
    ? 'تكرار القالب'
    : 'إضافة قالب جديد';

  const handleSave = async () => {
    if (!form.template_name.trim()) { setErr('اسم القالب مطلوب'); return; }
    if (!form.title.trim()) { setErr('العنوان مطلوب'); return; }
    setSaving(true);
    setErr('');
    try {
      const payload: Record<string, unknown> = {
        template_name: form.template_name.trim(),
        category: form.category,
        title: form.title.trim(),
        summary: form.summary || null,
        recommendations: form.recommendations || null,
        active: form.active,
      };

      if (isEditing) {
        payload.updated_at = new Date().toISOString();
        const { error } = await (supabase as any)
          .from('report_templates')
          .update(payload)
          .eq('id', editTemplate.id);
        if (error) throw error;
      } else {
        payload.use_count = 0;
        payload.tags = [];
        const { error } = await (supabase as any)
          .from('report_templates')
          .insert(payload);
        if (error) throw error;
      }

      qc.invalidateQueries({ queryKey: ['admin', 'report-templates'] });
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
            <h3 className="text-white font-semibold font-arabic">{modalTitle}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/8 transition-colors"
            >
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

            {/* template_name */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                اسم القالب *
              </label>
              <input
                value={form.template_name}
                onChange={set('template_name')}
                dir="rtl"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors font-arabic"
              />
            </div>

            {/* category */}
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
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            {/* title */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                العنوان *
              </label>
              <input
                value={form.title}
                onChange={set('title')}
                dir="rtl"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors font-arabic"
              />
            </div>

            {/* summary */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                الملخص
              </label>
              <textarea
                value={form.summary}
                onChange={set('summary')}
                rows={4}
                dir="rtl"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors resize-none font-arabic"
              />
            </div>

            {/* recommendations */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/30 mb-1.5 font-arabic">
                التوصيات
              </label>
              <textarea
                value={form.recommendations}
                onChange={set('recommendations')}
                rows={8}
                dir="rtl"
                className="w-full bg-[#161d27] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-white/25 transition-colors resize-none font-arabic"
              />
              <p className="text-[9px] text-white/20 mt-1 font-arabic">كل توصية في سطر منفصل</p>
            </div>

            {/* active toggle */}
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
                    'absolute top-0.5 w-4 h-4 bg-[#fff] rounded-full shadow transition-transform',
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
