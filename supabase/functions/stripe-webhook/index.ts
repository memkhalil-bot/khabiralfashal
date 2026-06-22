// stripe-webhook
//
// Receives Stripe webhook events and is the *only* place that ever marks an
// invoice/payment "paid". Nothing else in the codebase — not the frontend,
// not create-checkout-session, not a success-page redirect — is trusted to
// do that. Stripe is the source of truth; this function just mirrors it.
//
// Security model:
//   - verify_jwt is OFF for this function (see supabase/config.toml) because
//     Stripe never sends a Supabase auth token. Authenticity instead comes
//     entirely from verifying the `Stripe-Signature` header against the raw
//     request body using STRIPE_WEBHOOK_SECRET — any request that fails
//     that check is rejected before any code below runs.
//   - All DB writes use the service-role key, created fresh inside this
//     function. There is no caller identity to scope a client to.

import Stripe from "npm:stripe@17.7.0";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.49.4";

// Explicit alias instead of `ReturnType<typeof createClient>` — the latter's
// generic defaults aren't stable across separate call sites, which `deno
// check` flags as mismatched types once the client is passed into helpers.
type AdminClient = SupabaseClient<any, any, any>;

// The only source tables an invoice/payment is ever allowed to point at —
// mirrors the CHECK constraint on invoices.source_table. Anything else is
// ignored rather than written to, even though it could only ever come from
// our own previously-validated metadata.
const SUPPORTED_SOURCE_TABLES = new Set([
  "booking_requests",
  "report_requests",
  "fail_kit_requests",
  "advisory_sessions",
]);

// Invoice statuses that are still "in flight" — only from these states can
// an expired/failed event move the invoice forward. A `paid` invoice (or one
// already `cancelled`/`failed`) is never touched by a later/retried event.
const STILL_PENDING = "payment_pending";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toAmount(stripeMinorUnits: number | null | undefined): number {
  return Math.round(((stripeMinorUnits ?? 0) / 100) * 100) / 100;
}

function piId(pi: string | Stripe.PaymentIntent | null | undefined): string | null {
  if (!pi) return null;
  return typeof pi === "string" ? pi : pi.id;
}

async function alreadyProcessed(adminClient: AdminClient, eventId: string): Promise<boolean> {
  const { data } = await adminClient
    .from("payments")
    .select("id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();
  return !!data;
}

// Inserts a payments row. If a concurrent retry already inserted the same
// stripe_event_id (unique constraint, 23505), that's treated as success —
// the event was already recorded, not an error.
async function insertPaymentRecord(
  adminClient: AdminClient,
  row: Record<string, unknown>,
): Promise<void> {
  const { error } = await adminClient.from("payments").insert(row);
  if (error && (error as { code?: string }).code !== "23505") {
    console.error("Failed to insert payment record:", error.message);
  }
}

async function mirrorPaymentStatusPaid(
  adminClient: AdminClient,
  sourceTable: unknown,
  sourceId: unknown,
): Promise<void> {
  if (typeof sourceTable !== "string" || typeof sourceId !== "string" || !SUPPORTED_SOURCE_TABLES.has(sourceTable)) {
    console.warn("Skipping payment_status mirror — unsupported or missing source_table:", sourceTable);
    return;
  }
  const { error } = await adminClient.from(sourceTable).update({ payment_status: "paid" }).eq("id", sourceId);
  if (error) {
    console.error(`Failed to mirror payment_status onto ${sourceTable}:`, error.message);
  }
}

// ── Event handlers ────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  adminClient: AdminClient,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const invoiceId = metadata.invoice_id;

  if (!invoiceId) {
    console.warn("checkout.session.completed without invoice_id metadata — ignoring", session.id);
    return;
  }

  if (await alreadyProcessed(adminClient, event.id)) {
    console.log("Event already processed, skipping:", event.id);
    return;
  }

  const { data: invoice, error: invoiceError } = await adminClient
    .from("invoices")
    .select("id, source_table, source_id, currency")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    console.error("checkout.session.completed: invoice not found for invoice_id", invoiceId);
    return;
  }

  const paymentIntentId = piId(session.payment_intent);
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const paidAt = new Date().toISOString();

  // A Checkout Session in one-time "payment" mode doesn't generate a Stripe
  // Invoice object unless invoice_creation was explicitly enabled at session
  // creation time (it wasn't, in PR2) — these stay null in that case.
  let stripeInvoiceId: string | null = null;
  let stripeInvoiceUrl: string | null = null;
  let stripeInvoicePdf: string | null = null;
  const sessionInvoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  if (sessionInvoiceId) {
    try {
      const stripeInvoice = await stripe.invoices.retrieve(sessionInvoiceId);
      stripeInvoiceId = stripeInvoice.id ?? null;
      stripeInvoiceUrl = stripeInvoice.hosted_invoice_url ?? null;
      stripeInvoicePdf = stripeInvoice.invoice_pdf ?? null;
    } catch (err) {
      console.error("Failed to retrieve Stripe invoice for", sessionInvoiceId, err);
    }
  }

  const { error: updateError } = await adminClient
    .from("invoices")
    .update({
      status: "paid",
      paid_at: paidAt,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      ...(stripeInvoiceId ? { stripe_invoice_id: stripeInvoiceId } : {}),
      ...(stripeInvoiceUrl ? { stripe_invoice_url: stripeInvoiceUrl } : {}),
      ...(stripeInvoicePdf ? { stripe_invoice_pdf: stripeInvoicePdf } : {}),
    })
    .eq("id", invoice.id);

  if (updateError) {
    console.error("Failed to mark invoice paid:", updateError.message);
    return;
  }

  await insertPaymentRecord(adminClient, {
    invoice_id: invoice.id,
    source_table: invoice.source_table,
    source_id: invoice.source_id,
    amount: toAmount(session.amount_total),
    currency: (session.currency ?? invoice.currency ?? "usd").toLowerCase(),
    status: "succeeded",
    provider: "stripe",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    stripe_customer_id: customerId,
    stripe_event_id: event.id,
    paid_at: paidAt,
    raw_event: event,
  });

  await mirrorPaymentStatusPaid(adminClient, invoice.source_table, invoice.source_id);
}

