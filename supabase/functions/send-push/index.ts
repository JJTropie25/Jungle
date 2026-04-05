// Supabase Edge Function: send-push
// Sends push notifications for unsent rows in public.notifications using Expo push API.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const expoEndpoint = "https://exp.host/--/api/v2/push/send";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  scheduled_for?: string | null;
};

serve(async (_req) => {
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", {
      status: 500,
    });
  }

  const nowIso = new Date().toISOString();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id,user_id,title,body,data,scheduled_for")
    .is("sent_at", null)
    .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return new Response(error.message, { status: 500 });
  }
  if (!notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const userIds = Array.from(new Set(notifications.map((n) => n.user_id)));
  const { data: tokensData, error: tokensError } = await supabase
    .from("push_tokens")
    .select("user_id, token")
    .in("user_id", userIds);

  if (tokensError) {
    return new Response(tokensError.message, { status: 500 });
  }

  const tokensByUser = new Map<string, string[]>();
  for (const row of tokensData ?? []) {
    if (!tokensByUser.has(row.user_id)) {
      tokensByUser.set(row.user_id, []);
    }
    tokensByUser.get(row.user_id)!.push(row.token);
  }

  const messages: Record<string, unknown>[] = [];
  const messageToNotification: string[] = [];
  for (const n of notifications as NotificationRow[]) {
    const tokens = tokensByUser.get(n.user_id) ?? [];
    if (tokens.length === 0) continue;
    for (const token of tokens) {
      messages.push({
        to: token,
        title: n.title,
        body: n.body ?? "",
        data: { ...(n.data ?? {}), notification_id: n.id },
        sound: "default",
        channelId: "lagoon-default",
      });
      messageToNotification.push(n.id);
    }
  }

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0, skipped: notifications.length }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  const expoResp = await fetch(expoEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
    },
    body: JSON.stringify(messages),
  });

  const respJson = await expoResp.json().catch(() => null);
  console.log("expo response", JSON.stringify(respJson));

  const okIds = new Set<string>();
  const errors: Array<{ id: string; error: unknown }> = [];
  if (respJson?.data && Array.isArray(respJson.data)) {
    respJson.data.forEach((ticket: any, index: number) => {
      const notifId = messageToNotification[index];
      if (!notifId) return;
      if (ticket?.status === "ok") {
        okIds.add(notifId);
      } else if (ticket?.status === "error") {
        errors.push({ id: notifId, error: ticket?.details ?? ticket?.message });
      }
    });
  } else {
    // If Expo returns unexpected response, don't mark as sent.
    errors.push({ id: "unknown", error: respJson });
  }

  if (errors.length > 0) {
    console.log("expo errors", JSON.stringify(errors));
  }

  const ids = Array.from(okIds);
  if (ids.length > 0) {
    await supabase
      .from("notifications")
      .update({ sent_at: new Date().toISOString() })
      .in("id", ids);
  }

  return new Response(JSON.stringify({ sent: ids.length, attempted: messages.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
