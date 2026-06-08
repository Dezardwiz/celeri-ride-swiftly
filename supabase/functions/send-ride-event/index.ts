import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VAPID_PUBLIC_KEY =
  "BPHBYjPl_lpeH6XWXCgVhGom_2u_MOME843nDTGxEVu_RdVnwUdXVjkfMYiKu87YixaCyTO8RaXwuf5GIQIjbKE";

async function vapidAuth(endpoint: string, privateKey: string) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: "mailto:noreply@celeri.app" };
  const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64urlBuf = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const rawPub = Uint8Array.from(atob(VAPID_PUBLIC_KEY.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const jwk = {
    kty: "EC", crv: "P-256", d: privateKey,
    x: btoa(String.fromCharCode(...rawPub.slice(1, 33))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    y: btoa(String.fromCharCode(...rawPub.slice(33, 65))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsigned));
  return `vapid t=${unsigned}.${b64urlBuf(sig)}, k=${VAPID_PUBLIC_KEY}`;
}

async function sendPush(sub: any, payload: object, privateKey: string) {
  const auth = await vapidAuth(sub.endpoint, privateKey);
  return await fetch(sub.endpoint, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json", TTL: "86400" },
    body: JSON.stringify(payload),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { user_ids, title, body, data } = await req.json();
    if (!Array.isArray(user_ids) || user_ids.length === 0 || !title) {
      return new Response(JSON.stringify({ error: "user_ids and title required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const { data: subs } = await supabase.from("push_subscriptions").select("*").in("user_id", user_ids);
    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    let sent = 0;
    for (const s of subs) {
      try {
        const res = await sendPush(s, { title, body, data: data ?? {} }, privateKey);
        if (res.ok || res.status === 201) sent++;
        else if (res.status === 410) await supabase.from("push_subscriptions").delete().eq("id", s.id);
      } catch (e) { console.error("push fail", e); }
    }
    return new Response(JSON.stringify({ sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-ride-event error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});