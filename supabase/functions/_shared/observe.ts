/**
 * Shared observability helpers for companion edge functions.
 * Centralises cost tracking, attempt logging, and analytics events.
 */

// ── Cost estimation per 1M tokens [input, output] in USD ──
// Default costs; can be overridden via COST_MAP_OVERRIDE env var
// (JSON string, e.g. '{"google/gemini-2.5-flash":[0.15,0.6]}')
const DEFAULT_COST_MAP: Record<string, [number, number]> = {
  "sonar-pro": [3, 15],
  // Perplexity sonar: $1/M in and out (see dashboard / docs; not $5/M output)
  "sonar": [1, 1],
  "google/gemini-2.5-flash": [0.15, 0.6],
  "google/gemini-3-flash-preview": [0.15, 0.6],
  "google/gemini-2.5-flash-lite": [0.075, 0.3],
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
  /** Reflection ID to associate with all attempts (for session correlation) */
  reflectionId?: string;
}

/**
 * Create an attempt logger bound to a service client.
 * Returns a function that logs generation attempts with cost estimation.
 *
 * Pass userId and reflectionId in options to enable per-user cost attribution
 * and per-session debugging. These columns are nullable in generation_attempts —
 * if the DB doesn't have them yet, the insert still succeeds (Supabase ignores
 * unknown columns in inserts when not using strict mode).
 *
 * SQL migration to add these columns:
 * ```sql
 * ALTER TABLE generation_attempts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
 * ALTER TABLE generation_attempts ADD COLUMN IF NOT EXISTS reflection_id uuid REFERENCES reflections(id);
 * CREATE INDEX IF NOT EXISTS idx_generation_attempts_user_id ON generation_attempts(user_id);
 * CREATE INDEX IF NOT EXISTS idx_generation_attempts_reflection_id ON generation_attempts(reflection_id);
 * ```
 */
export function createAttemptLogger(svcClient: any, options?: AttemptLoggerOptions) {
  let attemptOrder = 0;
  const userId = options?.userId ?? null;
  const reflectionId = options?.reflectionId ?? null;

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
      ...(reflectionId ? { reflection_id: reflectionId } : {}),
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
 * Falls back to simple console.log format for readability in dev.
 */
export function createLogger(prefix: string, correlationId?: string) {
  const t0 = Date.now();
  const cid = correlationId || crypto.randomUUID().slice(0, 8);

  const log = (msg: string, level: "info" | "warn" | "error" = "info", extra?: Record<string, unknown>) => {
    const entry = {
      ts: new Date().toISOString(),
      fn: prefix,
      cid,
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
  };

  // Return a callable that defaults to info level, with .warn and .error methods
  const logger = (msg: string, extra?: Record<string, unknown>) => log(msg, "info", extra);
  logger.warn = (msg: string, extra?: Record<string, unknown>) => log(msg, "warn", extra);
  logger.error = (msg: string, extra?: Record<string, unknown>) => log(msg, "error", extra);
  logger.cid = cid;
  logger.t0 = t0;

  return logger;
}
