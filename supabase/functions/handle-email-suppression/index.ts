import { createClient } from 'npm:@supabase/supabase-js@2'
import { applyEmailSuppression, type SuppressionEvent } from "../_shared/email-suppression-write.ts";
import {
  suppressionFromResendEvent,
  verifyResendWebhook,
} from "../_shared/resend-webhook.ts";
import { withRequestLogging } from "../_shared/with-request-logging.ts";

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

  if (!isResendWebhook(req)) {
    try {
      log.warn("handle_email_suppression_unsupported_provider", {
        holzen_event: "handle_email_suppression_unsupported_provider",
      });
    } catch {
      /* non-fatal */
    }
    return jsonResponse({ error: 'Resend webhook required (Svix headers)' }, 400)
  }

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

  const enriched: SuppressionEvent = {
    ...suppression,
    metadata: {
      ...(suppression.metadata ?? {}),
      provider: "resend",
    },
  }

  return applyEmailSuppression(supabase, enriched, log)
}))
