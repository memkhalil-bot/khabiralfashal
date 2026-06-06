import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { Check, Copy, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  key: string;
  name: string;
  trigger: string;
  subjectAr: string;
  subjectEn: string;
  body: string;
  dotColor: string;
}

// ── Template data ─────────────────────────────────────────────────────────────

const TEMPLATES: EmailTemplate[] = [
  {
    key: 'valleyStarted',
    name: 'بداية تشخيص الوادي',
    trigger: 'المستخدم بدأ تشخيص الوادي',
    subjectAr: 'بدأت رحلتك في وادي الموت',
    subjectEn: 'Your Death Valley Journey Has Begun',
    body: `Hi [الاسم]،

شكراً على بدء التشخيص. خذ وقتك في الإجابة بصدق — النتائج ستكون أمينة معك.`,
    dotColor: 'bg-sky-400',
  },
  {
    key: 'valleyCompleted',
    name: 'اكتمال تشخيص الوادي',
    trigger: 'أكمل التشخيص وحصل على النتيجة',
    subjectAr: 'تقريرك الشخصي جاهز — نتائج وادي الموت',
    subjectEn: 'Your Personal Report Is Ready — Death Valley Results',
    body: `[الاسم]،

لقد أكملت التشخيص. نتيجتك مرفقة.

يمكنك طلب تقرير تفصيلي أو جلسة إرشادية.`,
    dotColor: 'bg-emerald-400',
  },
  {
    key: 'reportRequested',
    name: 'طلب تقرير التشريح',
    trigger: 'طلب تقرير تشريح',
    subjectAr: 'استلمنا طلب تقريرك — سنراسلك قريباً',
    subjectEn: 'We Received Your Report Request — We\'ll Follow Up Soon',
    body: `[الاسم]،

استلمنا طلبك. سيتم مراجعته خلال 48 ساعة وسنتواصل معك.`,
    dotColor: 'bg-amber-400',
  },
  {
    key: 'reportUnderReview',
    name: 'التقرير قيد المراجعة',
    trigger: 'التقرير قيد المراجعة',
    subjectAr: 'تقريرك قيد المراجعة الآن',
    subjectEn: 'Your Report Is Now Under Review',
    body: `[الاسم]،

فريقنا يعمل على تقريرك حالياً. سنبلغك حين يكون جاهزاً.`,
    dotColor: 'bg-violet-400',
  },
  {
    key: 'reportApproved',
    name: 'الموافقة على التقرير',
    trigger: 'تمت الموافقة على التقرير',
    subjectAr: 'تمت الموافقة على تقريرك',
    subjectEn: 'Your Report Has Been Approved',
    body: `[الاسم]،

تمت مراجعة طلبك والموافقة عليه. سيصلك التقرير قريباً.`,
    dotColor: 'bg-recovery',
  },
  {
    key: 'reportScheduled',
    name: 'جدولة إرسال التقرير',
    trigger: 'تم جدولة إرسال التقرير',
    subjectAr: 'تقريرك مجدول للإرسال',
    subjectEn: 'Your Report Is Scheduled for Delivery',
    body: `[الاسم]،

تقريرك مجدول وسيصلك في الموعد المحدد.`,
    dotColor: 'bg-sky-400',
  },
  {
    key: 'reportSent',
    name: 'إرسال التقرير',
    trigger: 'تم إرسال التقرير',
    subjectAr: 'تقريرك أُرسل الآن',
    subjectEn: 'Your Report Has Been Sent',
    body: `[الاسم]،

تم إرسال تقريرك. نتمنى أن يكون مفيداً لك في رحلتك.`,
    dotColor: 'bg-ember',
  },
  {
    key: 'bookingReceived',
    name: 'استلام طلب الحجز',
    trigger: 'استلام طلب الحجز',
    subjectAr: 'استلمنا طلب جلستك',
    subjectEn: 'We Received Your Session Request',
    body: `[الاسم]،

استلمنا طلب جلستك بنجاح. سنراجعه ونتواصل معك لتأكيد الموعد.`,
    dotColor: 'bg-amber-400',
  },
  {
    key: 'sessionConfirmed',
    name: 'تأكيد الجلسة',
    trigger: 'تأكيد الجلسة',
    subjectAr: 'تم تأكيد جلستك مع خبير الفشل',
    subjectEn: 'Your Session with the Failure Expert Is Confirmed',
    body: `[الاسم]،

جلستك مؤكدة. [تفاصيل الموعد والرابط].`,
    dotColor: 'bg-recovery',
  },
];

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  index,
}: {
  template: EmailTemplate;
  index: number;
}) {
  const [copied, setCopied] = useState(false);

  const fullText = `الموضوع: ${template.subjectAr}\nSubject: ${template.subjectEn}\n\n${template.body}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-[#161d27] border border-white/6 rounded-xl p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <span className={cn('mt-1.5 size-2 rounded-full shrink-0', template.dotColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85 font-arabic leading-snug">
            {template.name}
          </p>
          <p className="text-[11px] text-amber-400/70 font-arabic mt-0.5">
            <span className="text-white/25 ml-1">متى يُرسل:</span>
            {template.trigger}
          </p>
        </div>
      </div>

      {/* Subject badge */}
      <div className="space-y-1.5">
        <p className="text-[10px] tracking-[0.15em] uppercase text-white/20 font-arabic">
          الموضوع
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/8 rounded-full text-[11px] text-white/60 font-arabic">
            <Mail className="size-2.5 text-white/25 shrink-0" />
            {template.subjectAr}
          </span>
        </div>
        <p className="text-[11px] text-white/25 font-mono">{template.subjectEn}</p>
      </div>

      {/* Body preview */}
      <div className="flex-1">
        <p className="text-[10px] tracking-[0.15em] uppercase text-white/20 font-arabic mb-1.5">
          نص الرسالة
        </p>
        <pre
          dir="rtl"
          className="text-[12px] leading-relaxed text-white/55 font-arabic whitespace-pre-wrap bg-[#0a0d14] border border-white/5 rounded-lg px-3.5 py-3"
          style={{ fontFamily: 'inherit' }}
        >
          {template.body}
        </pre>
      </div>

      {/* Copy button */}
      <div className="flex justify-end">
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-arabic transition-all duration-150',
            copied
              ? 'bg-recovery/10 text-recovery border border-recovery/20'
              : 'bg-white/4 hover:bg-white/8 text-white/40 hover:text-white/70 border border-white/8'
          )}
        >
          {copied ? (
            <>
              <Check className="size-3" />
              تم النسخ
            </>
          ) : (
            <>
              <Copy className="size-3" />
              نسخ
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AdminEmailTemplates() {
  return (
    <AdminLayout
      title="قوالب البريد الإلكتروني"
      subtitle="للنسخ اليدوي — لا إرسال حقيقي"
    >
      {/* Info banner */}
      <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-amber-950/20 border border-amber-800/20 rounded-xl">
        <Mail className="size-4 text-amber-400/60 shrink-0" />
        <p className="text-xs text-amber-400/70 font-arabic">
          هذه القوالب للرجوع إليها يدوياً. لا يتم الإرسال التلقائي من هذه الصفحة.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATES.map((template, i) => (
          <TemplateCard key={template.key} template={template} index={i} />
        ))}
      </div>
    </AdminLayout>
  );
}
