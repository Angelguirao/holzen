import { createClient } from 'npm:@supabase/supabase-js@2'
import { WebhookError, verifyWebhookRequest } from "https://esm.sh/@lovable.dev/webhooks-js"
import { applyEmailSuppression, type SuppressionEvent } from "../_shared/email-suppression-write.ts";
import {
  suppressionFromResendEvent,
  verifyResendWebhook,
} from "../_shared/resend-webhook.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

// Suppression event payload sent by the Go API when Mailgun reports
// a bounce, complaint, or unsubscribe.
interface LovableSuppressionPayload {
  email: string
  reason: 'bounce' | 'complaint' | 'unsubscribe'
  message_id?: string
  metadata?: Record<string, unknown>
  is_retry: boolean
  retry_count: number
}

function parseLovableSuppressionPayload(body: string): LovableSuppressionPayload {
  const parsed = JSON.parse(body)
  if (!parsed.data) {
    throw new Error('Missing data field in payload')
  }
  const data = parsed.data as LovableSuppressionPayload
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

function isResendWebhook(req: Request): boolean {
  return Boolean(
    req.headers.get("svix-id") &&
      req.headers.get("svix-timestamp") &&
      req.headers.get("svix-signature"),
  );
}

Deno.serve(withRequestLogging("handle-email-suppression", async ({ req, log }) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    try {
      log.error("handle_email_suppression_missing_env", {
        holzen_event: "handle_email_suppression_missing_env",
      });
    } catch {
      /* non-fatal */
    }
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  if (isResendWebhook(req)) {
    if (!Deno.env.get("RESEND_WEBHOOK_SECRET")?.trim()) {
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }

    const rawBody = await req.text()
    let event
    try {
      event = verifyResendWebhook(rawBody, req.headers)
    } catch (error) {
      try {
        log.warn("handle_email_suppression_resend_verify_failed", {
          holzen_event: "handle_email_suppression_resend_verify_failed",
          detail: error instanceof Error ? error.message : String(error),
        });
      } catch {
        /* non-fatal */
      }
      return jsonResponse({ error: 'Invalid signature' }, 401)
    }

    const suppression = suppressionFromResendEvent(event)
    if (!suppression) {
      try {
        log("handle_email_suppression_resend_ignored", {
          holzen_event: "handle_email_suppression_resend_ignored",
          event_type: event.type,
        });
      } catch {
        /* non-fatal */
      }
      return jsonResponse({ success: true, ignored: true })
    }

    return applyEmailSuppression(supabase, suppression, log)
  }

  const lovableKey = Deno.env.get('LOVABLE_API_KEY')
  if (!lovableKey) {
    try {
      log.error("handle_email_suppression_missing_env", {
        holzen_event: "handle_email_suppression_missing_env",
        detail: "LOVABLE_API_KEY or RESEND_WEBHOOK_SECRET required",
      });
    } catch {
      /* non-fatal */
    }
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  let payload: LovableSuppressionPayload
  try {
    const verified = await verifyWebhookRequest({
      req,
      secret: lovableKey,
      parser: parseLovableSuppressionPayload,
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

  const suppression: SuppressionEvent = {
    email: payload.email,
    reason: payload.reason,
    message_id: payload.message_id,
    metadata: {
      ...(payload.metadata ?? {}),
      provider: "lovable",
    },
    is_retry: payload.is_retry,
    retry_count: payload.retry_count,
  }

  return applyEmailSuppression(supabase, suppression, log)
}))
