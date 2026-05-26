/**
 * Budget-aware LLM model tiering — downgrade models as daily global spend rises.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type LlmBudgetTier = "normal" | "economy" | "critical";

/** Daily global spend ≥ 70% of cap → economy; ≥ 90% → critical. */
const ECONOMY_RATIO = 0.7;
const CRITICAL_RATIO = 0.9;

export function budgetTierFromSpendRatio(ratio: number): LlmBudgetTier {
  if (!Number.isFinite(ratio) || ratio < ECONOMY_RATIO) return "normal";
  if (ratio >= CRITICAL_RATIO) return "critical";
  return "economy";
}

export async function resolveLlmBudgetTier(
  svcClient: SupabaseClient,
): Promise<LlmBudgetTier> {
  try {
    const { loadAppConfig } = await import("./app-config.ts");
    const config = await loadAppConfig(svcClient);
    const cap = config.budget_daily_usd_global;
    if (typeof cap !== "number" || cap <= 0) return "normal";

    const startOfDayUtc = new Date();
    startOfDayUtc.setUTCHours(0, 0, 0, 0);
    const { data, error } = await svcClient
      .from("generation_attempts")
      .select("estimated_cost_usd")
      .gte("created_at", startOfDayUtc.toISOString())
      .not("estimated_cost_usd", "is", null);

    if (error || !data) return "normal";

    const total = (data as Array<{ estimated_cost_usd: number | null }>).reduce(
      (s, r) => s + (Number(r.estimated_cost_usd) || 0),
      0,
    );
    return budgetTierFromSpendRatio(total / cap);
  } catch {
    return "normal";
  }
}
