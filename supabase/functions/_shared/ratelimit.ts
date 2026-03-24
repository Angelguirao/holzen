/**
 * Per-user rate limiting for companion generation endpoints.
 * 
 * Checks the analytics_events table for recent generation calls from a user.
 * Returns whether the user is rate-limited and when they can retry.
 * 
 * Uses a simple sliding window approach: count events in the last N minutes.
 * This adds ~50ms of latency per check (single indexed query).
 */

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
      .in("event", [
        "signal_companion_ai_call",
        "zoom_out_ai_call",
        "historical_insight_ai_call",
        "pause_ai_call",
        "journal_prompt_ai_call",
        "suggest_grounding_ai_call",
        "night_reflection_ai_call",
        "reflection_insights_ai_call",
        "wallpaper_generation",
      ])
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