async function handleCheckoutExpired(
  adminClient: AdminClient,
  event: Stripe.Event,
): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) return;

  // The .eq("status", STILL_PENDING) guard makes this atomic: a `paid`
  // invoice (or one already cancelled/failed) is never touched, regardless
  // of event ordering or retries.
  const { error } = await adminClient
    .from("invoices")
    .update({ status: "cancelled" })
    .eq("id", invoiceId)
    .eq("status", STILL_PENDING);

  if (error) {
    console.error("Failed to mark invoice cancelled on checkout expiry:", error.message);
  }
}

async function handlePaymentIntentFailed(
  adminClient: AdminClient,
  event: Stripe.Event,
): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent;
  const invoiceId = pi.metadata?.invoice_id;
  if (!invoiceId) {
    console.warn("payment_intent.payment_failed without invoice_id metadata — ignoring", pi.id);
    return;
  }

  if (await alreadyProcessed(adminClient, event.id)) {
    console.log("Event already processed, skipping:", event.id);
    return;
  }

  const { data: invoice } = await adminClient
    .from("invoices")
    .select("id, source_table, source_id, currency, stripe_checkout_session_id")
    .eq("id", invoiceId)
    .maybeSingle();

  if (!invoice) {
    console.error("payment_intent.payment_failed: invoice not found for invoice_id", invoiceId);
    return;
  }

  // Same atomic guard as the expiry handler — never overwrites `paid`.
  const { error: updateError } = await adminClient
    .from("invoices")
    .update({ status: "failed" })
    .eq("id", invoice.id)
    .eq("status", STILL_PENDING);

  if (updateError) {
    console.error("Failed to mark invoice failed:", updateError.message);
  }

  await insertPaymentRecord(adminClient, {
    invoice_id: invoice.id,
    source_table: invoice.source_table,
    source_id: invoice.source_id,
    amount: toAmount(pi.amount),
    currency: (pi.currency ?? invoice.currency ?? "usd").toLowerCase(),
    status: "failed",
    provider: "stripe",
    stripe_checkout_session_id: invoice.stripe_checkout_session_id,
    stripe_payment_intent_id: pi.id,
    stripe_customer_id: typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null,
    stripe_event_id: event.id,
    raw_event: event,
  });
}

// ── Entry point ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("stripe-webhook is missing required environment configuration");
    return json({ error: "Webhook is not configured on this environment" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return json({ error: "Missing Stripe-Signature header" }, 400);
  }

  // Signature verification needs the exact raw bytes Stripe signed — this
  // must happen before any JSON parsing.
  const rawBody = await req.text();

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

  let event: Stripe.Event;
  try {
    // constructEventAsync (not the sync constructEvent) — Deno's runtime
    // doesn't have Node's synchronous crypto APIs the sync verifier needs.
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return json({ error: "Invalid signature" }, 400);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(adminClient, stripe, event);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(adminClient, event);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(adminClient, event);
        break;
      default:
        // Unhandled event types are acknowledged, not errored — Stripe
        // would otherwise keep retrying delivery indefinitely.
        console.log("Ignoring unhandled event type:", event.type);
    }
  } catch (err) {
    // Even on an internal error we've already verified the signature; log
    // for investigation but don't leak internals back to Stripe.
    console.error(`Error handling event ${event.type} (${event.id}):`, err);
    return json({ error: "Internal error processing webhook event" }, 500);
  }

  return json({ received: true }, 200);
});
