import { createClient } from 'npm:@supabase/supabase-js@2'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { recipientHostFromEmail } from "../_shared/email-log-helpers.ts";
import {
  holzenTransactionalEmailLogger,
  isTransactionalEmailConfigured,
  sendTransactionalEmail,
} from "../_shared/transactional-email.ts";
import { withRequestLogging, type RequestLoggingContext } from "../_shared/with-request-logging.ts";

const MAX_RETRIES = 5
const DEFAULT_BATCH_SIZE = 10
const DEFAULT_SEND_DELAY_MS = 200
const DEFAULT_AUTH_TTL_MINUTES = 15
const DEFAULT_TRANSACTIONAL_TTL_MINUTES = 60

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  try {
    const payload = parts[1]
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')

    return JSON.parse(atob(payload)) as Record<string, unknown>
  } catch {
    return null
  }
}

// Move a message to the dead letter queue and log the reason.
async function moveToDlq(
  supabase: SupabaseClient,
  queue: string,
  msg: { msg_id: number; message: Record<string, unknown> },
  reason: string,
  log: RequestLoggingContext["log"],
): Promise<void> {
  const payload = msg.message
  await supabase.from('email_send_log').insert({
    message_id: payload.message_id,
    template_name: (payload.label || queue) as string,
    recipient_email: payload.to,
    status: 'dlq',
    error_message: reason,
  })
  const { error } = await supabase.rpc('move_to_dlq', {
    source_queue: queue,
    dlq_name: `${queue}_dlq`,
    message_id: msg.msg_id,
    payload,
  })
  if (error) {
    try {
      log.error("process_email_queue_dlq_move_failed", {
        holzen_event: "process_email_queue_dlq_move_failed",
        queue,
        msg_id: msg.msg_id,
        reason,
        detail: error.message,
        recipient_host: typeof payload.to === "string" ? recipientHostFromEmail(payload.to) : null,
      });
    } catch {
      /* non-fatal */
    }
  }
}

