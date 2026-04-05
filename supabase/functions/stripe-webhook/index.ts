import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const stripeWebhookSecretConnect =
  Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT") ?? "";

function toUint8Array(input: string) {
  return new TextEncoder().encode(input);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function computeSignature(secret: string, payload: string, timestamp: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    toUint8Array(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedPayload = `${timestamp}.${payload}`;
  const signature = await crypto.subtle.sign("HMAC", key, toUint8Array(signedPayload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string
) {
  const items = signatureHeader.split(",");
  const timestamp = items
    .find((item) => item.startsWith("t="))
    ?.split("=")[1];
  const signatures = items
    .filter((item) => item.startsWith("v1="))
    .map((item) => item.split("=")[1]);
  if (!timestamp || signatures.length === 0) return false;
  const expected = await computeSignature(secret, payload, timestamp);
  return signatures.some((sig) => timingSafeEqual(sig, expected));
}

serve(async (req) => {
  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey || !stripeWebhookSecret) {
    return new Response("Missing secrets", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let verified = false;
  if (stripeWebhookSecret) {
    verified = await verifyStripeSignature(body, signature, stripeWebhookSecret);
  }
  if (!verified && stripeWebhookSecretConnect) {
    verified = await verifyStripeSignature(body, signature, stripeWebhookSecretConnect);
  }
  if (!verified) {
    return new Response("Webhook Error: invalid signature", { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Webhook Error: invalid payload", { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (event.type === "account.updated") {
    const account = event.data.object;
    if (account?.id) {
      await adminClient
        .from("hosts")
        .update({
          stripe_charges_enabled: account.charges_enabled ?? false,
          stripe_payouts_enabled: account.payouts_enabled ?? false,
          stripe_details_submitted: account.details_submitted ?? false,
          stripe_onboarding_complete:
            Boolean(account.charges_enabled) && Boolean(account.payouts_enabled),
          stripe_onboarding_at: new Date().toISOString(),
        })
        .eq("stripe_account_id", account.id);
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    if (intent?.id) {
      await adminClient
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("payment_intent_id", intent.id);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    if (intent?.id) {
      await adminClient
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("payment_intent_id", intent.id);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
