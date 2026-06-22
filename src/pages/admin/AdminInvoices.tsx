import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/hooks/useAdminLanguage';
import { KpiGrid, type KpiDef } from '@/components/admin/KpiCard';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Receipt, Search, X, ChevronDown, FileText, User, Mail, Building2,
  Tag, Calendar, Clock, DollarSign, ExternalLink, Sparkles, Hash,
  CheckCircle2, RotateCcw, Wallet, Link2, Copy, Loader2, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type InvoiceStatus = 'draft' | 'payment_pending' | 'paid' | 'cancelled' | 'failed' | 'refunded';
const STATUS_KEYS: InvoiceStatus[] = ['draft', 'payment_pending', 'paid', 'cancelled', 'failed', 'refunded'];

interface Invoice {
  id: string;
  invoice_number: string;
  source_table: string;
  source_id: string;
  customer_name: string;
  customer_email: string;
  company: string | null;
  service_type: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  currency: string;
  promo_code: string | null;
  status: InvoiceStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_invoice_url: string | null;
  stripe_invoice_pdf: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  draft:           'bg-white/5 text-white/40 border-white/10',
  payment_pending: 'bg-sky-950/30 text-sky-400 border-sky-800/30',
  paid:            'bg-recovery/10 text-recovery border-recovery/25',
  cancelled:       'bg-white/5 text-white/35 border-white/10',
  failed:          'bg-crimson/10 text-crimson border-crimson/25',
  refunded:        'bg-amber-950/30 text-amber-400 border-amber-800/30',
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t: adminT } = useAdminLanguage();
  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium border font-arabic whitespace-nowrap',
      STATUS_BADGE_CLASSES[status]
    )}>
      {adminT.invoices.status[status] ?? status}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmount(amount: number | null | undefined, currency: string): string {
  if (amount == null) return '—';
  return `${amount.toLocaleString()} ${currency.toUpperCase()}`;
}

function serviceLabel(serviceType: string, adminT: ReturnType<typeof useAdminLanguage>['t']): string {
  return adminT.promoCodes.services[serviceType] ?? serviceType;
}

function sourceLabel(sourceTable: string, adminT: ReturnType<typeof useAdminLanguage>['t']): string {
  return adminT.invoices.sourceTables[sourceTable] ?? sourceTable;
}

// ── Query ─────────────────────────────────────────────────────────────────────

function useInvoices() {
  return useQuery({
    queryKey: ['admin', 'invoices'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
    staleTime: 30_000,
  });
}

// ── Payment link creation ────────────────────────────────────────────────────
//
// Statuses for which an admin may (re)generate a Stripe Checkout link.
// Paid/cancelled/refunded invoices are final and never get a new link.
const CAN_CREATE_LINK_STATUSES = new Set<InvoiceStatus>(['draft', 'payment_pending', 'failed']);

interface CreateCheckoutSessionResult {
  checkout_url: string;
  checkout_session_id: string;
}

function useCreateCheckoutSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string): Promise<CreateCheckoutSessionResult> => {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { invoice_id: invoiceId },
      });
      if (error) throw error;
      if (!data?.checkout_url) throw new Error('No checkout URL returned');
      return data as CreateCheckoutSessionResult;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'invoices'] }),
  });
}

// ── Payment record (read-only mirror of the latest `payments` row) ──────────
//
// Written exclusively by the stripe-webhook Edge Function — this query only
// ever reads it back for display, never writes.
interface PaymentRecord {
  provider: string;
  status: string;
  stripe_event_id: string | null;
  paid_at: string | null;
}

