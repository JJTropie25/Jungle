import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve((req) => {
  const url = new URL(req.url);
  const redirect = url.searchParams.get("redirect");
  if (!redirect) {
    return new Response("Missing redirect", { status: 400 });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirect,
      "Cache-Control": "no-store",
    },
  });
});