Deno.serve(withRequestLogging("process-email-queue", async ({ req, log }) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!isTransactionalEmailConfigured() || !supabaseUrl || !supabaseServiceKey) {
    try {
      log.error("process_email_queue_missing_env", {
        holzen_event: "process_email_queue_missing_env",
      });
    } catch {
      /* non-fatal */
    }
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Defense in depth: verify_jwt=true already requires a valid JWT at the
  // gateway layer. This adds an explicit role check so only service-role
  // callers can trigger queue processing.
  const token = authHeader.slice('Bearer '.length).trim()
  const claims = parseJwtClaims(token)
  if (claims?.role !== 'service_role') {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const emailLogger = holzenTransactionalEmailLogger(
    (m, d) => log("process_email_queue_dep", { message: m, ...(d ?? {}) }),
    (m, d) => log.error("process_email_queue_dep", { message: m, ...(d ?? {}) }),
  )

  // 1. Check rate-limit cooldown and read queue config
  const { data: state } = await supabase
    .from('email_send_state')
    .select('retry_after_until, batch_size, send_delay_ms, auth_email_ttl_minutes, transactional_email_ttl_minutes')
    .single()

  if (state?.retry_after_until && new Date(state.retry_after_until) > new Date()) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'rate_limited' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const batchSize = state?.batch_size ?? DEFAULT_BATCH_SIZE
  const sendDelayMs = state?.send_delay_ms ?? DEFAULT_SEND_DELAY_MS
  const ttlMinutes: Record<string, number> = {
    auth_emails: state?.auth_email_ttl_minutes ?? DEFAULT_AUTH_TTL_MINUTES,
    transactional_emails: state?.transactional_email_ttl_minutes ?? DEFAULT_TRANSACTIONAL_TTL_MINUTES,
  }

  let totalProcessed = 0

  // 2. Process auth_emails first (priority), then transactional_emails
  for (const queue of ['auth_emails', 'transactional_emails']) {
    const { data: messages, error: readError } = await supabase.rpc('read_email_batch', {
      queue_name: queue,
      batch_size: batchSize,
      vt: 30,
    })

    if (readError) {
      try {
        log.error("process_email_queue_read_batch_failed", {
          holzen_event: "process_email_queue_read_batch_failed",
          queue,
          detail: readError.message,
        });
      } catch {
        /* non-fatal */
      }
      continue
    }

    if (!messages?.length) continue

    // Retry budget is based on real send failures, not pgmq read_ct.
    // read_ct increments for every message in a claimed batch, including
    // messages not attempted when a 429 stops processing early.
    const messageIds = Array.from(
      new Set(
        (messages as Array<{ message?: { message_id?: unknown } }>)
          .map((msg) =>
            msg?.message?.message_id && typeof msg.message.message_id === 'string'
              ? msg.message.message_id
              : null
          )
          .filter((id: string | null): id is string => Boolean(id))
      )
    )
    const failedAttemptsByMessageId = new Map<string, number>()
    if (messageIds.length > 0) {
      const { data: failedRows, error: failedRowsError } = await supabase
        .from('email_send_log')
        .select('message_id')
        .in('message_id', messageIds)
        .eq('status', 'failed')

      if (failedRowsError) {
        try {
          log.error("process_email_queue_failed_counters_failed", {
            holzen_event: "process_email_queue_failed_counters_failed",
            queue,
            detail: failedRowsError.message,
          });
        } catch {
          /* non-fatal */
        }
      } else {
        for (const row of failedRows ?? []) {
          const messageId = row?.message_id
          if (typeof messageId !== 'string' || !messageId) continue
          failedAttemptsByMessageId.set(
            messageId,
            (failedAttemptsByMessageId.get(messageId) ?? 0) + 1
          )
        }
      }
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      const payload = msg.message
      const failedAttempts =
        payload?.message_id && typeof payload.message_id === 'string'
          ? (failedAttemptsByMessageId.get(payload.message_id) ?? 0)
          : msg.read_ct ?? 0

      // Drop expired messages (TTL exceeded).
      // Prefer payload.queued_at when present; fall back to PGMQ's enqueued_at
      // which is always set by the queue.
      const queuedAt = payload.queued_at ?? msg.enqueued_at
      if (queuedAt) {
        const ageMs = Date.now() - new Date(queuedAt).getTime()
        const maxAgeMs = ttlMinutes[queue] * 60 * 1000
        if (ageMs > maxAgeMs) {
          try {
            log.warn("process_email_queue_ttl_expired", {
              holzen_event: "process_email_queue_ttl_expired",
              queue,
              msg_id: msg.msg_id,
              ttl_minutes: ttlMinutes[queue],
            });
          } catch {
            /* non-fatal */
          }
          await moveToDlq(supabase, queue, msg, `TTL exceeded (${ttlMinutes[queue]} minutes)`, log)
          continue
        }
      }

      // Move to DLQ if max failed send attempts reached.
      if (failedAttempts >= MAX_RETRIES) {
        await moveToDlq(
          supabase,
          queue,
          msg,
          `Max retries (${MAX_RETRIES}) exceeded (attempted ${failedAttempts} times)`,
          log,
        )
        continue
      }

      // Guard: skip if another worker already sent this message (VT expired race)
      if (payload.message_id) {
        const { data: alreadySent } = await supabase
          .from('email_send_log')
          .select('id')
          .eq('message_id', payload.message_id)
          .eq('status', 'sent')
          .maybeSingle()

        if (alreadySent) {
          try {
            log.warn("process_email_queue_duplicate_skip", {
              holzen_event: "process_email_queue_duplicate_skip",
              queue,
              msg_id: msg.msg_id,
              message_id: payload.message_id,
            });
          } catch {
            /* non-fatal */
          }
          const { error: dupDelError } = await supabase.rpc('delete_email', {
            queue_name: queue,
            message_id: msg.msg_id,
          })
          if (dupDelError) {
            try {
              log.error("process_email_queue_dup_delete_failed", {
                holzen_event: "process_email_queue_dup_delete_failed",
                queue,
                msg_id: msg.msg_id,
                detail: dupDelError.message,
              });
            } catch {
              /* non-fatal */
            }
          }
          continue
        }
      }

      const result = await sendTransactionalEmail(
        {
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          sender_domain: payload.sender_domain,
          purpose: payload.purpose,
          label: payload.label,
        },
        {
          source: queue,
          idempotencyKey: payload.idempotency_key,
          maxRetries: 0,
          logger: emailLogger,
        },
      )

      if (result.ok) {
        await supabase.from('email_send_log').insert({
          message_id: payload.message_id,
          template_name: payload.label || queue,
          recipient_email: payload.to,
          status: 'sent',
        })

        const { error: delError } = await supabase.rpc('delete_email', {
          queue_name: queue,
          message_id: msg.msg_id,
        })
        if (delError) {
          try {
            log.error("process_email_queue_delete_after_send_failed", {
              holzen_event: "process_email_queue_delete_after_send_failed",
              queue,
              msg_id: msg.msg_id,
              detail: delError.message,
            });
          } catch {
            /* non-fatal */
          }
        }
        totalProcessed++
      } else {
        const errorMsg = result.error ?? `HTTP ${result.status || "unknown"}`
        try {
          log.error("process_email_queue_send_failed", {
            holzen_event: "process_email_queue_send_failed",
            queue,
            msg_id: msg.msg_id,
            read_ct: msg.read_ct,
            failed_attempts: failedAttempts,
            http_status: result.status,
            recipient_host: typeof payload.to === "string" ? recipientHostFromEmail(payload.to) : null,
            detail: errorMsg.slice(0, 500),
          });
        } catch {
          /* non-fatal */
        }

        if (result.status === 429) {
          await supabase.from('email_send_log').insert({
            message_id: payload.message_id,
            template_name: payload.label || queue,
            recipient_email: payload.to,
            status: 'rate_limited',
            error_message: errorMsg.slice(0, 1000),
          })

          await supabase
            .from('email_send_state')
            .update({
              retry_after_until: new Date(Date.now() + 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', 1)

          return new Response(
            JSON.stringify({ processed: totalProcessed, stopped: 'rate_limited' }),
            { headers: { 'Content-Type': 'application/json' } }
          )
        }

        if (result.status === 403) {
          await moveToDlq(supabase, queue, msg, "Emails disabled for this project", log)
          return new Response(
            JSON.stringify({ processed: totalProcessed, stopped: 'emails_disabled' }),
            { headers: { 'Content-Type': 'application/json' } }
          )
        }

        await supabase.from('email_send_log').insert({
          message_id: payload.message_id,
          template_name: payload.label || queue,
          recipient_email: payload.to,
          status: 'failed',
          error_message: errorMsg.slice(0, 1000),
        })
        if (payload?.message_id && typeof payload.message_id === 'string') {
          failedAttemptsByMessageId.set(payload.message_id, failedAttempts + 1)
        }
      }

      // Small delay between sends to smooth bursts
      if (i < messages.length - 1) {
        await new Promise((r) => setTimeout(r, sendDelayMs))
      }
    }
  }

  return new Response(
    JSON.stringify({ processed: totalProcessed }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}))
