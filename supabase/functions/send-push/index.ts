import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push helpers
async function generateVapidAuthHeader(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  sub: string
) {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub };

  const enc = new TextEncoder();
  const b64url = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = btoa(JSON.stringify(header))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const unsigned = `${headerB64}.${payloadB64}`;

  // Import private key
  const rawPrivate = Uint8Array.from(
    atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const rawPublic = Uint8Array.from(
    atob(vapidPublicKey.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: vapidPrivateKey,
    x: btoa(String.fromCharCode(...rawPublic.slice(1, 33)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
    y: btoa(String.fromCharCode(...rawPublic.slice(33, 65)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, ""),
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    enc.encode(unsigned)
  );

  // Convert DER signature to raw r||s if needed
  const sigArray = new Uint8Array(sig);
  let r: Uint8Array, s: Uint8Array;
  if (sigArray.length === 64) {
    r = sigArray.slice(0, 32);
    s = sigArray.slice(32, 64);
  } else {
    // Already raw
    r = sigArray.slice(0, 32);
    s = sigArray.slice(32);
  }

  const rawSig = new Uint8Array(64);
  rawSig.set(r.length > 32 ? r.slice(r.length - 32) : r, 32 - Math.min(r.length, 32));
  rawSig.set(s.length > 32 ? s.slice(s.length - 32) : s, 64 - Math.min(s.length, 32));

  const token = `${unsigned}.${b64url(rawSig.buffer)}`;

  return {
    authorization: `vapid t=${token}, k=${vapidPublicKey}`,
  };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string
) {
  // For simplicity, send without encryption (works for most browsers with proper VAPID)
  const body = JSON.stringify(payload);

  const { authorization } = await generateVapidAuthHeader(
    subscription.endpoint,
    vapidPublicKey,
    vapidPrivateKey,
    "mailto:noreply@celeri.app"
  );

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      TTL: "86400",
    },
    body,
  });

  return response;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ride_id, origin_lat, origin_lng, origin_address, destination_address, estimated_price } =
      await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidPublicKey =
      "BPHBYjPl_lpeH6XWXCgVhGom_2u_MOME843nDTGxEVu_RdVnwUdXVjkfMYiKu87YixaCyTO8RaXwuf5GIQIjbKE";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find nearby available drivers (within ~8km using simple lat/lng math)
    const latDelta = 8 / 111; // ~8km in degrees
    const lngDelta = 8 / (111 * Math.cos((origin_lat * Math.PI) / 180));

    const { data: drivers } = await supabase
      .from("drivers")
      .select("user_id")
      .eq("status", "available")
      .gte("location_lat", origin_lat - latDelta)
      .lte("location_lat", origin_lat + latDelta)
      .gte("location_lng", origin_lng - lngDelta)
      .lte("location_lng", origin_lng + lngDelta);

    if (!drivers || drivers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const driverUserIds = drivers.map((d) => d.user_id);

    // Get push subscriptions for these drivers
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", driverUserIds);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      title: "🏍️ Nova corrida disponível!",
      body: `${origin_address} → ${destination_address} | R$ ${(estimated_price ?? 0).toFixed(2)}`,
      data: { ride_id },
    };

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        const res = await sendPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );
        if (res.ok || res.status === 201) sent++;
        else if (res.status === 410) {
          // Subscription expired, remove it
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      } catch (e) {
        console.error("Failed to send push to", sub.endpoint, e);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
