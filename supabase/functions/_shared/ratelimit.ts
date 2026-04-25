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

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

/**
 * When a limit/budget DB check errors, we fail open (allow). Emit one JSON line so Edge log
 * drains can grep/alert: `holzen_event":"limit_check_fail_open"` or substring `limit_check_fail_open`.
 */
function logLimitCheckFailOpen(
  scope:
    | "rate_limit"
    | "daily_budget"
    | "companion_regenerate"
    | "cost_ceilings"
    | "feature_flag",
  phase: "supabase_error" | "thrown",
  detail: string,
): void {
  const safe = (detail || "").slice(0, 500);
  try {
    console.warn(
      JSON.stringify({
        holzen_event: "limit_check_fail_open",
        scope,
        phase,
        detail: safe,
        ts: new Date().toISOString(),
      }),
    );
  } catch {
    console.warn(`[ratelimit] limit_check_fail_open scope=${scope} phase=${phase} ${safe}`);
  }
}

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
  svcClient: SupabaseClient,
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
      logLimitCheckFailOpen("rate_limit", "supabase_error", error.message ?? String(error));
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
    logLimitCheckFailOpen(
      "rate_limit",
      "thrown",
      e instanceof Error ? e.message : String(e),
    );
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
  svcClient: SupabaseClient,
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
      logLimitCheckFailOpen("daily_budget", "supabase_error", error.message ?? String(error));
      return { allowed: true };
    }

    const totalSpend = (data ?? []).reduce(
      (sum: number, row: { estimated_cost_usd?: number | null }) =>
        sum + (Number(row.estimated_cost_usd) || 0),
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
    logLimitCheckFailOpen(
      "daily_budget",
      "thrown",
      e instanceof Error ? e.message : String(e),
    );
    return { allowed: true };
  }
}

/**
 * Multi-ceiling cost check: global daily, per-user daily, global monthly.
 *
 * Any ceiling that is `undefined` is skipped. Fails open on DB errors (logged).
 * The heavy-hitters (`companion-orchestrate`, `regenerate-only`) should prefer
 * this over the legacy single-cap `checkDailyBudget`. Every other AI function
 * should wrap its entry with `guardAiFeature` (see below), which calls this
 * internally with values from `app_config`.
 */
export interface CostCeilingsResult {
  allowed: boolean;
  reason?: string;
  /** Which ceiling tripped first (for structured logging). */
  tripped?: "daily_global" | "daily_user" | "monthly_global";
  currentGlobalDailyUsd?: number;
  currentUserDailyUsd?: number;
  currentGlobalMonthlyUsd?: number;
}

export async function checkCostCeilings(
  svcClient: SupabaseClient,
  opts: {
    /** Global cap per UTC day. Skipped if undefined. */
    dailyGlobalUsd?: number;
    /** Per-user cap per UTC day. Requires userId. Skipped if undefined/no userId. */
    dailyPerUserUsd?: number;
    /** Global cap per UTC month. Skipped if undefined. */
    monthlyGlobalUsd?: number;
    userId?: string;
  },
): Promise<CostCeilingsResult> {
  try {
    const startOfDayUtc = new Date();
    startOfDayUtc.setUTCHours(0, 0, 0, 0);
    const startOfMonthUtc = new Date(
      Date.UTC(startOfDayUtc.getUTCFullYear(), startOfDayUtc.getUTCMonth(), 1, 0, 0, 0, 0),
    );

    // Run the three queries in parallel — worst case ~1 round trip each at the edge.
    const queries: Array<Promise<{ scope: string; total: number } | null>> = [];

    if (typeof opts.dailyGlobalUsd === "number") {
      queries.push(
        Promise.resolve(
          svcClient
            .from("generation_attempts")
            .select("estimated_cost_usd")
            .gte("created_at", startOfDayUtc.toISOString())
            .not("estimated_cost_usd", "is", null),
        ).then(({ data, error }: { data: unknown; error: unknown }) => {
            if (error) return null;
            const total = ((data as Array<{ estimated_cost_usd: number | null }>) ?? []).reduce(
              (s, r) => s + (Number(r.estimated_cost_usd) || 0),
              0,
            );
            return { scope: "daily_global", total };
          }),
      );
    }

    if (typeof opts.dailyPerUserUsd === "number" && opts.userId) {
      queries.push(
        Promise.resolve(
          svcClient
            .from("generation_attempts")
            .select("estimated_cost_usd")
            .eq("user_id", opts.userId)
            .gte("created_at", startOfDayUtc.toISOString())
            .not("estimated_cost_usd", "is", null),
        ).then(({ data, error }: { data: unknown; error: unknown }) => {
            if (error) return null;
            const total = ((data as Array<{ estimated_cost_usd: number | null }>) ?? []).reduce(
              (s, r) => s + (Number(r.estimated_cost_usd) || 0),
              0,
            );
            return { scope: "daily_user", total };
          }),
      );
    }

    if (typeof opts.monthlyGlobalUsd === "number") {
      queries.push(
        Promise.resolve(
          svcClient
            .from("generation_attempts")
            .select("estimated_cost_usd")
            .gte("created_at", startOfMonthUtc.toISOString())
            .not("estimated_cost_usd", "is", null),
        ).then(({ data, error }: { data: unknown; error: unknown }) => {
            if (error) return null;
            const total = ((data as Array<{ estimated_cost_usd: number | null }>) ?? []).reduce(
              (s, r) => s + (Number(r.estimated_cost_usd) || 0),
              0,
            );
            return { scope: "monthly_global", total };
          }),
      );
    }

    if (queries.length === 0) return { allowed: true };

    const results = await Promise.all(queries);
    const byScope: Record<string, number> = {};
    for (const r of results) {
      if (r) byScope[r.scope] = r.total;
    }

    const out: CostCeilingsResult = {
      allowed: true,
      currentGlobalDailyUsd: byScope.daily_global,
      currentUserDailyUsd: byScope.daily_user,
      currentGlobalMonthlyUsd: byScope.monthly_global,
    };

    if (
      typeof opts.dailyGlobalUsd === "number" &&
      byScope.daily_global !== undefined &&
      byScope.daily_global >= opts.dailyGlobalUsd
    ) {
      return {
        ...out,
        allowed: false,
        tripped: "daily_global",
        reason: `Daily budget exceeded: $${byScope.daily_global.toFixed(4)} / $${opts.dailyGlobalUsd.toFixed(2)}`,
      };
    }
    if (
      typeof opts.dailyPerUserUsd === "number" &&
      opts.userId &&
      byScope.daily_user !== undefined &&
      byScope.daily_user >= opts.dailyPerUserUsd
    ) {
      return {
        ...out,
        allowed: false,
        tripped: "daily_user",
        reason: `Per-user daily cap exceeded: $${byScope.daily_user.toFixed(4)} / $${opts.dailyPerUserUsd.toFixed(2)}`,
      };
    }
    if (
      typeof opts.monthlyGlobalUsd === "number" &&
      byScope.monthly_global !== undefined &&
      byScope.monthly_global >= opts.monthlyGlobalUsd
    ) {
      return {
        ...out,
        allowed: false,
        tripped: "monthly_global",
        reason: `Monthly budget exceeded: $${byScope.monthly_global.toFixed(2)} / $${opts.monthlyGlobalUsd.toFixed(2)}`,
      };
    }

    return out;
  } catch (e) {
    logLimitCheckFailOpen(
      "cost_ceilings",
      "thrown",
      e instanceof Error ? e.message : String(e),
    );
    return { allowed: true };
  }
}

