/**
 * Per-user rate limiting for companion generation endpoints.
 *
 * Checks the analytics_events table for recent generation calls from a user.
 * Returns whether the user is rate-limited and when they can retry.
 *
 * Uses a simple sliding window approach: count events in the last N minutes.
 * This adds ~50ms of latency per check (single indexed query).
 *
 * **Sliding-window allowlist** — every value here must have at least one insert path
 * (generators, orchestrator, or standalone edge function), or limits drift loose/tight.
 *
 * | `event` | Inserted from |
 * |---------|----------------|
 * | `signal_companion_ai_call` | `generators/signal.ts` (source `live`) |
 * | `zoom_out_ai_call` | `generators/zoom-out.ts` (deep-time `live`) |
 * | `historical_insight_ai_call` | `generators/history.ts` (source `live`) |
 * | `ground_nudge_ai_call` | `generators/grounding.ts` (source `live`) |
 * | `intervention_question_ai_call` | `companion-orchestrate` after successful `generateQuestion` |
 * | `pause_ai_call` | `holzen-reflect`, `check-volatility` |
 * | `journal_prompt_ai_call` | `journal-prompt` |
 * | `suggest_grounding_ai_call` | `suggest-grounding` |
 * | `night_reflection_ai_call` | `night-reflection` |
 * | `reflection_insights_ai_call` | `reflection-insights` |
 * | `wallpaper_generation` | `generate-wallpaper` |
 *
 * Not counted: `intervention_selected`, `reflection_generated`, `companion_fallback_*`, `companion_feedback`, etc.
 */

/** Event names included in `checkRateLimit` sliding-window count (keep in sync with inserts). */
export const CHECK_RATE_LIMIT_ANALYTICS_EVENTS = [
  "signal_companion_ai_call",
  "zoom_out_ai_call",
  "historical_insight_ai_call",
  "ground_nudge_ai_call",
  "intervention_question_ai_call",
  "pause_ai_call",
  "journal_prompt_ai_call",
  "suggest_grounding_ai_call",
  "night_reflection_ai_call",
  "reflection_insights_ai_call",
  "wallpaper_generation",
] as const;

interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  reason?: string;
}

/**
 * Check if a user has exceeded their generation rate limit.
 * 
 * @param svcClient - Supabase service client
 * @param userId - User ID to check
 * @param windowMinutes - Time window in minutes (default: 60)
 * @param maxRequests - Max requests in the window (default: 30)
 * @returns Whether the request is allowed
 */
export async function checkRateLimit(
  svcClient: any,
  userId: string,
  windowMinutes = 60,
  maxRequests = 30,
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const { count, error } = await svcClient
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("event", [...CHECK_RATE_LIMIT_ANALYTICS_EVENTS])
      .gte("created_at", windowStart);

    if (error) {
      // If we can't check, allow the request (fail open)
      console.warn("[ratelimit] Failed to check rate limit:", error.message);
      return { allowed: true };
    }

    if ((count ?? 0) >= maxRequests) {
      // Estimate when the oldest event in the window will expire
      const retryAfterMs = windowMinutes * 60 * 1000 / maxRequests;
      return {
        allowed: false,
        retryAfterMs,
        reason: `Rate limited: ${count} requests in the last ${windowMinutes} minutes (max ${maxRequests})`,
      };
    }

    return { allowed: true };
  } catch (e) {
    // Fail open on errors
    console.warn("[ratelimit] Rate limit check failed:", e);
    return { allowed: true };
  }
}

/**
 * Check daily budget against a configurable cap.
 * Uses the generation_attempts table to sum estimated costs.
 * 
 * @param svcClient - Supabase service client
 * @param dailyBudgetUsd - Maximum daily budget in USD (default: 10.00)
 * @returns Whether generation is within budget
 */
export async function checkDailyBudget(
  svcClient: any,
  dailyBudgetUsd = 10.0,
): Promise<{ allowed: boolean; currentSpend?: number; reason?: string }> {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { data, error } = await svcClient
      .from("generation_attempts")
      .select("estimated_cost_usd")
      .gte("created_at", todayStart.toISOString())
      .not("estimated_cost_usd", "is", null);

    if (error) {
      console.warn("[budget] Failed to check daily budget:", error.message);
      return { allowed: true }; // Fail open
    }

    const totalSpend = (data ?? []).reduce(
      (sum: number, row: any) => sum + (row.estimated_cost_usd || 0),
      0,
    );

    if (totalSpend >= dailyBudgetUsd) {
      return {
        allowed: false,
        currentSpend: totalSpend,
        reason: `Daily budget exceeded: $${totalSpend.toFixed(4)} / $${dailyBudgetUsd.toFixed(2)}`,
      };
    }

    return { allowed: true, currentSpend: totalSpend };
  } catch (e) {
    console.warn("[budget] Budget check failed:", e);
    return { allowed: true }; // Fail open
  }
}

/**
 * Per-user limit for targeted companion regeneration (companion-orchestrate regenerateOnly).
 * Counts analytics_events.companion_regenerate in the last windowHours.
 */
export async function checkCompanionRegenerateLimit(
  svcClient: any,
  userId: string,
  windowHours = 24,
  maxRegenerates = 12,
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();
    const { count, error } = await svcClient
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event", "companion_regenerate")
      .gte("created_at", windowStart);

    if (error) {
      console.warn("[ratelimit] regenerate limit check failed:", error.message);
      return { allowed: true };
    }
    if ((count ?? 0) >= maxRegenerates) {
      return {
        allowed: false,
        reason: `Regenerate limit: ${count} in the last ${windowHours}h (max ${maxRegenerates})`,
      };
    }
    return { allowed: true };
  } catch (e) {
    console.warn("[ratelimit] regenerate limit error:", e);
    return { allowed: true };
  }
}
