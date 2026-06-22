-- ============================================================
-- invoices.stripe_checkout_url — PR2
--
-- invoices already stored stripe_invoice_url / stripe_invoice_pdf
-- (for a future Stripe-hosted Invoice object) but had nowhere to
-- keep the Checkout Session URL returned when an admin generates a
-- payment link. Minimal, additive column only — no other schema
-- changes.
-- ============================================================

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS stripe_checkout_url text;
