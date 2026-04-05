import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
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
    const returnUrl = body?.return_url as string | undefined;
    const refreshUrl = body?.refresh_url as string | undefined;
    if (!returnUrl || !refreshUrl) {
      return new Response("Missing return_url or refresh_url", { status: 400 });
    }

    const { data: host } = await adminClient
      .from("hosts")
      .select("id, stripe_account_id")
      .eq("guest_id", user.id)
      .maybeSingle();
    if (!host?.stripe_account_id) {
      return new Response("Missing stripe_account_id", { status: 400 });
    }

    const link = await stripePost("account_links", {
      account: host.stripe_account_id,
      type: "account_onboarding",
      return_url: returnUrl,
      refresh_url: refreshUrl,
    });

    return new Response(JSON.stringify({ url: link.url }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-create-account-link error", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
