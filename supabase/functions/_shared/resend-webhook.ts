import { Webhook } from "npm:svix/webhook";
import {
  type ResendWebhookEvent,
  suppressionFromResendEvent,
} from "./resend-suppression-map.ts";

export type { ResendWebhookEvent } from "./resend-suppression-map.ts";
export { suppressionFromResendEvent } from "./resend-suppression-map.ts";

function normalizeResendWebhookSecret(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("whsec_")) return trimmed;
  if (trimmed.startsWith("v1,whsec_")) return trimmed.slice("v1,".length);
  return trimmed;
}

export function verifyResendWebhook(
  payload: string,
  headers: Headers,
): ResendWebhookEvent {
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET")?.trim();
  if (!secret) {
    throw new Error("RESEND_WEBHOOK_SECRET not configured");
  }

  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    throw new Error("Missing Svix webhook headers");
  }

  const wh = new Webhook(normalizeResendWebhookSecret(secret));
  return wh.verify(payload, {
    "svix-id": id,
    "svix-timestamp": timestamp,
    "svix-signature": signature,
  }) as ResendWebhookEvent;
}
