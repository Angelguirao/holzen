/**
 * Shared observability helpers for companion edge functions.
 * Centralises cost tracking, attempt logging, and analytics events.
 */

// ── Cost estimation per 1M tokens [input, output] in USD ──
export const COST_MAP: Record<string, [number, number]> = {
  "sonar-pro": [3, 15],
  "sonar": [1, 5],
  "google/gemini-2.5-flash": [0.15, 0.6],
  "google/gemini-3-flash-preview": [0.15, 0.6],
  "google/gemini-2.5-flash-lite": [0.075, 0.3],
};

interface AttemptParams {
  companion_type: string;
  provider: string;
  model: string;
  status: string;  // "success" | "error" | "timeout" | "quality_gate_failed"
  latency_ms: number;
  input_tokens?: number;
  output_tokens?: number;
  error_message?: string;
  quality_gate_reason?: string;
}

/**
 * Create an attempt logger bound to a service client.
 * Returns a function that logs generation attempts with cost estimation.
 */
export function createAttemptLogger(svcClient: any) {
  let attemptOrder = 0;

  return (params: AttemptParams) => {
    attemptOrder++;
    const costs = COST_MAP[params.model] || [0.5, 1.5];
    const inTok = params.input_tokens || 0;
    const outTok = params.output_tokens || 0;
    const cost = inTok > 0 || outTok > 0
      ? (inTok * costs[0] + outTok * costs[1]) / 1_000_000
      : null;

    // Fire-and-forget for attempt logging (high volume, non-critical)
    svcClient.from("generation_attempts").insert({
      ...params,
      attempt_order: attemptOrder,
      estimated_cost_usd: cost,
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
 * Create a timestamped logger with a prefix.
 */
export function createLogger(prefix: string) {
  const t0 = Date.now();
  return (msg: string) => console.log(`[${prefix}] ${msg} (+${Date.now() - t0}ms)`);
}
