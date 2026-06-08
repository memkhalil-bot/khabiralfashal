import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { FileText, HeartPulse, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

// ── Section shell ─────────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  emptyMessage: string;
  emptyHint: string;
  accentClass: string;
}

function ApprovalSection({ icon, title, subtitle, emptyMessage, emptyHint, accentClass }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#0d0d0d] border border-white/6 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
        <div className={`size-9 flex items-center justify-center rounded-xl ${accentClass}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-medium text-white/80">{title}</h2>
          <p className="text-[11px] text-white/35 mt-0.5">{subtitle}</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] text-white/30 tracking-wide">
            0
          </span>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className={`size-12 flex items-center justify-center rounded-2xl mb-4 ${accentClass} opacity-40`}>
          <Clock className="size-5" />
        </div>
        <p className="text-white/40 text-sm mb-1">{emptyMessage}</p>
        <p className="text-white/20 text-[11px]">{emptyHint}</p>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminApprovals() {
  const { t: adminT } = useAdminLanguage();
  return (
    <AdminLayout
      title={adminT.approvals.title}
      subtitle={adminT.approvals.subtitle}
    >
      {/* Status bar */}
      <div className="flex items-center gap-3 mb-8 p-4 bg-[#0d0d0d] border border-white/5 rounded-xl">
        <CheckCircle2 className="size-4 text-recovery shrink-0" />
        <p className="text-[11px] text-white/40">
          لا توجد طلبات معلقة تتطلب مراجعة في الوقت الحالي
        </p>
        <span className="ms-auto flex items-center gap-1 text-[10px] text-white/20">
          <span className="size-1.5 rounded-full bg-recovery/50 inline-block" />
          محدَّث الآن
        </span>
      </div>

      {/* Approval sections */}
      <div className="space-y-6">
        <ApprovalSection
          icon={<FileText className="size-4 text-ember" />}
          title={adminT.approvals.reportRequests.title}
          subtitle={adminT.approvals.reportRequests.subtitle}
          emptyMessage={adminT.approvals.reportRequests.empty}
          emptyHint={adminT.approvals.reportRequests.emptyHint}
          accentClass="bg-ember/10 border border-ember/15"
        />

        <ApprovalSection
          icon={<HeartPulse className="size-4 text-recovery" />}
          title={adminT.approvals.firstAidRequests.title}
          subtitle={adminT.approvals.firstAidRequests.subtitle}
          emptyMessage={adminT.approvals.firstAidRequests.empty}
          emptyHint={adminT.approvals.firstAidRequests.emptyHint}
          accentClass="bg-recovery/10 border border-recovery/15"
        />
      </div>
    </AdminLayout>
  );
}
