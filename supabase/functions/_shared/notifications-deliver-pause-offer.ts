/**
 * Multi-channel delivery for automatic pause offers (email + web push).
 * In-app inbox rows come from `notifications_from_pause_instances` on pause insert — not here.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import webpush from "https://esm.sh/web-push@3.6.7";
import { sendWebPushWithCid, type PushSubscriptionRecord } from "./cid-clients.ts";
import {
  holzenLovableEmailLogger,
  sendLovableEmailMessage,
} from "./lovable-email.ts";
import { unknownErrorForLog, webPushStatusCode } from "./log-unknown-error.ts";
import type { RequestLoggingContext } from "./with-request-logging.ts";

export type PauseOfferDeliveryLog = RequestLoggingContext["log"];

export type DeliverPauseOfferChannelsInput = {
  supabase: SupabaseClient;
  webpush: typeof webpush;
  userId: string;
  emailNotifications: boolean;
  contextPreview: string;
  pauseInstanceId: string;
  log: PauseOfferDeliveryLog;
  cid?: string;
  vapidReady: boolean;
  /** Holzen event name for structured logs (e.g. check_volatility_cron). */
  holzenEvent?: string;
};

/** Configure VAPID once per cron run; safe to call before processing eligible users. */
export async function initWebPushVapidFromEnv(log: PauseOfferDeliveryLog): Promise<boolean> {
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKeyJwk = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublicKey || !vapidPrivateKeyJwk) return false;

  try {
    let privateKey = vapidPrivateKeyJwk;
    try {
      const parsed = JSON.parse(vapidPrivateKeyJwk);
      privateKey = parsed.d || vapidPrivateKeyJwk;
    } catch {
      if (vapidPrivateKeyJwk.length > 44) {
        let stdBase64 = vapidPrivateKeyJwk.replace(/-/g, "+").replace(/_/g, "/");
        while (stdBase64.length % 4) stdBase64 += "=";
        try {
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
          if (jwk.d) privateKey = jwk.d;
        } catch (decodeErr) {
          log.error("notifications_deliver_vapid", {
            holzen_event: "notifications_deliver",
            phase: "vapid_pkcs8_decode_failed",
            ...unknownErrorForLog(decodeErr),
          });
        }
      }
    }
    webpush.setVapidDetails("mailto:noreply@holzen.app", vapidPublicKey, privateKey);
    return true;
  } catch (vapidErr) {
    log.error("notifications_deliver_vapid", {
      holzen_event: "notifications_deliver",
      phase: "vapid_setup_error",
      ...unknownErrorForLog(vapidErr),
    });
    return false;
  }
}

async function sendPauseOfferEmail(
  email: string,
  context: string,
  pauseInstanceId: string,
  log: PauseOfferDeliveryLog,
  holzenEvent: string,
): Promise<boolean> {
  if (!Deno.env.get("LOVABLE_API_KEY")) {
    log.error("notifications_deliver_email", {
      holzen_event: holzenEvent,
      phase: "lovable_api_key_not_configured",
    });
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'IBM Plex Mono', monospace, sans-serif; max-width: 400px; margin: 0 auto; padding: 40px 20px; color: #2a2a2a; background: #f7f5f0;">
      <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #737373; margin-bottom: 24px;">HOLZEN</p>
      <p style="font-size: 13px; color: #737373; margin-bottom: 16px;">${context}</p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Open Holzen when you're ready — your personalized reflection is waiting in the pause ritual.</p>
      <hr style="border: none; border-top: 1px solid #e5e2dc; margin: 24px 0;">
      <p style="font-size: 11px; color: #a3a3a3;">This is an automated notification from Holzen. You can disable email notifications in your settings.</p>
    </body>
    </html>
  `;

  const result = await sendLovableEmailMessage(
    {
      from: "Holzen <notify@holzen.app>",
      to: [email],
      subject: "Holzen — A moment to pause",
      html,
    },
    {
      source: "volatility-email",
      idempotencyKey: `volatility:${pauseInstanceId}`,
      logger: holzenLovableEmailLogger(
        (m, d) =>
          log("notifications_deliver_email_dep", {
            holzen_event: holzenEvent,
            phase: "volatility_email_dep",
            message: m,
            ...(d ?? {}),
          }),
        (m, data) =>
          log.error("notifications_deliver_email_dep", {
            holzen_event: holzenEvent,
            phase: "volatility_email_dep_error",
            message: m,
            ...(data ?? {}),
          }),
      ),
    },
  );

  if (result.ok) {
    log("notifications_deliver_email_sent", {
      holzen_event: holzenEvent,
      phase: "volatility_email_sent",
      recipient_host: email.includes("@") ? email.split("@")[1]!.toLowerCase() : "?",
      attempts: result.attempts,
    });
    return true;
  }
  return false;
}

async function sendPauseOfferPush(
  input: DeliverPauseOfferChannelsInput,
): Promise<void> {
  const {
    supabase,
    webpush: webpushMod,
    userId,
    contextPreview,
    pauseInstanceId,
    log,
    cid,
    vapidReady,
    holzenEvent = "notifications_deliver",
  } = input;

  if (!vapidReady) return;

  const { data: pushSubs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!pushSubs?.length) return;

  const payload = JSON.stringify({
    title: "Holzen",
    body: contextPreview.slice(0, 120),
    pauseInstanceId,
    action: "pause_ready",
  });

  await Promise.all(
    pushSubs.map(async (sub) => {
      try {
        await sendWebPushWithCid(
          log,
          webpushMod,
          sub as PushSubscriptionRecord,
          payload,
          { notificationTag: "volatility" },
        );
      } catch (pushErr: unknown) {
        const sc = webPushStatusCode(pushErr);
        log.error("notifications_deliver_push", {
          holzen_event: holzenEvent,
          phase: "push_send_failed",
          status_code: sc,
          cid,
          ...unknownErrorForLog(pushErr),
        });
        if (sc === 410 || sc === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }),
  );
}

/**
 * Email + web push after a pause instance is created. In-app bell uses DB trigger on `pause_instances`.
 */
export async function deliverPauseOfferChannels(
  input: DeliverPauseOfferChannelsInput,
): Promise<void> {
  const holzenEvent = input.holzenEvent ?? "notifications_deliver";

  await Promise.all([
    (async () => {
      if (!input.emailNotifications) return;
      const { data: userData } = await input.supabase.auth.admin.getUserById(input.userId);
      const email = userData?.user?.email;
      if (email) {
        await sendPauseOfferEmail(
          email,
          input.contextPreview,
          input.pauseInstanceId,
          input.log,
          holzenEvent,
        );
      }
    })(),
    sendPauseOfferPush({ ...input, holzenEvent }),
  ]);
}
