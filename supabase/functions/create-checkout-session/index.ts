// create-checkout-session
//
// Admin-only Edge Function. Creates a Stripe Checkout Session (one-time
// payment) for an existing invoice and stores the session id/url on the
// invoice row. The Stripe secret key never leaves this function.
//
// Security model:
//   1. The Supabase platform already rejects requests without a valid JWT
//      (verify_jwt = true in config.toml) — anon callers never reach here.
//   2. We re-verify the caller is specifically an *admin* via the existing
//      is_current_user_admin() RPC, called with the caller's own token —
//      same pattern used by the rest of the admin dashboard.
//   3. Once verified, a service-role client is used to read the invoice
//      (server-side source of truth for amount/currency — the client never
//      submits an amount) and to write the checkout session fields back.
//
// This function never marks an invoice "paid". That only happens later
// (PR3) via the Stripe webhook, driven by Stripe's own event, not by this
// admin-triggered call.

import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Payment links can only be (re)generated for invoices that aren't already
// paid/cancelled/refunded.
const ALLOWED_STATUSES = new Set(["draft", "payment_pending", "failed"]);

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing authorization header" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_CURRENCY_FALLBACK = (Deno.env.get("STRIPE_CURRENCY") ?? "usd").toLowerCase();
  const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") ?? "https://khabiralfashal.com";

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase environment is not configured" }, 500);
  }
  if (!STRIPE_SECRET_KEY) {
    return json({ error: "Stripe is not configured on this environment" }, 500);
  }

  try {
    // ── 1. Verify the caller is an authenticated admin ──────────────────
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "Invalid session" }, 401);
    }

    const { data: isAdmin, error: adminCheckError } = await callerClient.rpc("is_current_user_admin");
    if (adminCheckError || isAdmin !== true) {
      return json({ error: "Admin access required" }, 403);
    }

    // ── 2. Parse + validate request body ─────────────────────────────────
    const body = await req.json().catch(() => null);
    const invoiceId = body?.invoice_id;
    if (!invoiceId || typeof invoiceId !== "string") {
      return json({ error: "invoice_id is required" }, 400);
    }

    // ── 3. Load the invoice with the service-role client. The amount and
    //      currency always come from this row — never from the request. ──
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: invoice, error: invoiceError } = await adminClient
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return json({ error: "Invoice not found" }, 404);
    }

    if (!ALLOWED_STATUSES.has(invoice.status)) {
      return json(
        { error: `Cannot create a payment link for an invoice with status '${invoice.status}'` },
        409,
      );
    }

    const finalAmount = Number(invoice.final_amount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return json({ error: "Invoice has an invalid amount" }, 400);
    }

    const currency = (invoice.currency || STRIPE_CURRENCY_FALLBACK).toLowerCase();
    // Stripe expects amounts in the smallest currency unit (e.g. cents).
    const unitAmount = Math.round(finalAmount * 100);

    // ── 4. Create the Stripe Checkout Session (one-time payment) ─────────
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: invoice.customer_email,
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: `${invoice.service_type} — ${invoice.invoice_number}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        source_table: invoice.source_table,
        source_id: invoice.source_id,
        service_type: invoice.service_type,
        customer_email: invoice.customer_email,
      },
      success_url: `${PUBLIC_SITE_URL}/en/thank-you?invoice=${encodeURIComponent(invoice.invoice_number)}`,
      cancel_url: PUBLIC_SITE_URL,
    });

    // ── 5. Persist the session. Status moves to payment_pending only —
    //      "paid" is decided exclusively by the webhook in PR3. ──────────
    const { error: updateError } = await adminClient
      .from("invoices")
      .update({
        status: "payment_pending",
        stripe_checkout_session_id: session.id,
        stripe_checkout_url: session.url,
      })
      .eq("id", invoice.id);

    if (updateError) {
      return json(
        { error: "Checkout session was created with Stripe but could not be saved to the invoice" },
        500,
      );
    }

    return json({ checkout_url: session.url, checkout_session_id: session.id }, 200);
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return json({ error: "Internal error creating checkout session" }, 500);
  }
});
