/**
 * Shared observability helpers for companion edge functions.
 * Centralises cost tracking, attempt logging, and analytics events.
 */

import { EDGE_RELEASE } from "./release.ts";

// ── Cost estimation per 1M tokens [input, output] in USD ──
// Default costs; can be overridden via COST_MAP_OVERRIDE env var
// (JSON string, e.g. '{"google/gemini-2.5-flash":[0.15,0.6]}')
// NOTE: prices last verified 2026-04-19 against Perplexity + Google (via
// Lovable docs, which explicitly state parity with provider list pricing).
// See docs/systems/costs/ai-cost-model.md §1 for sources. Re-verify quarterly.
const DEFAULT_COST_MAP: Record<string, [number, number]> = {
  // Perplexity — token rates unchanged, request fee handled separately below.
  "sonar-pro": [3, 15],
  // Perplexity sonar: $1/M in and out (see dashboard / docs; not $5/M output)
  "sonar": [1, 1],
  // Google Gemini 2.5 Flash — GA pricing (Aug 2025). Previously we used the
  // preview tiered rate [0.15, 0.60]; actual is [0.30, 2.50] post-GA.
  "google/gemini-2.5-flash": [0.3, 2.5],
  // Google Gemini 3 Flash Preview — released Dec 2025. Batch/flex tier is
  // half, but most of our traffic is real-time so we use list.
  "google/gemini-3-flash-preview": [0.5, 3.0],
  // Google Gemini 2.5 Flash Lite — current GA rate.
  "google/gemini-2.5-flash-lite": [0.1, 0.4],
  // Gemini image model bills output tokens at a premium (~1290 output tokens
  // per image → ~$0.039 / image). Input stays at text-prompt rates.
  "google/gemini-2.5-flash-image": [0.3, 30],
};

/** USD per Chat Completions API request (Perplexity bills separately from tokens). */
const DEFAULT_PERPLEXITY_REQUEST_FEE_USD: Record<string, number> = {
  "sonar-pro": 0.006,
  "sonar": 0.005,
};

function loadCostMap(): Record<string, [number, number]> {
  try {
    const override = typeof Deno !== "undefined" ? Deno.env.get("COST_MAP_OVERRIDE") : undefined;
    if (override) {
      const parsed = JSON.parse(override);
      return { ...DEFAULT_COST_MAP, ...parsed };
    }
  } catch (e) {
    console.warn("[observe] Failed to parse COST_MAP_OVERRIDE, using defaults:", e);
  }
  return DEFAULT_COST_MAP;
}

function loadPerplexityRequestFees(): Record<string, number> {
  try {
    const override = typeof Deno !== "undefined" ? Deno.env.get("PERPLEXITY_REQUEST_FEE_USD_JSON") : undefined;
    if (override) {
      const parsed = JSON.parse(override);
      return { ...DEFAULT_PERPLEXITY_REQUEST_FEE_USD, ...parsed };
    }
  } catch (e) {
    console.warn("[observe] Failed to parse PERPLEXITY_REQUEST_FEE_USD_JSON, using defaults:", e);
  }
  return { ...DEFAULT_PERPLEXITY_REQUEST_FEE_USD };
}

export const COST_MAP = loadCostMap();
export const PERPLEXITY_REQUEST_FEE_USD = loadPerplexityRequestFees();

function estimateCostUsd(params: {
  model: string;
  input_tokens?: number;
  output_tokens?: number;
  api_requests?: number;
}): number | null {
  const costs = COST_MAP[params.model] || [0.5, 1.5];
  const inTok = params.input_tokens ?? 0;
  const outTok = params.output_tokens ?? 0;
  const tokenCost = (inTok * costs[0] + outTok * costs[1]) / 1_000_000;
  const reqFee = PERPLEXITY_REQUEST_FEE_USD[params.model] ?? 0;
  const requestCost = (params.api_requests ?? 0) * reqFee;
  const total = tokenCost + requestCost;
  if (inTok === 0 && outTok === 0 && (params.api_requests ?? 0) === 0) return null;
  return total;
}

interface AttemptParams {
  companion_type: string;
  provider: string;
  model: string;
  status: string;  // "success" | "error" | "timeout" | "quality_gate_failed"
  latency_ms: number;
  input_tokens?: number;
  output_tokens?: number;
  /** Perplexity: number of billable API calls (for per-request fee). Omitted from DB insert. */
  api_requests?: number;
  error_message?: string;
  quality_gate_reason?: string;
}

interface AttemptLoggerOptions {
  /** User ID to associate with all attempts (for cost attribution) */
  userId?: string;
  /** Pause instance ID to associate with all attempts (for session correlation) */
  pauseInstanceId?: string;
}

/**
 * Create an attempt logger bound to a service client.
 * Returns a function that logs generation attempts with cost estimation.
 *
 * Pass `userId` and (optionally) `pauseInstanceId` via the caller's payload
 * when building `AttemptLoggerOptions`. `generation_attempts.pause_instance_id`
 * is added in migration 20260423201300. Nullable; if the column hasn't been
 * applied yet the insert still succeeds (Supabase ignores unknown columns in
 * inserts when not using strict mode). The legacy `reflection_id` column was
 * dropped in the Pause V2 destructive cutover migration.
 */