function usePaymentRecord(invoiceId: string) {
  return useQuery({
    queryKey: ['admin', 'invoice-payment-record', invoiceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('payments')
        .select('provider, status, stripe_event_id, paid_at')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as PaymentRecord | null;
    },
    staleTime: 30_000,
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────

interface InvoiceSummary {
  total: number;
  paidCount: number;
  pendingCount: number;
  paidRevenue: number;
  pendingRevenue: number;
}

function computeSummary(invoices: Invoice[]): InvoiceSummary {
  const paid = invoices.filter((i) => i.status === 'paid');
  const pending = invoices.filter((i) => i.status === 'payment_pending');
  return {
    total: invoices.length,
    paidCount: paid.length,
    pendingCount: pending.length,
    paidRevenue: paid.reduce((acc, i) => acc + (i.final_amount ?? 0), 0),
    pendingRevenue: pending.reduce((acc, i) => acc + (i.final_amount ?? 0), 0),
  };
}

function SummarySection({ summary, loading }: { summary: InvoiceSummary | undefined; loading: boolean }) {
  const { t: adminT } = useAdminLanguage();
  const iv = adminT.invoices.summary;

  const kpis: KpiDef[] = [
    { label: iv.total,          value: summary?.total,          icon: Receipt,      accent: 'text-admin-accent' },
    { label: iv.paidCount,      value: summary?.paidCount,      icon: CheckCircle2, accent: 'text-recovery' },
    { label: iv.pendingCount,   value: summary?.pendingCount,   icon: Clock,        accent: 'text-sky-400' },
    { label: iv.paidRevenue,    value: summary?.paidRevenue,    icon: DollarSign,   accent: 'text-recovery',  isCurrency: true },
    { label: iv.pendingRevenue, value: summary?.pendingRevenue, icon: Wallet,       accent: 'text-amber-400', isCurrency: true },
  ];

  return (
    <KpiGrid
      title={iv.title}
      titleIcon={Receipt}
      kpis={kpis}
      loading={loading}
      placeholderHint={adminT.common.awaitingData}
      columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-5"
    />
  );
}

// ── Filters ───────────────────────────────────────────────────────────────────

interface FilterState {
  status: InvoiceStatus | 'all';
}

const DEFAULT_FILTERS: FilterState = { status: 'all' };

function FiltersBar({ filters, onChange, onReset }: {
  filters:  FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onReset:  () => void;
}) {
  const { t: adminT } = useAdminLanguage();
  const fl = adminT.invoices.filters;
  const selectCls = 'appearance-none bg-admin-card border border-admin-border rounded-lg ps-3 pe-8 py-2 text-xs text-admin-text focus:outline-none focus:border-white/20 transition-colors font-arabic cursor-pointer';
  const labelCls  = 'block text-[9px] uppercase tracking-wider text-admin-text-muted/60 mb-1.5 font-arabic';

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4 p-4 bg-admin-card/50 border border-admin-border rounded-2xl">
      <div>
        <label className={labelCls}>{fl.status}</label>
        <div className="relative">
          <select value={filters.status} onChange={(e) => onChange({ status: e.target.value as FilterState['status'] })} className={selectCls}>
            <option value="all">{fl.allStatuses}</option>
            {STATUS_KEYS.map((s) => <option key={s} value={s}>{adminT.invoices.status[s]}</option>)}
          </select>
          <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 size-3 text-admin-text-muted/50 pointer-events-none" />
        </div>
      </div>

      {filters.status !== 'all' && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-admin-text-muted hover:text-admin-text border border-admin-border rounded-lg hover:bg-white/4 transition-colors font-arabic"
        >
          <RotateCcw className="size-3" />
          {fl.reset}
        </button>
      )}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────

function InvoiceTable({ rows, onSelect, loading }: {
  rows:     Invoice[];
  onSelect: (invoice: Invoice) => void;
  loading:  boolean;
}) {
  const { t: adminT } = useAdminLanguage();
  const tb = adminT.invoices.table;

  const headers = [tb.invoiceNumber, tb.customer, tb.service, tb.amount, tb.status, tb.source, tb.createdDate, tb.paidDate];

  return (
    <div className="bg-admin-card border border-admin-border rounded-2xl overflow-hidden">
      {loading ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/4 rounded-lg animate-pulse" />)}
        </div>
      ) : !rows.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Receipt className="size-10 text-white/8" />
          <p className="text-admin-text-muted/60 text-sm font-arabic">{adminT.invoices.empty}</p>
          <p className="text-admin-text-muted/40 text-xs font-arabic max-w-sm text-center">{adminT.invoices.emptyHint}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-white/2">
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-start text-[10px] tracking-[0.18em] uppercase text-admin-text-muted/60 font-arabic font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => onSelect(inv)}
                  className="hover:bg-white/2 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono font-bold text-admin-text bg-white/6 px-2 py-0.5 rounded whitespace-nowrap">
                      {inv.invoice_number}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-admin-text text-xs truncate max-w-[180px]">{inv.customer_name}</p>
                    <p className="text-admin-text-muted/60 text-[10px] truncate max-w-[180px]">{inv.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-admin-text-muted font-arabic text-xs whitespace-nowrap">
                      {serviceLabel(inv.service_type, adminT)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-admin-text text-sm font-semibold tabular-nums whitespace-nowrap">
                      {fmtAmount(inv.final_amount, inv.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <span className="text-admin-text-muted/70 text-[11px] font-arabic whitespace-nowrap">
                      {sourceLabel(inv.source_table, adminT)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-admin-text-muted/70 text-xs tabular-nums whitespace-nowrap">
                      {format(new Date(inv.created_at), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-admin-text-muted/70 text-xs tabular-nums whitespace-nowrap">
                      {inv.paid_at ? format(new Date(inv.paid_at), 'MMM d, yyyy') : '—'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Details drawer ────────────────────────────────────────────────────────────

function FieldBlock({ icon: Icon, label, value, mono, placeholder }: {
  icon:  React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  placeholder?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase text-admin-text-muted/60 font-arabic mb-1">
        <Icon className="size-3" /> {label}
      </p>
      <p className={cn(
        'text-sm truncate',
        placeholder ? 'text-admin-text-muted/50 font-arabic' : 'text-admin-text',
        mono && !placeholder && 'font-mono'
      )}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[10px] tracking-[0.22em] uppercase text-admin-text-muted/70 font-arabic mb-3">
      <Icon className="size-3" /> {children}
    </p>
  );
}

function StripeLinkRow({ label, url }: { label: string; url: string | null }) {
  const { t: adminT } = useAdminLanguage();
  if (!url) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-white/4 border border-white/8 rounded-lg">
        <span className="text-[11px] text-admin-text-muted/60 font-arabic">{label}</span>
        <span className="text-[11px] text-admin-text-muted/40 font-arabic">{adminT.invoices.drawer.noStripeLink}</span>
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 p-3 bg-white/4 border border-white/8 rounded-lg hover:bg-white/6 transition-colors"
    >
      <span className="text-[11px] text-admin-text-muted font-arabic">{label}</span>
      <span className="flex items-center gap-1.5 text-[11px] text-sky-400">
        {adminT.invoices.drawer.open} <ExternalLink className="size-3" />
      </span>
    </a>
  );
}

// ── Payment link action (create checkout session via Edge Function) ─────────

function PaymentLinkSection({ invoice }: { invoice: Invoice }) {
  const { t: adminT } = useAdminLanguage();
  const dr = adminT.invoices.drawer;
  const ac = adminT.invoices.actions;
  const [copied, setCopied] = useState(false);

  const { mutate, isPending, error, reset } = useCreateCheckoutSession();

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (invoice.stripe_checkout_url) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-white/4 border border-white/8 rounded-lg">
        <a
          href={invoice.stripe_checkout_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 transition-colors truncate"
        >
          {dr.checkoutUrl} <ExternalLink className="size-3 shrink-0" />
        </a>
        <button
          onClick={() => handleCopy(invoice.stripe_checkout_url!)}
          className="flex items-center gap-1.5 text-[11px] text-admin-text-muted hover:text-admin-text transition-colors shrink-0"
        >
          {copied ? <Check className="size-3 text-recovery" /> : <Copy className="size-3" />}
          {copied ? ac.linkCopied : ac.copyLink}
        </button>
      </div>
    );
  }

  if (!CAN_CREATE_LINK_STATUSES.has(invoice.status)) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-white/4 border border-white/8 rounded-lg">
        <span className="text-[11px] text-admin-text-muted/60 font-arabic">{dr.checkoutUrl}</span>
        <span className="text-[11px] text-admin-text-muted/40 font-arabic">{dr.noStripeLink}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => { reset(); mutate(invoice.id); }}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-ember/10 text-ember border border-ember/25 rounded-lg text-xs font-medium font-arabic hover:bg-ember/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
        {isPending ? ac.creating : ac.createPaymentLink}
      </button>
      {error && (
        <p className="text-[11px] text-crimson font-arabic">{ac.createError}</p>
      )}
    </div>
  );
}

function PaymentRecordSection({ invoiceId }: { invoiceId: string }) {
  const { t: adminT } = useAdminLanguage();
  const dr = adminT.invoices.drawer;
  const { data: record, isLoading } = usePaymentRecord(invoiceId);

  if (isLoading) {
    return <div className="h-16 bg-white/4 rounded-lg animate-pulse" />;
  }

  if (!record) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-white/4 border border-white/8 rounded-lg">
        <span className="text-[11px] text-admin-text-muted/40 font-arabic">{dr.noPaymentRecord}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FieldBlock icon={Wallet} label={dr.provider} value={record.provider} />
      <FieldBlock icon={CheckCircle2} label={dr.paymentStatus} value={record.status} />
      <FieldBlock icon={Hash} label={dr.eventId} value={record.stripe_event_id || dr.notAvailable} placeholder={!record.stripe_event_id} mono={!!record.stripe_event_id} />
      <FieldBlock
        icon={Clock}
        label={dr.paidAt}
        value={record.paid_at ? format(new Date(record.paid_at), 'MMM d, yyyy · HH:mm') : dr.notPaidYet}
        placeholder={!record.paid_at}
        mono={!!record.paid_at}
      />
    </div>
  );
}

function InvoiceDetailsDrawer({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { t: adminT } = useAdminLanguage();
  const dr = adminT.invoices.drawer;
  const ac = adminT.invoices.actions;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-20" />
      <motion.div
        key={invoice.id}
        initial={{ x: 460 }}
        animate={{ x: 0 }}
        exit={{ x: 460 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed end-0 top-0 bottom-0 w-[460px] z-30 bg-admin-card border-s border-admin-border overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-border sticky top-0 bg-admin-card z-10">
          <code className="text-base font-mono font-bold text-admin-text bg-white/6 px-2.5 py-1 rounded truncate">
            {invoice.invoice_number}
          </code>
          <button onClick={onClose} className="size-8 flex items-center justify-center text-admin-text-muted/60 hover:text-admin-text transition-colors rounded-lg hover:bg-white/5 shrink-0">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + amount */}
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            <span className="text-lg font-semibold text-ember">{fmtAmount(invoice.final_amount, invoice.currency)}</span>
          </div>

          {/* Customer */}
          <div>
            <SectionLabel icon={User}>{dr.customer}</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <FieldBlock icon={User} label={dr.name} value={invoice.customer_name} />
              <FieldBlock icon={Mail} label={dr.email} value={invoice.customer_email} mono />
              <FieldBlock icon={Building2} label={dr.company} value={invoice.company || dr.noCompany} placeholder={!invoice.company} />
              <FieldBlock icon={Tag} label={dr.service} value={serviceLabel(invoice.service_type, adminT)} />
            </div>
          </div>

          {/* Source reference */}
          <div>
            <SectionLabel icon={Hash}>{dr.sourceReference}</SectionLabel>
            <div className="grid grid-cols-1 gap-4">
              <FieldBlock icon={FileText} label={dr.sourceTable} value={sourceLabel(invoice.source_table, adminT)} />
              <FieldBlock icon={Hash} label={dr.sourceId} value={invoice.source_id} mono />
            </div>
          </div>

          {/* Amounts */}
          <div>
            <SectionLabel icon={DollarSign}>{dr.amounts}</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <FieldBlock icon={DollarSign} label={dr.originalAmount} value={fmtAmount(invoice.original_amount, invoice.currency)} mono />
              <FieldBlock icon={Tag} label={dr.discountAmount} value={fmtAmount(invoice.discount_amount, invoice.currency)} mono />
              <FieldBlock icon={Wallet} label={dr.finalAmount} value={fmtAmount(invoice.final_amount, invoice.currency)} mono />
              <FieldBlock icon={Tag} label={dr.promoCode} value={invoice.promo_code || dr.noPromoCode} placeholder={!invoice.promo_code} mono={!!invoice.promo_code} />
            </div>
          </div>

          {/* Dates */}
          <div>
            <SectionLabel icon={Calendar}>{dr.dates}</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <FieldBlock
                icon={Clock}
                label={dr.createdAt}
                value={format(new Date(invoice.created_at), 'MMM d, yyyy · HH:mm')}
                mono
              />
              <FieldBlock
                icon={CheckCircle2}
                label={dr.paidAt}
                value={invoice.paid_at ? format(new Date(invoice.paid_at), 'MMM d, yyyy · HH:mm') : dr.notPaidYet}
                placeholder={!invoice.paid_at}
                mono={!!invoice.paid_at}
              />
            </div>
          </div>

          {/* Payment link — the only live Stripe action in this dashboard.
              Creating it calls the create-checkout-session Edge Function;
              the invoice is never marked "paid" from here. */}
          <div>
            <SectionLabel icon={Link2}>{ac.createPaymentLink}</SectionLabel>
            <PaymentLinkSection invoice={invoice} />
          </div>

          {/* Stripe references — remaining fields are display-only, no live integration yet */}
          <div>
            <SectionLabel icon={Receipt}>{dr.stripeReferences}</SectionLabel>
            <div className="space-y-3">
              <FieldBlock icon={Hash} label={dr.checkoutSessionId} value={invoice.stripe_checkout_session_id || dr.notAvailable} placeholder={!invoice.stripe_checkout_session_id} mono={!!invoice.stripe_checkout_session_id} />
              <FieldBlock icon={Hash} label={dr.paymentIntentId} value={invoice.stripe_payment_intent_id || dr.notAvailable} placeholder={!invoice.stripe_payment_intent_id} mono={!!invoice.stripe_payment_intent_id} />
              <StripeLinkRow label={dr.invoiceUrl} url={invoice.stripe_invoice_url} />
              <StripeLinkRow label={dr.invoicePdf} url={invoice.stripe_invoice_pdf} />
            </div>
          </div>

          {/* Payment record — written exclusively by the stripe-webhook
              function; this is a read-only mirror, never a write path. */}
          <div>
            <SectionLabel icon={CheckCircle2}>{dr.paymentRecord}</SectionLabel>
            <PaymentRecordSection invoiceId={invoice.id} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminInvoices() {
  const { t: adminT } = useAdminLanguage();
  const { data, isLoading, isError } = useInvoices();
  const invoices = data ?? [];

  const [search, setSearch]       = useState('');
  const [filters, setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('invoice'));

  // Coming from a "Create Invoice" action on a request page (?invoice=<id>)
  // — open that invoice once, then drop the param so it doesn't re-trigger.
  useEffect(() => {
    const fromQuery = searchParams.get('invoice');
    if (fromQuery) {
      setSelectedId(fromQuery);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('invoice');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derived (not a snapshot) so the drawer reflects fresh data — e.g. the
  // status/checkout URL written right after a payment link is created —
  // without needing to manually patch local state.
  const selected = selectedId ? invoices.find((inv) => inv.id === selectedId) ?? null : null;

  const summary = useMemo(() => computeSummary(invoices), [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (filters.status !== 'all' && inv.status !== filters.status) return false;
      if (q) {
        const haystack = `${inv.invoice_number} ${inv.customer_name} ${inv.customer_email} ${inv.company ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, search, filters]);

  return (
    <AdminLayout title={adminT.invoices.title} subtitle={adminT.invoices.subtitle}>
      <AnimatePresence>
        {selected && (
          <InvoiceDetailsDrawer invoice={selected} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>

      {isError && (
        <div className="mb-4 p-3 bg-crimson/10 border border-crimson/20 rounded-lg text-crimson text-sm font-arabic">
          {adminT.invoices.errorHint}
        </div>
      )}

      {/* Summary cards */}
      <SummarySection summary={summary} loading={isLoading} />

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 size-3.5 text-admin-text-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminT.invoices.searchPlaceholder}
            className="w-full bg-admin-card border border-admin-border rounded-lg pe-9 ps-4 py-2.5 text-sm text-admin-text placeholder:text-admin-text-muted/50 font-arabic focus:outline-none focus:border-white/20 transition-colors"
            dir="ltr"
          />
        </div>
      </div>

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {!isLoading && !invoices.length && !isError && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-white/4 border border-white/8 rounded-lg">
          <Sparkles className="size-3.5 text-admin-text-muted/50 shrink-0" />
          <p className="text-[11px] text-admin-text-muted font-arabic leading-snug">{adminT.invoices.emptyHint}</p>
        </div>
      )}

      {/* Table */}
      <InvoiceTable rows={filteredInvoices} onSelect={(inv) => setSelectedId(inv.id)} loading={isLoading} />
    </AdminLayout>
  );
}
