-- ============================================================
-- invoices / payments — Payment & Invoice foundation (PR1)
--
-- Schema-only foundation for the Stripe payment integration.
-- No live Stripe calls happen yet: these tables are written to
-- later by an admin-triggered "create payment link" action (PR2)
-- and by the Stripe webhook (PR3). For now they exist so the
-- admin dashboard has a real (empty) place to read from.
--
-- source_table / source_id mirrors the polymorphic-reference
-- pattern already used by promo_code_redemptions.related_type /
-- related_id, pointing at booking_requests, report_requests,
-- fail_kit_requests, or advisory_sessions.
-- ============================================================

-- Reuse the existing set_updated_at() trigger function (defined in
-- 20260605000000_booking_requests.sql). Create it only if some future
-- environment is missing it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at' AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE FUNCTION public.set_updated_at()
    RETURNS trigger LANGUAGE plpgsql AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$;
  END IF;
END $$;

-- ── invoices ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoices (
  id                        uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number            text          NOT NULL UNIQUE,

  source_table              text          NOT NULL
    CHECK (source_table IN ('booking_requests','report_requests','fail_kit_requests','advisory_sessions')),
  source_id                 uuid          NOT NULL,

  customer_name             text          NOT NULL,
  customer_email            text          NOT NULL,
  company                   text,
  service_type              text          NOT NULL,

  original_amount           numeric(10,2) NOT NULL,
  discount_amount           numeric(10,2) NOT NULL DEFAULT 0,
  final_amount              numeric(10,2) NOT NULL,
  currency                  text          NOT NULL DEFAULT 'usd',
  promo_code                text,

  status                    text          NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','payment_pending','paid','cancelled','failed','refunded')),

  stripe_checkout_session_id text,
  stripe_payment_intent_id   text,
  stripe_invoice_id          text,
  stripe_invoice_url         text,
  stripe_invoice_pdf         text,

  paid_at                   timestamptz,
  created_at                timestamptz   NOT NULL DEFAULT now(),
  updated_at                timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- No anon/public access at all — invoices are only ever written by the
-- server-side checkout/webhook functions (service_role) and read by admins.
CREATE POLICY "Admins can read invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL                            ON public.invoices TO service_role;

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── payments ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payments (
  id                          uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id                  uuid          REFERENCES public.invoices(id) ON DELETE SET NULL,

  source_table                text          NOT NULL
    CHECK (source_table IN ('booking_requests','report_requests','fail_kit_requests','advisory_sessions')),
  source_id                   uuid          NOT NULL,

  amount                      numeric(10,2) NOT NULL,
  currency                    text          NOT NULL DEFAULT 'usd',
  status                      text          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','succeeded','failed','cancelled','refunded')),
  provider                    text          NOT NULL DEFAULT 'stripe',

  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  stripe_customer_id          text,
  stripe_event_id             text          UNIQUE,

  paid_at                     timestamptz,
  raw_event                   jsonb,
  created_at                  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Same access shape as invoices: admin-only. Payments will be written by
-- the Stripe webhook using the service_role key, never by the public client.
CREATE POLICY "Admins can read payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING  (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL                            ON public.payments TO service_role;

-- ── Human-readable invoice numbering: INV-2026-00001, … ──────────────────────

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER invoices_set_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_invoice_number();

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_invoices_source            ON public.invoices(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status            ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at        ON public.invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id        ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_session  ON public.payments(stripe_checkout_session_id);
