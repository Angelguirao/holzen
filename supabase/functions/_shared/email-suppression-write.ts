import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { redactEmailForLog } from "./email-log-helpers.ts";

export type SuppressionReason = "bounce" | "complaint" | "unsubscribe";

export interface SuppressionEvent {
  email: string;
  reason: SuppressionReason;
  message_id?: string;
  metadata?: Record<string, unknown>;
  is_retry?: boolean;
  retry_count?: number;
}

type SuppressionLog = {
  log: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, data?: Record<string, unknown>) => void;
  warn: (msg: string, data?: Record<string, unknown>) => void;
};

function mapReasonToStatus(
  reason: string,
): "bounced" | "complained" | "suppressed" {
  switch (reason) {
    case "bounce":
      return "bounced";
    case "complaint":
      return "complained";
    default:
      return "suppressed";
  }
}

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case "bounce":
      return "Permanent bounce — email address is invalid or rejected";
    case "complaint":
      return "Spam complaint — recipient marked email as spam";
    case "unsubscribe":
      return "Recipient unsubscribed";
    default:
      return "Email suppressed";
  }
}

export async function applyEmailSuppression(
  supabase: SupabaseClient,
  payload: SuppressionEvent,
  log: SuppressionLog,
  holzenEventPrefix = "handle_email_suppression",
): Promise<Response> {
  const normalizedEmail = payload.email.toLowerCase();

  const { error: suppressError } = await supabase
    .from("suppressed_emails")
    .upsert(
      {
        email: normalizedEmail,
        reason: payload.reason,
        metadata: payload.metadata ?? null,
      },
      { onConflict: "email" },
    );

  if (suppressError) {
    try {
      log.error(`${holzenEventPrefix}_upsert_failed`, {
        holzen_event: `${holzenEventPrefix}_upsert_failed`,
        recipient_redacted: redactEmailForLog(normalizedEmail),
        detail: suppressError.message,
      });
    } catch {
      /* non-fatal */
    }
    return new Response(JSON.stringify({ error: "Failed to write suppression" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: insertError } = await supabase
    .from("email_send_log")
    .insert({
      message_id: payload.message_id ?? null,
      template_name: "system",
      recipient_email: normalizedEmail,
      status: mapReasonToStatus(payload.reason),
      error_message: mapReasonToMessage(payload.reason),
      metadata: payload.metadata ?? null,
    });

  if (insertError) {
    try {
      log.warn(`${holzenEventPrefix}_send_log_failed`, {
        holzen_event: `${holzenEventPrefix}_send_log_failed`,
        recipient_redacted: redactEmailForLog(normalizedEmail),
        detail: insertError.message,
      });
    } catch {
      /* non-fatal */
    }
  }

  try {
    log(`${holzenEventPrefix}_ok`, {
      holzen_event: `${holzenEventPrefix}_ok`,
      recipient_redacted: redactEmailForLog(normalizedEmail),
      reason: payload.reason,
      is_retry: payload.is_retry ?? false,
      retry_count: payload.retry_count ?? 0,
      has_message_id: Boolean(payload.message_id),
    });
  } catch {
    /* non-fatal */
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
