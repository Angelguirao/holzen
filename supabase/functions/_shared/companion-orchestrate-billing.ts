import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { contentSatisfiesCompanion } from "./companion-orchestrate-parse.ts";
import type { OrchestrateResponse } from "./companion-orchestrate-types.ts";
import { ORCHESTRATOR_KEY_MAP } from "./companion-types.ts";
import {
  consumeAllowanceOrCredits,
  peekAllowanceOrCredits,
  type MeteredFeature,
} from "./subscription-entitlements.ts";

const PREMIUM_RESPONSE_KEYS = ["signal", "grounding", "history"] as const;
type PremiumResponseKey = (typeof PREMIUM_RESPONSE_KEYS)[number];

function isPremiumResponseKey(key: string): key is PremiumResponseKey {
  return (PREMIUM_RESPONSE_KEYS as readonly string[]).includes(key);
}

/** True when orchestrate returned renderable content for a premium slot. */
export function premiumSlotHasBillableContent(key: PremiumResponseKey, response: OrchestrateResponse): boolean {
  const slot = response[key];
  if (!slot?.data) return false;
  const companionType = ORCHESTRATOR_KEY_MAP[key];
  if (!companionType) return false;
  return contentSatisfiesCompanion(companionType, slot.data);
}

/** Count premium slots that delivered content (cache, live, or library). */
export function countBillablePremiumCompanionUnits(
  response: OrchestrateResponse,
  requested: { signal: boolean; grounding: boolean; history: boolean },
): number {
  let units = 0;
  if (requested.signal && premiumSlotHasBillableContent("signal", response)) units += 1;
  if (requested.grounding && premiumSlotHasBillableContent("grounding", response)) units += 1;
  if (requested.history && premiumSlotHasBillableContent("history", response)) units += 1;
  return units;
}

export type PremiumCompanionQuotaBlock = {
  status: 402;
  body: Record<string, unknown>;
};

/** Pre-flight: user can afford up to `amount` premium units (no debit). */
export async function checkPremiumCompanionQuota(
  svcClient: SupabaseClient,
  args: {
    userId: string;
    tier: "free" | "pro" | "lifetime";
    limit: number;
    amount: number;
  },
): Promise<PremiumCompanionQuotaBlock | null> {
  if (args.amount <= 0) return null;
  if (args.tier === "free") {
    return {
      status: 402,
      body: {
        error: "Premium companions require an active plan.",
        code: "companions_upgrade_required",
      },
    };
  }
  const peek = await peekAllowanceOrCredits(svcClient, {
    userId: args.userId,
    feature: "premium_companion",
    limit: args.limit,
    amount: args.amount,
  });
  if (!peek.allowed) {
    return {
      status: 402,
      body: {
        error: "You've used this month's premium companion allowance.",
        code: "companions_quota_exceeded",
        tier: args.tier,
        companion_limit: peek.limit,
        companion_used: peek.used,
        companion_remaining: peek.remainingAllowance,
        credits_balance: peek.creditsBalance,
        credits_needed: Math.max(
          0,
          (args.amount - peek.remainingAllowance) * peek.creditCost - peek.creditsBalance,
        ),
      },
    };
  }
  return null;
}

export async function consumePremiumCompanionUnitsAfterSuccess(
  svcClient: SupabaseClient,
  args: {
    userId: string;
    limit: number;
    amount: number;
    source: string;
    sourceRef?: string | null;
    metadata?: Record<string, unknown>;
  },
  log: (msg: string, extra?: Record<string, unknown>) => void,
): Promise<void> {
  if (args.amount <= 0) return;
  const quota = await consumeAllowanceOrCredits(svcClient, {
    userId: args.userId,
    feature: "premium_companion" as MeteredFeature,
    limit: args.limit,
    amount: args.amount,
    reason: "companions_overage",
    source: args.source,
    sourceRef: args.sourceRef ?? null,
    metadata: args.metadata ?? {},
  });
  log("premium companion quota consumed (post-success)", {
    amount: args.amount,
    used: quota.used,
    remaining: quota.remainingAllowance,
    credits_used: quota.creditsUsed,
    credits_balance: quota.creditsBalance,
  });
}

export { isPremiumResponseKey, PREMIUM_RESPONSE_KEYS };
