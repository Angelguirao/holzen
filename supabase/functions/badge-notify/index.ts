import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import webpush from "https://esm.sh/web-push@3.6.7";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(
  withRequestLogging("badge-notify", async ({ req }) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { badges } = await req.json();
    if (!badges || !Array.isArray(badges) || badges.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get push subscriptions
    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user.id);

    if (!pushSubs || pushSubs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_push_subs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKeyRaw = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKeyRaw) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_vapid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse private key
    let privateKey = vapidPrivateKeyRaw;
    try {
      const parsed = JSON.parse(vapidPrivateKeyRaw);
      privateKey = parsed.d || vapidPrivateKeyRaw;
    } catch {
      if (vapidPrivateKeyRaw.length > 44) {
        const stdBase64 = vapidPrivateKeyRaw.replace(/-/g, "+").replace(/_/g, "/").padEnd(
          vapidPrivateKeyRaw.length + (4 - (vapidPrivateKeyRaw.length % 4)) % 4, "="
        );
        try {
          const binaryStr = atob(stdBase64);
          const pkcs8Bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) pkcs8Bytes[i] = binaryStr.charCodeAt(i);
          const cryptoKey = await crypto.subtle.importKey(
            "pkcs8", pkcs8Bytes.buffer,
            { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]
          );
          const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
          if (jwk.d) privateKey = jwk.d;
        } catch (e) {
          console.error("[PUSH] Failed to extract key:", e);
        }
      }
    }

    webpush.setVapidDetails("mailto:noreply@holzen.app", vapidPublicKey, privateKey);

    const badgeNames = badges.map((b: any) => b.label).join(", ");
    const title = badges.length === 1 ? "🏅 Badge unlocked!" : `🏅 ${badges.length} badges unlocked!`;
    const body = badges.length === 1
      ? `You earned "${badges[0].label}" — ${badges[0].description}`
      : `New badges: ${badgeNames}`;

    const payload = JSON.stringify({ title, body });
    let sent = 0;

    for (const sub of pushSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (pushErr: any) {
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    // Mark badges as notified
    if (sent > 0) {
      const badgeIds = badges.map((b: any) => b.id);
      await supabase
        .from("user_badges")
        .update({ notified: true })
        .eq("user_id", user.id)
        .in("badge_id", badgeIds);
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[BADGE-NOTIFY] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
