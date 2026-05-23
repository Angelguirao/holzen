/**
 * Shared transactional email helper — Resend (preferred) or Lovable Email (legacy).
 */
import { sendLovableEmail as sendLovableEmailApi } from "npm:@lovable.dev/email-js";

/** Subset of payload fields we use across edge functions. */
export interface LovableEmail {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  sender_domain?: string;
  purpose?: string;
  label?: string;
}

/** Minimal logger surface. */
export interface LovableEmailLogger {
  log: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, data?: Record<string, unknown>) => void;
}

const NOOP_LOGGER: LovableEmailLogger = {
  log: () => { /* noop */ },
  error: () => { /* noop */ },
};

const DEFAULT_SENDER_DOMAIN = "notify.holzen.app";

export interface SendOptions {
  /** Override `Deno.env.get("LOVABLE_API_KEY")`. */
  apiKey?: string;
  /** Optional Lovable endpoint override (dev/testing). */
  sendUrl?: string;
  /** Optional sender domain override; defaults to notify.holzen.app. */
  senderDomain?: string;
  /** Deduplicate retries of the same send. */
  idempotencyKey?: string;
  /** Retries on retryable status before giving up. Default 3. */
  maxRetries?: number;
  /** Base backoff. Sleeps `baseDelayMs * 2^attempt`. Default 500ms. */
  baseDelayMs?: number;
  logger?: LovableEmailLogger;
  source?: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  status: number;
  attempts: number;
  error?: string;
}

export interface BatchResult {
  ok: boolean;
  sent: number;
  failed: number;
  chunks: number;
  ids: string[];
  errors: string[];
}

export class LovableEmailConfigurationError extends Error {
  constructor(message = "RESEND_API_KEY or LOVABLE_API_KEY not configured") {
    super(message);
    this.name = "LovableEmailConfigurationError";
  }
}

type EmailBackend = "resend" | "lovable";

function resolveEmailBackend(opts: SendOptions): { backend: EmailBackend; apiKey: string } {
  const resend = opts.apiKey?.startsWith("re_")
    ? opts.apiKey
    : Deno.env.get("RESEND_API_KEY")?.trim();
  if (resend) return { backend: "resend", apiKey: resend };

  const lovable = opts.apiKey ?? Deno.env.get("LOVABLE_API_KEY") ?? "";
  if (lovable) return { backend: "lovable", apiKey: lovable };

  throw new LovableEmailConfigurationError();
}

