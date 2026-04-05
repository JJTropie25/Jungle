import { supabase } from "./supabase";
import * as Linking from "expo-linking";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function createConnectedAccount(): Promise<{ stripe_account_id?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "Not authenticated." };
  const res = await fetch(`${supabaseUrl}/functions/v1/stripe-create-connected-account`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { error: await res.text() };
  return await res.json();
}

export async function createAccountLink(returnUrl: string, refreshUrl: string): Promise<{ url?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { error: "Not authenticated." };
  const res = await fetch(`${supabaseUrl}/functions/v1/stripe-create-account-link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ return_url: returnUrl, refresh_url: refreshUrl }),
  });
  if (!res.ok) return { error: await res.text() };
  return await res.json();
}

export function getStripeReturnUrl(path: string): string | null {
  if (!supabaseUrl) return null;
  const redirect = encodeURIComponent(Linking.createURL(path));
  return `${supabaseUrl}/functions/v1/stripe-return?redirect=${redirect}`;
}

export async function createPaymentIntent(payload: {
  service_id: string;
  slot_start: string;
  slot_end: string;
  people_count: number;
  currency?: string;
}): Promise<{
  client_secret?: string;
  amount_cents?: number;
  platform_fee_cents?: number;
  currency?: string;
  payment_intent_id?: string;
  error?: string;
}> {
  const token = await getAccessToken();
  if (!token) return { error: "Not authenticated." };
  const res = await fetch(`${supabaseUrl}/functions/v1/stripe-create-payment-intent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await res.text() };
  return await res.json();
}
