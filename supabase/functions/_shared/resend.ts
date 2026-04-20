/**
 * Shared Resend helper — one canonical place to call Resend from edge functions.
 *
 * Replaces the duplicated `fetch("https://api.resend.com/emails", …)` block
 * we had copied into 7+ edge functions. Adds:
 *
 *   - Exponential-backoff retries on 429 / 5xx (with Retry-After honoured when sent).
 *   - Optional `Idempotency-Key` header so cron retries never double-send.
 *   - A `sendResendBatch` that chunks into the `/emails/batch` endpoint
 *     (≤100 messages per call) — single HTTP round trip instead of N.
 *   - A tiny `ResendLogger` shim that works with both the
 *     `holzen-edge-log` helpers (cron jobs) and the `withRequestLogging`
 *     structured logger (HTTP handlers). Callers only have to wire up what
 *     they already have.
 *
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 *       https://resend.com/docs/api-reference/emails/send-batch-emails
 */

const RESEND_URL = "https://api.resend.com/emails";
const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";

/** Subset of Resend's email payload we actually use across the codebase. */
export interface ResendEmail {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string | string[];
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

/** Minimal logger surface. Works with both edge logger styles. */
export interface ResendLogger {
  log: (msg: string, data?: Record<string, unknown>) => void;
  error: (msg: string, data?: Record<string, unknown>) => void;
}

const NOOP_LOGGER: ResendLogger = {
  log: () => { /* noop */ },
  error: () => { /* noop */ },
};

export interface SendOptions {
  /** Override `Deno.env.get("RESEND_API_KEY")`. */
  apiKey?: string;
  /**
   * Deduplicate retries of the same send (≤256 chars, expires after 24h).
   * Typical pattern: `"<function>:<YYYY-MM-DD>:<userId>"` for cron jobs.
   */
  idempotencyKey?: string;
  /** How many retries on retryable status before giving up. Default 3. */
  maxRetries?: number;
  /** Base backoff. Sleeps `baseDelayMs * 2^attempt`. Default 500ms. */
  baseDelayMs?: number;
  logger?: ResendLogger;
  /** Tag passed into structured log lines so they're greppable per caller. */
  source?: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  /** Final HTTP status (0 on transport/abort failure). */
  status: number;
  attempts: number;
  /** Short, truncated error string when `ok` is false — safe for logs. */
  error?: string;
}

export interface BatchResult {
  ok: boolean;
  sent: number;
  failed: number;
  chunks: number;
  ids: string[];
  /** One entry per failed chunk. Truncated. */
  errors: string[];
}

/** Thrown when `RESEND_API_KEY` is missing. Callers decide whether to swallow. */
export class ResendConfigurationError extends Error {
  constructor(message = "RESEND_API_KEY not configured") {
    super(message);
    this.name = "ResendConfigurationError";
  }
}

function resolveApiKey(override?: string): string {
  const key = override ?? Deno.env.get("RESEND_API_KEY") ?? "";
  if (!key) throw new ResendConfigurationError();
  return key;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

function parseRetryAfterMs(res: Response): number | null {
  const h = res.headers.get("retry-after");
  if (!h) return null;
  const asInt = Number(h);
  if (Number.isFinite(asInt) && asInt >= 0) return asInt * 1000;
  const asDate = Date.parse(h);
  if (!Number.isNaN(asDate)) return Math.max(0, asDate - Date.now());
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function truncate(s: string, n = 200): string {
  return s.length > n ? s.slice(0, n) : s;
}

interface FetchResult {
  res: Response | null;
  err: unknown;
  attempts: number;
  /** Last status seen (0 when all attempts threw). */
  status: number;
}

/**
 * Retrying fetch tailored to Resend. Consumes the body of retryable failures
 * (so it can log the error) and returns the successful `Response` *with the
 * body still unread* for the caller to parse. On non-retryable failures the
 * `Response` is also returned unread so the caller can surface the error.
 */
async function fetchWithRetry(
  url: string,
  body: string,
  headers: Record<string, string>,
  opts: {
    maxRetries: number;
    baseDelayMs: number;
    logger: ResendLogger;
    source: string;
    operation: string;
  },
): Promise<FetchResult> {
  let attempts = 0;
  let lastErr: unknown = null;
  let status = 0;

  for (let i = 0; i <= opts.maxRetries; i++) {
    attempts = i + 1;
    try {
      const res = await fetch(url, { method: "POST", headers, body });
      status = res.status;
      if (res.ok) return { res, err: null, attempts, status };
      if (!isRetryableStatus(res.status)) {
        return { res, err: null, attempts, status };
      }
      // Retryable: drain body for a log line, then back off.
      const errText = await res.text().catch(() => "");
      opts.logger.log("resend_retry", {
        source: opts.source,
        operation: opts.operation,
        status: res.status,
        attempt: attempts,
        willRetry: i < opts.maxRetries,
        error: truncate(errText),
      });
      lastErr = new Error(`HTTP ${res.status}: ${truncate(errText)}`);
      if (i < opts.maxRetries) {
        const retryAfter = parseRetryAfterMs(res);
        const backoff = retryAfter ?? opts.baseDelayMs * Math.pow(2, i);
        await sleep(backoff);
      }
    } catch (e) {
      lastErr = e;
      opts.logger.log("resend_retry", {
        source: opts.source,
        operation: opts.operation,
        attempt: attempts,
        willRetry: i < opts.maxRetries,
        error: truncate(e instanceof Error ? e.message : String(e)),
        transport: true,
      });
      if (i < opts.maxRetries) {
        await sleep(opts.baseDelayMs * Math.pow(2, i));
      }
    }
  }

  return { res: null, err: lastErr, attempts, status };
}

/**
 * Send a single transactional email via Resend.
 *
 * Non-throwing by design — callers get a `SendResult` so they can decide
 * whether a failure is fatal (e.g. cron email missing) or best-effort
 * (e.g. Slack-style notify). The one exception: a missing `RESEND_API_KEY`
 * throws `ResendConfigurationError` (configuration bugs should be loud).
 */
export async function sendResendEmail(
  email: ResendEmail,
  opts: SendOptions = {},
): Promise<SendResult> {
  const apiKey = resolveApiKey(opts.apiKey);
  const logger = opts.logger ?? NOOP_LOGGER;
  const source = opts.source ?? "resend";
  const maxRetries = opts.maxRetries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 500;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const start = Date.now();
  const { res, err, attempts, status } = await fetchWithRetry(
    RESEND_URL,
    JSON.stringify(email),
    headers,
    { maxRetries, baseDelayMs, logger, source, operation: "emails.send" },
  );
  const duration_ms = Date.now() - start;

  if (res && res.ok) {
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    logger.log("dependency_call", {
      dep: "resend",
      status: "ok",
      operation: "emails.send",
      source,
      duration_ms,
      attempts,
    });
    return { ok: true, id: data?.id, status: res.status, attempts };
  }

  const errMsg = res
    ? `HTTP ${res.status}: ${truncate(await res.text().catch(() => ""))}`
    : err instanceof Error
      ? err.message
      : String(err ?? "unknown");

  logger.error("dependency_call", {
    dep: "resend",
    status: "error",
    operation: "emails.send",
    source,
    duration_ms,
    attempts,
    http_status: status,
    error: truncate(errMsg),
  });

  return { ok: false, status, attempts, error: errMsg };
}

/**
 * Send many emails in one or more `/emails/batch` calls. Automatically chunks
 * by 100 (Resend's hard limit). Each chunk is a separate retryable HTTP round
 * trip. Caller gets per-request summary plus the list of Resend ids on
 * success.
 */
export async function sendResendBatch(
  emails: ResendEmail[],
  opts: SendOptions = {},
): Promise<BatchResult> {
  if (emails.length === 0) {
    return { ok: true, sent: 0, failed: 0, chunks: 0, ids: [], errors: [] };
  }

  const apiKey = resolveApiKey(opts.apiKey);
  const logger = opts.logger ?? NOOP_LOGGER;
  const source = opts.source ?? "resend";
  const maxRetries = opts.maxRetries ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 500;

  let sent = 0;
  let failed = 0;
  let chunks = 0;
  const ids: string[] = [];
  const errors: string[] = [];

  for (let offset = 0; offset < emails.length; offset += 100) {
    const chunk = emails.slice(offset, offset + 100);
    chunks += 1;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    // Re-runs of the same cron produce the same key → no double-send.
    if (opts.idempotencyKey) {
      headers["Idempotency-Key"] = chunks === 1
        ? opts.idempotencyKey
        : `${opts.idempotencyKey}:${chunks}`;
    }

    const start = Date.now();
    const { res, err, attempts, status } = await fetchWithRetry(
      RESEND_BATCH_URL,
      JSON.stringify(chunk),
      headers,
      { maxRetries, baseDelayMs, logger, source, operation: "emails.batch" },
    );
    const duration_ms = Date.now() - start;

    if (res && res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { data?: Array<{ id?: string }> }
        | null;
      const chunkIds = (body?.data ?? [])
        .map((x) => x?.id)
        .filter((x): x is string => typeof x === "string" && x.length > 0);
      ids.push(...chunkIds);
      sent += chunk.length;
      logger.log("dependency_call", {
        dep: "resend",
        status: "ok",
        operation: "emails.batch",
        source,
        chunk: chunks,
        size: chunk.length,
        duration_ms,
        attempts,
      });
      continue;
    }

    failed += chunk.length;
    const errMsg = res
      ? `HTTP ${res.status}: ${truncate(await res.text().catch(() => ""))}`
      : err instanceof Error
        ? err.message
        : String(err ?? "unknown");
    errors.push(truncate(errMsg));
    logger.error("dependency_call", {
      dep: "resend",
      status: "error",
      operation: "emails.batch",
      source,
      chunk: chunks,
      size: chunk.length,
      duration_ms,
      attempts,
      http_status: status,
      error: truncate(errMsg),
    });
  }

  return { ok: failed === 0, sent, failed, chunks, ids, errors };
}

/**
 * Convenience adapter: build a `ResendLogger` from the `holzen-edge-log`
 * helpers (`holzenEdgeLog` / `holzenEdgeError`). Pre-binds the tag so callers
 * don't repeat themselves.
 */
export function holzenResendLogger(
  edgeLog: (msg: string, data?: Record<string, unknown>) => void,
  edgeError: (msg: string, err?: unknown) => void,
): ResendLogger {
  return {
    log: (msg, data) => edgeLog(msg, data),
    error: (msg, data) => edgeError(msg, data),
  };
}
