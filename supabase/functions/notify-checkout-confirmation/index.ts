// Sends an optional one-screen checkout-confirmation summary via email and/or
// web push. Gated by `profiles.email_notifications` (per the user's preference
// to reuse this single flag for both channels). Idempotent: dedup key is
// `confirm:<userId>:<mode>:<bucket>` where bucket is the calendar minute, so a
// double-trigger from React StrictMode / refresh within the same minute will
// still result in exactly one email and one push payload per device.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "https://esm.sh/web-push@3.6.7";
import { withRequestLogging, type RequestLoggingContext } from "../_shared/with-request-logging.ts";
import { createCidSupabaseClient, sendWebPushWithCid } from "../_shared/cid-clients.ts";
import { webPushStatusCode } from "../_shared/log-unknown-error.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Mode = "subscription" | "flex_pack_s" | "flex_pack_m";

interface Body {
  mode: Mode;
  tierLabel?: string;
  isTrialing?: boolean;
  trialStart?: string | null;
  firstChargeAt?: string | null;
  monthlyPrice?: string;
  companionUnlocks?: number;
  wallpapers?: number;
  flexCreditsBalance?: number;
  packLabel?: string;
  previousBalance?: number;
  creditsAdded?: number;
  newBalance?: number;
}

// Note: a wrapper-bound `log` (carrying cid + fn + release) is provided to
// the handler. Do not redefine a local `console.log` shim here — that
// strips the cid and breaks BetterStack's `cid` pivot.

async function resolveVapidPrivateKey(raw: string, log: RequestLoggingContext["log"]): Promise<string> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.d) return parsed.d;
  } catch { /* not JSON */ }
  if (raw.length <= 44) return raw;
  try {
    const stdBase64 = raw.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      raw.length + (4 - (raw.length % 4)) % 4,
      "=",
    );
    const binaryStr = atob(stdBase64);
    const pkcs8Bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) pkcs8Bytes[i] = binaryStr.charCodeAt(i);
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      pkcs8Bytes.buffer,
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign"],
    );
    const jwk = await crypto.subtle.exportKey("jwk", cryptoKey);
    if (jwk.d) return jwk.d as string;
  } catch (e) {
    try {
      log.error("notify_checkout_vapid_parse_failed", {
        holzen_event: "notify_checkout_vapid_parse_failed",
        detail: e instanceof Error ? e.message : String(e),
      });
    } catch {
      /* non-fatal */
    }
  }
  return raw;
}

serve(
  withRequestLogging("notify-checkout-confirmation", async ({ req, log, cid }) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createCidSupabaseClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      cid,
      { auth: { persistSession: false } },
      req,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body || (body.mode !== "subscription" && body.mode !== "flex_pack_s" && body.mode !== "flex_pack_m")) {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email_notifications, first_name")
      .eq("user_id", user.id)
      .maybeSingle();
    const notificationsOn = profile?.email_notifications !== false;
    if (!notificationsOn) {
      log("opted_out", { userId: user.id });
      return new Response(JSON.stringify({ skipped: "opted_out", emailed: false, pushed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const minuteBucket = Math.floor(Date.now() / 60_000);
    const idempotencyKey = `confirm:${user.id}:${body.mode}:${minuteBucket}`;

    // ---------- Email ----------
    let emailed = false;
    let emailError: string | null = null;
    if (user.email) {
      try {
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "checkout-confirmation",
            recipientEmail: user.email,
            idempotencyKey,
            templateData: { ...body },
          },
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`,
          },
        });
        if (error) {
          emailError = error.message ?? String(error);
          log("email_invoke_error", { emailError });
        } else {
          emailed = true;
        }
      } catch (e) {
        emailError = e instanceof Error ? e.message : String(e);
        log("email_throw", { emailError });
      }
    }

    // ---------- Push ----------
    let pushed = 0;
    let pushError: string | null = null;
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateRaw = Deno.env.get("VAPID_PRIVATE_KEY");

    if (vapidPublic && vapidPrivateRaw) {
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", user.id);

      if (pushSubs && pushSubs.length > 0) {
        const privateKey = await resolveVapidPrivateKey(vapidPrivateRaw, log);
        webpush.setVapidDetails("mailto:noreply@holzen.app", vapidPublic, privateKey);

        const isSub = body.mode === "subscription";
        const title = isSub
          ? `Holzen ${body.tierLabel ?? "Pro"} subscription confirmed`
          : "Holzen flex credits added";
        const pushBody = isSub
          ? body.isTrialing && body.firstChargeAt
            ? `Trial started — first charge ${body.firstChargeAt}.`
            : body.firstChargeAt
            ? `Subscription active — next charge ${body.firstChargeAt}.`
            : "Subscription active."
          : typeof body.creditsAdded === "number" && typeof body.newBalance === "number"
          ? `+${body.creditsAdded} credits • new balance ${body.newBalance}`
          : "Flex credits added to your balance.";

        const payload = JSON.stringify({
          title,
          body: pushBody,
          url: "/settings",
          tag: idempotencyKey,
        });

        for (const sub of pushSubs) {
          try {
            await sendWebPushWithCid(
              log,
              webpush,
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
              { notificationTag: idempotencyKey },
            );
            pushed++;
          } catch (pushErr: unknown) {
            const sc = webPushStatusCode(pushErr);
            if (sc === 410 || sc === 404) {
              await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            } else {
              pushError = pushErr instanceof Error
                ? pushErr.message
                : String(pushErr);
              // The `dependency_call` log line from `sendWebPushWithCid` already
              // captured the error with cid + endpoint host; here we only need
              // the higher-level signal that the per-sub send was treated as
              // a delivery failure (vs a stale-sub prune above).
              log.warn("push_send_failed", { pushError });
            }
          }
        }
      }
    } else {
      pushError = "no_vapid";
    }

    return new Response(
      JSON.stringify({ emailed, pushed, emailError, pushError, idempotencyKey }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    try {
      log.error("notify_checkout_confirmation_uncaught", {
        holzen_event: "notify_checkout_confirmation_uncaught",
        detail: msg,
      });
    } catch {
      /* non-fatal */
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  })
);
