import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type InvoiceSourceTable =
  | 'booking_requests'
  | 'report_requests'
  | 'fail_kit_requests'
  | 'advisory_sessions';

// Invoice statuses that count as a "live" invoice for a given source record.
// Equivalent to "status NOT IN ('cancelled', 'refunded')" — a cancelled or
// refunded invoice is final and never blocks creating a fresh one for the
// same request.
const LIVE_INVOICE_STATUSES = ['draft', 'payment_pending', 'paid', 'failed'];

export interface CreateInvoiceInput {
  sourceTable: InvoiceSourceTable;
  sourceId: string;
  customerName: string;
  customerEmail: string;
  company?: string | null;
  serviceType: string;
  originalAmount?: number | null;
  discountAmount?: number | null;
  finalAmount: number | null | undefined;
  promoCode?: string | null;
}

export interface CreateInvoiceResult {
  invoiceId: string;
  isExisting: boolean;
}

// Thrown instead of inserting when the source record has no reliable final
// amount — callers should render this as an admin warning, not a failure,
// per "do not invent prices".
export class InvoicePriceUnavailableError extends Error {
  constructor() {
    super('Final amount is not available for this request');
    this.name = 'InvoicePriceUnavailableError';
  }
}

export function useCreateInvoice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput): Promise<CreateInvoiceResult> => {
      const { data: existing, error: lookupError } = await (supabase as any)
        .from('invoices')
        .select('id')
        .eq('source_table', input.sourceTable)
        .eq('source_id', input.sourceId)
        .in('status', LIVE_INVOICE_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (existing) return { invoiceId: existing.id, isExisting: true };

      if (input.finalAmount == null) {
        throw new InvoicePriceUnavailableError();
      }

      const { data: created, error: insertError } = await (supabase as any)
        .from('invoices')
        .insert({
          source_table:    input.sourceTable,
          source_id:       input.sourceId,
          customer_name:   input.customerName,
          customer_email:  input.customerEmail,
          company:         input.company || null,
          service_type:    input.serviceType,
          original_amount: input.originalAmount ?? input.finalAmount,
          discount_amount: input.discountAmount ?? 0,
          final_amount:    input.finalAmount,
          promo_code:      input.promoCode || null,
          status:          'draft',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      return { invoiceId: created.id, isExisting: false };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'invoices'] }),
  });
}
