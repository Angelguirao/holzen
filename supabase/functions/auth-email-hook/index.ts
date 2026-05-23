import * as React from "https://esm.sh/react@18.3.1"
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22?deps=react@18.3.1,react-dom@18.3.1"
import { authorizeOpsBearer } from "../_shared/ops-bearer-auth.ts";
import {
  holzenTransactionalEmailLogger,
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "../_shared/transactional-email.ts";
import {
  templatePropsFromSupabaseHook,
  verifySupabaseAuthEmailHook,
} from "../_shared/supabase-auth-email-hook.ts";
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
import { redactEmailForLog } from "../_shared/email-log-helpers.ts";
import { withRequestLogging, type RequestLoggingContext } from "../_shared/with-request-logging.ts";

/** Props passed to auth email React templates (each template narrows its own fields). */
type AuthEmailTemplateProps = Record<string, unknown>

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirm your email',
  invite: "You've been invited",
  magiclink: 'Your login link',
  recovery: 'Reset your password',
  email_change: 'Confirm your new email',
  reauthentication: 'Your verification code',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<AuthEmailTemplateProps>> = {
  signup: SignupEmail as unknown as React.ComponentType<AuthEmailTemplateProps>,
  invite: InviteEmail as unknown as React.ComponentType<AuthEmailTemplateProps>,
  magiclink: MagicLinkEmail as unknown as React.ComponentType<AuthEmailTemplateProps>,
  recovery: RecoveryEmail as unknown as React.ComponentType<AuthEmailTemplateProps>,
  email_change: EmailChangeEmail as unknown as React.ComponentType<AuthEmailTemplateProps>,
  reauthentication: ReauthenticationEmail as unknown as React.ComponentType<AuthEmailTemplateProps>,
}

const SITE_NAME = "holzen"
const SENDER_DOMAIN = "notify.holzen.app"
const ROOT_DOMAIN = "holzen.app"
const FROM_DOMAIN = "holzen.app"

const SAMPLE_PROJECT_URL = "https://holzen.app"
const SAMPLE_EMAIL = "user@example.test"
const SAMPLE_DATA: Record<string, object> = {
  signup: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    recipient: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  magiclink: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  recovery: {
    siteName: SITE_NAME,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  invite: {
    siteName: SITE_NAME,
    siteUrl: SAMPLE_PROJECT_URL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  email_change: {
    siteName: SITE_NAME,
    email: SAMPLE_EMAIL,
    newEmail: SAMPLE_EMAIL,
    confirmationUrl: SAMPLE_PROJECT_URL,
  },
  reauthentication: {
    token: '123456',
  },
}

async function handlePreview(req: Request): Promise<Response> {
  const previewCorsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: previewCorsHeaders })
  }

  if (!authorizeOpsBearer(req.headers.get('Authorization'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let type: string
  try {
    const body = await req.json()
    type = body.type
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const EmailTemplate = EMAIL_TEMPLATES[type]

  if (!EmailTemplate) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${type}` }), {
      status: 400,
      headers: { ...previewCorsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sampleData = (SAMPLE_DATA[type] || {}) as AuthEmailTemplateProps
  const html = await renderAsync(React.createElement(EmailTemplate, sampleData))

  return new Response(html, {
    status: 200,
    headers: { ...previewCorsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
}

async function renderAndSendAuthEmail(
  emailType: string,
  templateProps: AuthEmailTemplateProps,
  toEmail: string,
  runId: string,
  log: RequestLoggingContext["log"],
): Promise<Response> {
  const EmailTemplate = EMAIL_TEMPLATES[emailType]
  if (!EmailTemplate) {
    try {
      log.error("auth_email_hook_unknown_type", {
        holzen_event: "auth_email_hook_unknown_type",
        email_type: emailType,
        run_id: runId,
      });
    } catch {
      /* non-fatal */
    }
    return new Response(
      JSON.stringify({ error: `Unknown email type: ${emailType}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
    plainText: true,
  })

  if (!isTransactionalEmailConfigured()) {
    try {
      log.error("auth_email_hook_missing_email_delivery", {
        holzen_event: "auth_email_hook_missing_email_delivery",
        run_id: runId,
      });
    } catch {
      /* non-fatal */
    }
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sendResult = await sendTransactionalEmail(
    {
      to: toEmail,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: EMAIL_SUBJECTS[emailType] || 'Notification',
      html,
      text,
      purpose: 'transactional',
      label: `auth-${emailType}`,
    },
    {
      source: 'auth-email-hook',
      idempotencyKey: `auth-email:${runId}`,
      logger: holzenTransactionalEmailLogger(
        (m, d) => log("auth_email_hook_dep", { holzen_event: "auth_email_hook_dep", message: m, run_id: runId, ...(d ?? {}) }),
        (m, d) => log.error("auth_email_hook_dep", { holzen_event: "auth_email_hook_dep", message: m, run_id: runId, ...(d ?? {}) }),
      ),
    },
  )

  if (!sendResult.ok) {
    try {
      log.error("auth_email_hook_send_api_failed", {
        holzen_event: "auth_email_hook_send_api_failed",
        run_id: runId,
        http_status: sendResult.status,
        detail: (sendResult.error ?? 'Failed to send email').slice(0, 500),
      });
    } catch {
      /* non-fatal */
    }
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    log("auth_email_hook_sent", {
      holzen_event: "auth_email_hook_sent",
      message_id: sendResult.id,
      run_id: runId,
    });
  } catch {
    /* non-fatal */
  }

  return new Response(
    JSON.stringify({ success: true, message_id: sendResult.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleSupabaseAuthWebhook(req: Request, log: RequestLoggingContext["log"]): Promise<Response> {
  const rawBody = await req.text()
  let payload
  try {
    payload = verifySupabaseAuthEmailHook(rawBody, req.headers)
  } catch (error) {
    try {
      log.warn("auth_email_hook_supabase_verify_failed", {
        holzen_event: "auth_email_hook_supabase_verify_failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    } catch {
      /* non-fatal */
    }
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const emailType = payload.email_data.email_action_type
  const toEmail = payload.user.email?.trim() ?? ""
  const runId = `supabase:${payload.email_data.token_hash}:${emailType}`

  try {
    log("auth_email_hook_received", {
      holzen_event: "auth_email_hook_received",
      provider: "supabase",
      email_type: emailType,
      recipient_redacted: redactEmailForLog(toEmail),
      run_id: runId,
    });
  } catch {
    /* non-fatal */
  }

  if (!toEmail) {
    return new Response(JSON.stringify({ error: "Missing email in payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const templateProps = templatePropsFromSupabaseHook(payload, SITE_NAME, ROOT_DOMAIN)
  return renderAndSendAuthEmail(emailType, templateProps, toEmail, runId, log)
}

async function handleWebhook(req: Request, log: RequestLoggingContext["log"]): Promise<Response> {
  if (!req.headers.get("webhook-signature")) {
    return new Response(JSON.stringify({ error: 'Supabase Send Email Hook required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!Deno.env.get("SEND_EMAIL_HOOK_SECRET")?.trim()) {
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return handleSupabaseAuthWebhook(req, log)
}

Deno.serve(withRequestLogging("auth-email-hook", async ({ req, log }) => {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (url.pathname.endsWith('/preview')) {
    return handlePreview(req)
  }

  try {
    return await handleWebhook(req, log)
  } catch (error) {
    try {
      log.error("auth_email_hook_uncaught", {
        holzen_event: "auth_email_hook_uncaught",
        detail: error instanceof Error ? error.message : String(error),
      });
    } catch {
      /* non-fatal */
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}))