async function sendViaResend(
  email: LovableEmail,
  apiKey: string,
  to: string,
  text: string,
): Promise<{ message_id?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: email.from,
      to: [to],
      subject: email.subject,
      html: email.html,
      text,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    const err = new Error(`Resend HTTP ${res.status}: ${truncate(errText)}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const data = await res.json() as { id?: string };
  return { message_id: data.id };
}

function resolveApiKey(override?: string): string {
  return resolveEmailBackend({ apiKey: override }).apiKey;
}

function resolveSenderDomain(override?: string): string {
  return override ??
    Deno.env.get("LOVABLE_SENDER_DOMAIN") ??
    Deno.env.get("EMAIL_SENDER_DOMAIN") ??
    DEFAULT_SENDER_DOMAIN;
}

function truncate(s: string, n = 200): string {
  return s.length > n ? s.slice(0, n) : s;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function getErrorStatus(error: unknown): number {
  if (error && typeof error === "object" && "status" in error) {
    const status = Number((error as { status?: unknown }).status);
    if (Number.isFinite(status)) return status;
  }
  return 0;
}

function getRetryAfterMs(error: unknown): number | null {
  if (error && typeof error === "object" && "retryAfterSeconds" in error) {
    const seconds = Number((error as { retryAfterSeconds?: unknown }).retryAfterSeconds);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }
  return null;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

/**
 * Derive a plain-text version of an HTML email body. Lovable Email API
 * rejects sends with empty `text` (`missing_parameter: text`), so callers
 * that only provide HTML get a reasonable fallback.
 */
function htmlToPlainText(html: string): string {
  if (!html) return " ";
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>(?!\n)/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length > 0 ? text : " ";
}

export async function sendLovableEmailMessage(
  email: LovableEmail,
  opts: SendOptions = {},
): Promise<SendResult> {
  const emailBackend = resolveEmailBackend(opts);
  const logger = opts.logger ?? NOOP_LOGGER;
  const source = opts.source ?? "lovable-email";
  const maxRetries = opts.maxRetries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 500;
  const senderDomain = email.sender_domain ?? resolveSenderDomain(opts.senderDomain);
  const to = Array.isArray(email.to) ? email.to[0] : email.to;
  const plainText =
    email.text && email.text.trim().length > 0
      ? email.text
      : htmlToPlainText(email.html);
  let attempts = 0;
  let status = 0;
  let lastError: string | undefined;
  const start = Date.now();

  for (let i = 0; i <= maxRetries; i++) {
    attempts = i + 1;
    try {
      if (emailBackend.backend === "resend") {
        const res = await sendViaResend(email, emailBackend.apiKey, to, plainText);
        logger.log("dependency_call", {
          dep: "resend-email",
          status: "ok",
          operation: "emails.send",
          source,
          duration_ms: Date.now() - start,
          attempts,
        });
        return { ok: true, id: res?.message_id, status: 200, attempts };
      }

      const res = await sendLovableEmailApi(
        {
          to,
          from: email.from,
          sender_domain: senderDomain,
          subject: email.subject,
          html: email.html,
          text: plainText,
          purpose: email.purpose ?? "transactional",
          label: email.label ?? source,
          idempotency_key: opts.idempotencyKey,
        },
        { apiKey: emailBackend.apiKey, sendUrl: opts.sendUrl },
      );
      logger.log("dependency_call", {
        dep: "lovable-email",
        status: "ok",
        operation: "emails.send",
        source,
        duration_ms: Date.now() - start,
        attempts,
      });
      return { ok: true, id: res?.message_id, status: 200, attempts };
    } catch (e) {
      status = getErrorStatus(e);
      const errText = truncate(e instanceof Error ? e.message : String(e ?? "unknown"));
      lastError = errText;
      const retryable = status === 0 || isRetryableStatus(status);
      logger.log("lovable_email_retry", {
        source,
        operation: "emails.send",
        status,
        attempt: attempts,
        willRetry: retryable && i < maxRetries,
        error: errText,
      });

      if (retryable && i < maxRetries) {
        const retryAfter = status === 429 ? getRetryAfterMs(e) : null;
        await sleep(retryAfter ?? baseDelayMs * Math.pow(2, i));
        continue;
      }
      break;
    }
  }

  logger.error("dependency_call", {
    dep: "lovable-email",
    status: "error",
    operation: "emails.send",
    source,
    duration_ms: Date.now() - start,
    attempts,
    http_status: status,
    error: truncate(lastError ?? "unknown"),
  });

  return {
    ok: false,
    status,
    attempts,
    error: lastError ?? "unknown",
  };
}

export async function sendLovableEmailBatch(
  emails: LovableEmail[],
  opts: SendOptions = {},
): Promise<BatchResult> {
  if (emails.length === 0) {
    return { ok: true, sent: 0, failed: 0, chunks: 0, ids: [], errors: [] };
  }

  let sent = 0;
  let failed = 0;
  let chunks = 0;
  const ids: string[] = [];
  const errors: string[] = [];

  for (let offset = 0; offset < emails.length; offset += 100) {
    const chunk = emails.slice(offset, offset + 100);
    chunks += 1;
    for (let i = 0; i < chunk.length; i++) {
      const message = chunk[i];
      const itemKey = opts.idempotencyKey
        ? `${opts.idempotencyKey}:${chunks}:${i + 1}`
        : undefined;
      const result = await sendLovableEmailMessage(message, {
        ...opts,
        idempotencyKey: itemKey,
      });
      if (result.ok) {
        sent += 1;
        if (result.id) ids.push(result.id);
      } else {
        failed += 1;
        if (result.error) errors.push(truncate(result.error));
      }
    }
  }

  return { ok: failed === 0, sent, failed, chunks, ids, errors };
}

export function holzenLovableEmailLogger(
  edgeLog: (msg: string, data?: Record<string, unknown>) => void,
  edgeError: (msg: string, err?: unknown) => void,
): LovableEmailLogger {
  return {
    log: (msg, data) => edgeLog(msg, data),
    error: (msg, data) => edgeError(msg, data),
  };
}
