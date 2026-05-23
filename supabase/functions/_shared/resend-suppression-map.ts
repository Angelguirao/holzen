import type { SuppressionEvent } from "./email-suppression-write.ts";

export interface ResendWebhookEvent {
  type: string;
  created_at?: string;
  data?: Record<string, unknown>;
}

function firstRecipient(to: unknown): string | null {
  if (typeof to === "string" && to.trim()) return to.trim();
  if (Array.isArray(to)) {
    for (const entry of to) {
      if (typeof entry === "string" && entry.trim()) return entry.trim();
    }
  }
  return null;
}

/** Map Resend delivery events to internal suppression rows. Returns null when ignored. */
export function suppressionFromResendEvent(
  event: ResendWebhookEvent,
): SuppressionEvent | null {
  const data = event.data ?? {};
  const email = firstRecipient(data.to);
  if (!email) return null;

  const messageId = typeof data.email_id === "string" ? data.email_id : undefined;
  const metadata: Record<string, unknown> = {
    provider: "resend",
    event_type: event.type,
    created_at: event.created_at ?? null,
  };

  if (event.type === "email.complained") {
    return {
      email,
      reason: "complaint",
      message_id: messageId,
      metadata,
    };
  }

  if (event.type === "email.bounced") {
    const bounce = data.bounce as { type?: string; subType?: string; message?: string } | undefined;
    if (bounce?.type === "Temporary") return null;
    if (bounce?.message) metadata.bounce_message = bounce.message;
    if (bounce?.subType) metadata.bounce_sub_type = bounce.subType;
    return {
      email,
      reason: "bounce",
      message_id: messageId,
      metadata,
    };
  }

  return null;
}
