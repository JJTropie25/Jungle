import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const platformFeePct = Number(Deno.env.get("PLATFORM_FEE_PERCENT") ?? "20");
const stripeApiVersion = "2023-10-16";

async function stripePost(path: string, params: Record<string, string>) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": stripeApiVersion,
    },
    body: new URLSearchParams(params).toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`stripe_error:${res.status}:${text}`);
  }
  return JSON.parse(text);
}

serve(async (req) => {
  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecretKey) {
      return new Response("Missing Supabase or Stripe secrets", { status: 500 });
    }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

    const { data: authData } = await userClient.auth.getUser();
    const user = authData?.user;
    if (!user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const serviceId = body?.service_id as string | undefined;
    const slotStart = body?.slot_start as string | undefined;
    const slotEnd = body?.slot_end as string | undefined;
    const peopleCount = Number(body?.people_count ?? 1) || 1;
    const currency = (body?.currency ?? "eur") as string;

    if (!serviceId) return new Response("Missing service_id", { status: 400 });

    const { data: service } = await adminClient
      .from("services")
      .select("id, price_eur, host_id")
      .eq("id", serviceId)
      .maybeSingle();
    if (!service) return new Response("Service not found", { status: 404 });

    const { data: host } = await adminClient
      .from("hosts")
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", service.host_id)
      .maybeSingle();
    if (!host?.stripe_account_id) {
      return new Response("Host payments not configured", { status: 400 });
    }
    if (!host.stripe_charges_enabled) {
      return new Response("Host payments not enabled", { status: 400 });
    }

    const amountCents = Math.round(Number(service.price_eur ?? 0) * 100);
    const feePct = Number.isFinite(platformFeePct) ? platformFeePct : 20;
    const platformFee = Math.round(amountCents * (feePct / 100));

    const intent = await stripePost("payment_intents", {
      amount: String(amountCents),
      currency,
      "automatic_payment_methods[enabled]": "true",
      application_fee_amount: String(platformFee),
      "transfer_data[destination]": host.stripe_account_id,
      on_behalf_of: host.stripe_account_id,
      "metadata[service_id]": serviceId,
      "metadata[guest_id]": user.id,
      "metadata[slot_start]": slotStart ?? "",
      "metadata[slot_end]": slotEnd ?? "",
      "metadata[people_count]": String(peopleCount),
    });

    return new Response(
      JSON.stringify({
        client_secret: intent.client_secret,
        amount_cents: amountCents,
        platform_fee_cents: platformFee,
        currency,
        payment_intent_id: intent.id,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("stripe-create-payment-intent error", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
