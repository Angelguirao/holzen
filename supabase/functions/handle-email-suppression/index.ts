import { createClient } from 'npm:@supabase/supabase-js@2'
import { WebhookError, verifyWebhookRequest } from "https://esm.sh/@lovable.dev/webhooks-js"
import { redactEmailForLog } from "../_shared/email-log-helpers.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

// Suppression event payload sent by the Go API when Mailgun reports
// a bounce, complaint, or unsubscribe.
interface SuppressionPayload {
  email: string
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  message_id?: string
  metadata?: Record<string, unknown>
  is_retry: boolean
  retry_count: number
}

function parseSuppressionPayload(body: string): SuppressionPayload {
  const parsed = JSON.parse(body)
  if (!parsed.data) {
    throw new Error('Missing data field in payload')
  }
  const data = parsed.data as SuppressionPayload
  if (!data.email || !data.reason) {
    throw new Error('Missing required fields: email, reason')
  }
  return data
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(withRequestLogging("handle-email-suppression", async ({ req, log }) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
    try {
      log.error("handle_email_suppression_missing_env", {
        holzen_event: "handle_email_suppression_missing_env",
      });
    } catch {
      /* non-fatal */
    }
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  // Verify HMAC signature using the Lovable API Key (same as auth-email-hook)
  let payload: SuppressionPayload
  try {
    const verified = await verifyWebhookRequest({
      req,
      secret: apiKey,
      parser: parseSuppressionPayload,
    })
    payload = verified.payload
  } catch (error) {
    if (error instanceof WebhookError) {
      switch (error.code) {
        case 'invalid_signature':
          try {
            log.warn("handle_email_suppression_invalid_signature", {
              holzen_event: "handle_email_suppression_invalid_signature",
            });
          } catch {
            /* non-fatal */
          }
          return jsonResponse({ error: 'Invalid signature' }, 401)
        case 'stale_timestamp':
          try {
            log.warn("handle_email_suppression_stale_timestamp", {
              holzen_event: "handle_email_suppression_stale_timestamp",
            });
          } catch {
            /* non-fatal */
          }
          return jsonResponse({ error: 'Stale timestamp' }, 401)
        case 'invalid_payload':
        case 'invalid_json':
          try {
            log.warn("handle_email_suppression_invalid_payload", {
              holzen_event: "handle_email_suppression_invalid_payload",
              code: error.code,
            });
          } catch {
            /* non-fatal */
          }
          return jsonResponse({ error: 'Invalid payload' }, 400)
        default:
          try {
            log.warn("handle_email_suppression_verify_failed", {
              holzen_event: "handle_email_suppression_verify_failed",
              code: error.code,
              detail: error.message,
            });
          } catch {
            /* non-fatal */
          }
          return jsonResponse({ error: 'Verification failed' }, 401)
      }
    }
    try {
      log.error("handle_email_suppression_verify_uncaught", {
        holzen_event: "handle_email_suppression_verify_uncaught",
        detail: error instanceof Error ? error.message : String(error),
      });
    } catch {
      /* non-fatal */
    }
    return jsonResponse({ error: 'Internal error' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const normalizedEmail = payload.email.toLowerCase()

  // 1. Upsert to suppressed_emails (idempotent — safe for retries)
  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert(
      {
        email: normalizedEmail,
        reason: payload.reason,
        metadata: payload.metadata ?? null,
      },
      { onConflict: 'email' },
    )

  if (suppressError) {
    try {
      log.error("handle_email_suppression_upsert_failed", {
        holzen_event: "handle_email_suppression_upsert_failed",
        recipient_redacted: redactEmailForLog(normalizedEmail),
        detail: suppressError.message,
      });
    } catch {
      /* non-fatal */
    }
    return jsonResponse({ error: 'Failed to write suppression' }, 500)
  }

  // 2. Append a new log entry for the suppression event (never update existing rows)
  const sendLogStatus = mapReasonToStatus(payload.reason)
  const sendLogMessage = mapReasonToMessage(payload.reason)

  const { error: insertError } = await supabase
    .from('email_send_log')
    .insert({
      message_id: payload.message_id ?? null,
      template_name: 'system',
      recipient_email: normalizedEmail,
      status: sendLogStatus,
      error_message: sendLogMessage,
      metadata: payload.metadata ?? null,
    })

  if (insertError) {
    try {
      log.warn("handle_email_suppression_send_log_failed", {
        holzen_event: "handle_email_suppression_send_log_failed",
        recipient_redacted: redactEmailForLog(normalizedEmail),
        detail: insertError.message,
      });
    } catch {
      /* non-fatal */
    }
  }

  try {
    log("handle_email_suppression_ok", {
      holzen_event: "handle_email_suppression_ok",
      recipient_redacted: redactEmailForLog(normalizedEmail),
      reason: payload.reason,
      is_retry: payload.is_retry,
      retry_count: payload.retry_count,
      has_message_id: Boolean(payload.message_id),
    });
  } catch {
    /* non-fatal */
  }

  return jsonResponse({ success: true })
}))

function mapReasonToStatus(
  reason: string,
): 'bounced' | 'complained' | 'suppressed' {
  switch (reason) {
    case 'bounce':
      return 'bounced'
    case 'complaint':
      return 'complained'
    default:
      return 'suppressed'
  }
}

function mapReasonToMessage(reason: string): string {
  switch (reason) {
    case 'bounce':
      return 'Permanent bounce — email address is invalid or rejected'
    case 'complaint':
      return 'Spam complaint — recipient marked email as spam'
    case 'unsubscribe':
      return 'Recipient unsubscribed'
    default:
      return 'Email suppressed'
  }
}