/**
 * Single entry point for every AI-powered edge function. Combines:
 *
 *   1. Feature flag check (`feature_flags[feature]` from app_config).
 *   2. Panic-mode short-circuit for companion features.
 *   3. Cost ceilings (global daily, per-user daily, global monthly).
 *   4. Circuit-breaker check for the feature's upstream provider(s) —
 *      when the error rate for a provider is elevated, skip live generation
 *      for features that depend on it. See `_shared/circuit-breaker.ts`.
 *
 * Returns `{ allowed: false, reason, status }` on first failure. Callers
 * should branch to their natural fallback (cache/library/template/no-op)
 * rather than surfacing a hard error when possible.
 *
 * Import is lazy to keep callers from paying the cost when they don't use it.
 */
export async function guardAiFeature(
  svcClient: SupabaseClient,
  feature: string,
  options?: {
    userId?: string;
    skipCostCheck?: boolean;
    /**
     * Upstream providers this feature depends on. When **any** listed provider
     * is currently degraded, the guard blocks with `tripped: 'breaker_<p>'`
     * and the caller should fall through to its non-AI path (canned template,
     * skip AI in email, cached-only, etc.). Companion-orchestrate does its
     * own per-provider skip since it runs multiple generators in parallel.
     */
    providers?: Array<"perplexity" | "lovable">;
  },
): Promise<{
  allowed: boolean;
  reason?: string;
  status?: number;
  tripped?:
    | CostCeilingsResult["tripped"]
    | "feature_flag"
    | "panic_mode"
    | "breaker_perplexity"
    | "breaker_lovable";
}> {
  try {
    const { loadAppConfig, isFeatureEnabled, PANIC_MODE_FEATURES } = await import(
      "./app-config.ts"
    );
    const config = await loadAppConfig(svcClient);

    if (!isFeatureEnabled(config, feature)) {
      const panicHit = config.panic_mode && PANIC_MODE_FEATURES.has(feature);
      return {
        allowed: false,
        reason: panicHit
          ? `Panic mode: '${feature}' bypassed`
          : `Feature '${feature}' disabled`,
        status: 503,
        tripped: panicHit ? "panic_mode" : "feature_flag",
      };
    }

    if (options?.providers && options.providers.length > 0) {
      const { degradedProviders } = await import("./circuit-breaker.ts");
      const degraded = await degradedProviders(svcClient, options.providers);
      if (degraded.length > 0) {
        const p = degraded[0];
        return {
          allowed: false,
          reason: `Provider '${p}' degraded — skipping live AI for '${feature}'`,
          status: 503,
          tripped: p === "perplexity" ? "breaker_perplexity" : "breaker_lovable",
        };
      }
    }

    if (options?.skipCostCheck) return { allowed: true };

    const budget = await checkCostCeilings(svcClient, {
      dailyGlobalUsd: config.budget_daily_usd_global,
      dailyPerUserUsd: options?.userId ? config.budget_daily_usd_per_user : undefined,
      monthlyGlobalUsd: config.budget_monthly_usd_global,
      userId: options?.userId,
    });
    if (!budget.allowed) {
      return {
        allowed: false,
        reason: budget.reason,
        status: 503,
        tripped: budget.tripped,
      };
    }
    return { allowed: true };
  } catch (e) {
    logLimitCheckFailOpen(
      "feature_flag",
      "thrown",
      e instanceof Error ? e.message : String(e),
    );
    return { allowed: true };
  }
}

/**
 * Per-user limit for targeted companion regeneration (companion-orchestrate regenerateOnly).
 * Counts analytics_events.companion_regenerate in the last windowHours.
 */
export async function checkCompanionRegenerateLimit(
  svcClient: SupabaseClient,
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
      logLimitCheckFailOpen("companion_regenerate", "supabase_error", error.message ?? String(error));
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
    logLimitCheckFailOpen(
      "companion_regenerate",
      "thrown",
      e instanceof Error ? e.message : String(e),
    );
    return { allowed: true };
  }
}