export function createAttemptLogger(svcClient: any, options?: AttemptLoggerOptions) {
  let attemptOrder = 0;
  const userId = options?.userId ?? null;
  const pauseInstanceId = options?.pauseInstanceId ?? null;

  return (params: AttemptParams) => {
    attemptOrder++;
    const { api_requests: _apiRequests, ...rowParams } = params;
    const cost = estimateCostUsd({
      model: params.model,
      input_tokens: params.input_tokens,
      output_tokens: params.output_tokens,
      api_requests: params.api_requests,
    });

    // Fire-and-forget for attempt logging (high volume, non-critical)
    svcClient.from("generation_attempts").insert({
      ...rowParams,
      attempt_order: attemptOrder,
      estimated_cost_usd: cost,
      ...(userId ? { user_id: userId } : {}),
      ...(pauseInstanceId ? { pause_instance_id: pauseInstanceId } : {}),
    }).then(() => {});
  };
}

/**
 * Create an analytics event tracker bound to a user and service client.
 * Fire-and-forget — analytics events are non-critical.
 */
export function createObsTracker(svcClient: any, userId: string, companionType: string, t0: number) {
  return (event: string, meta?: Record<string, any>) => {
    svcClient.from("analytics_events").insert({
      user_id: userId,
      event,
      metadata: {
        companion_type: companionType,
        latency_ms: Date.now() - t0,
        ...meta,
      },
    }).then(() => {});
  };
}

/**
 * Track a simple analytics event (fire-and-forget).
 */
export function trackEvent(svcClient: any, userId: string, event: string) {
  svcClient.from("analytics_events").insert({ user_id: userId, event }).then(() => {});
}

/**
 * Create a structured JSON logger with a prefix and correlation ID.
 *
 * Each log entry includes:
 * - ts: ISO timestamp
 * - fn: function name (prefix)
 * - cid: correlation ID (unique per request)
 * - elapsed_ms: time since logger creation
 * - msg: the log message
 * - level: "info" | "warn" | "error"
 * - extra: optional additional data
 *
 * Every entry is written to stdout (picked up by the Supabase log stream) AND,
 * when `LOG_DRAIN_URL` + `LOG_DRAIN_TOKEN` are configured, fire-and-forget
 * POSTed to BetterStack for structured querying + alerting. The drain POST
 * never throws and never blocks the response — failures are swallowed.
 *
 * `release`, `environment`, and `service` are attached so logs from multiple
 * deployed functions can be filtered / grouped in BetterStack.
 */
export interface CreateLoggerOptions {
  /**
   * Frontend release (`x-app-version` header) for this request. Included on
   * every log entry as `frontend_release` so BetterStack queries can filter
   * edge logs by which frontend build triggered them — parallel to the
   * `frontend_release` Sentry tag set by `captureEdgeError`.
   */
  frontendRelease?: string;
}

export function createLogger(
  prefix: string,
  correlationId?: string,
  options?: CreateLoggerOptions,
) {
  const t0 = Date.now();
  const cid = correlationId || crypto.randomUUID().slice(0, 8);
  const frontendRelease = options?.frontendRelease;

  // Resolve drain settings lazily — edge functions share this module, so doing it once
  // per logger is fine and lets us pick up runtime env changes in long-lived invocations.
  const drainUrl = typeof Deno !== "undefined" ? Deno.env.get("LOG_DRAIN_URL") ?? "" : "";
  const drainToken = typeof Deno !== "undefined" ? Deno.env.get("LOG_DRAIN_TOKEN") ?? "" : "";
  // Release resolution matches `_shared/sentry.ts`: env overrides first, then the
  // committed `EDGE_RELEASE` stamp. Having the same field value across Sentry +
  // BetterStack log lines is what lets us pivot from a log to its Sentry event by
  // `release` when debugging a specific deploy.
  const release = typeof Deno !== "undefined"
    ? Deno.env.get("SENTRY_RELEASE") ?? Deno.env.get("APP_VERSION") ?? EDGE_RELEASE ?? "unknown"
    : EDGE_RELEASE ?? "unknown";
  const environment = typeof Deno !== "undefined"
    ? Deno.env.get("SENTRY_ENVIRONMENT") ?? "production"
    : "production";

  const forwardToDrain = (entry: Record<string, unknown>) => {
    if (!drainUrl) return;
    try {
      // Fire-and-forget. `.catch` prevents an unhandled-rejection warning in the edge runtime.
      fetch(drainUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(drainToken ? { authorization: `Bearer ${drainToken}` } : {}),
        },
        body: JSON.stringify(entry),
      }).catch(() => { /* drain failure must never break the request */ });
    } catch {
      /* synchronous fetch() throws only on malformed URL — don't crash */
    }
  };

  const log = (msg: string, level: "info" | "warn" | "error" = "info", extra?: Record<string, unknown>) => {
    const entry = {
      ts: new Date().toISOString(),
      fn: prefix,
      service: prefix,
      cid,
      release,
      ...(frontendRelease ? { frontend_release: frontendRelease } : {}),
      environment,
      elapsed_ms: Date.now() - t0,
      level,
      msg,
      ...(extra ? { extra } : {}),
    };

    if (level === "error") {
      console.error(JSON.stringify(entry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }

    forwardToDrain(entry);
  };

  // Return a callable that defaults to info level, with .warn and .error methods
  const logger = (msg: string, extra?: Record<string, unknown>) => log(msg, "info", extra);
  logger.warn = (msg: string, extra?: Record<string, unknown>) => log(msg, "warn", extra);
  logger.error = (msg: string, extra?: Record<string, unknown>) => log(msg, "error", extra);
  logger.cid = cid;
  logger.t0 = t0;

  return logger;
}
