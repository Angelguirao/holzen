import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export type SubscriptionTier = "free" | "pro" | "pro_plus" | "lifetime";
export type MeteredFeature = "premium_companion" | "wallpaper" | "reflection_insights";

export interface TierLimits {
  premium_companion: number;
  wallpaper: number;
  reflection_insights: number;
}

const DEFAULT_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { premium_companion: 0, wallpaper: 0, reflection_insights: 0 },
  pro: { premium_companion: 12, wallpaper: 5, reflection_insights: 4 },
  pro_plus: { premium_companion: 30, wallpaper: 15, reflection_insights: 12 },
  // Lifetime should not hit package limits in normal usage.
  lifetime: { premium_companion: 999_999, wallpaper: 999_999, reflection_insights: 999_999 },
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export const FEATURE_CREDIT_COST: Record<MeteredFeature, number> = {
  premium_companion: 3,
  wallpaper: 2,
  reflection_insights: 1,
};

export const FLEX_PACK_CREDITS = {
  flex_pack_s: 30,
  flex_pack_m: 55,
} as const;

export type FlexPackType = keyof typeof FLEX_PACK_CREDITS;

export function startOfUtcMonthDate(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function isActiveSubscriptionStatus(status: unknown): boolean {
  return typeof status === "string" && ACTIVE_STATUSES.has(status);
}

export function clampUsage(used: number, limit: number): { used: number; remaining: number } {
  const safeUsed = Number.isFinite(used) && used > 0 ? Math.floor(used) : 0;
  const safeLimit = Number.isFinite(limit) && limit >= 0 ? Math.floor(limit) : 0;
  return {
    used: Math.min(safeUsed, safeLimit),
    remaining: Math.max(0, safeLimit - safeUsed),
  };
}

export function resolveTierFromProfile(profile: {
  lifetime_access?: boolean | null;
  subscription_status?: string | null;
  subscription_tier?: string | null;
} | null | undefined): SubscriptionTier {
  if (profile?.lifetime_access) return "lifetime";
  if (!isActiveSubscriptionStatus(profile?.subscription_status)) return "free";
  if (profile?.subscription_tier === "pro_plus") return "pro_plus";
  return "pro";
}

export function tierLimits(tier: SubscriptionTier): TierLimits {
  return DEFAULT_LIMITS[tier] ?? DEFAULT_LIMITS.free;
}

export function tierFromStripePriceId(args: {
  hasActive: boolean;
  priceId: string | null;
  proPriceId: string | null;
  proPlusPriceId: string | null;
}): SubscriptionTier {
  if (!args.hasActive) return "free";
  if (args.priceId && args.proPlusPriceId && args.priceId === args.proPlusPriceId) return "pro_plus";
  if (args.priceId && args.proPriceId && args.priceId === args.proPriceId) return "pro";
  // Backward compatibility: any active subscription defaults to Pro.
  return "pro";
}

export async function getMonthlyFeatureUsage(
  svcClient: SupabaseClient,
  userId: string,
  feature: MeteredFeature,
  monthStart = startOfUtcMonthDate(),
): Promise<number> {
  const { data, error } = await svcClient
    .from("monthly_feature_usage")
    .select("used")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("month_start", monthStart)
    .maybeSingle();
  if (error) return 0;
  return Number(data?.used) || 0;
}

export async function consumeMonthlyFeatureQuota(
  svcClient: SupabaseClient,
  userId: string,
  feature: MeteredFeature,
  limit: number,
  amount = 1,
): Promise<{ allowed: boolean; used: number; remaining: number; limit: number }> {
  const safeLimit = Math.max(0, Math.floor(limit));
  const safeAmount = Math.max(1, Math.floor(amount));
  if (safeLimit <= 0) {
    return { allowed: false, used: 0, remaining: 0, limit: safeLimit };
  }

  const { data, error } = await svcClient.rpc("consume_monthly_feature_quota", {
    p_user_id: userId,
    p_feature: feature,
    p_limit: safeLimit,
    p_amount: safeAmount,
  });
  if (error || !data) {
    const used = await getMonthlyFeatureUsage(svcClient, userId, feature);
    const clamped = clampUsage(used, safeLimit);
    return { allowed: false, used: clamped.used, remaining: clamped.remaining, limit: safeLimit };
  }

  const out = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  const allowed = out.allowed === true;
  const used = Number(out.used) || 0;
  const remaining = Number(out.remaining) || 0;
  const limitOut = Number(out.limit) || safeLimit;
  return { allowed, used, remaining, limit: limitOut };
}

export async function getFlexCreditBalance(svcClient: SupabaseClient, userId: string): Promise<number> {
  const { data, error } = await svcClient
    .from("credit_wallets")
    .select("balance_credits")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return 0;
  return Number(data?.balance_credits) || 0;
}

export async function consumeAllowanceOrCredits(
  svcClient: SupabaseClient,
  args: {
    userId: string;
    feature: MeteredFeature;
    limit: number;
    amount?: number;
    reason?: string;
    source?: string;
    sourceRef?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<{
  allowed: boolean;
  feature: MeteredFeature;
  limit: number;
  used: number;
  remainingAllowance: number;
  requestedUnits: number;
  creditCost: number;
  creditsUsed: number;
  creditsBalance: number;
}> {
  const safeLimit = Math.max(0, Math.floor(args.limit));
  const safeAmount = Math.max(1, Math.floor(args.amount ?? 1));
  const creditCost = FEATURE_CREDIT_COST[args.feature] ?? 1;

  const { data, error } = await svcClient.rpc("consume_feature_allowance_or_credits", {
    p_user_id: args.userId,
    p_feature: args.feature,
    p_limit: safeLimit,
    p_amount: safeAmount,
    p_credit_cost: creditCost,
    p_reason: args.reason ?? "feature_overage",
    p_source: args.source ?? "edge_function",
    p_source_ref: args.sourceRef ?? null,
    p_metadata: args.metadata ?? {},
  });

  if (error || !data) {
    const used = await getMonthlyFeatureUsage(svcClient, args.userId, args.feature);
    const clamped = clampUsage(used, safeLimit);
    const creditsBalance = await getFlexCreditBalance(svcClient, args.userId);
    return {
      allowed: false,
      feature: args.feature,
      limit: safeLimit,
      used: clamped.used,
      remainingAllowance: clamped.remaining,
      requestedUnits: safeAmount,
      creditCost,
      creditsUsed: 0,
      creditsBalance,
    };
  }

  const out = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    allowed: out.allowed === true,
    feature: args.feature,
    limit: Number(out.limit) || safeLimit,
    used: Number(out.used) || 0,
    remainingAllowance: Number(out.remaining_allowance) || 0,
    requestedUnits: Number(out.requested_units) || safeAmount,
    creditCost: Number(out.credit_cost) || creditCost,
    creditsUsed: Number(out.credits_used) || 0,
    creditsBalance: Number(out.credits_balance) || 0,
  };
}

export async function grantFlexCredits(
  svcClient: SupabaseClient,
  args: {
    userId: string;
    credits: number;
    reason: string;
    source: string;
    sourceRef?: string | null;
    feature?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<{ applied: boolean; balance: number; added: number; duplicate?: boolean }> {
  const { data, error } = await svcClient.rpc("add_flex_credits", {
    p_user_id: args.userId,
    p_credits: Math.max(0, Math.floor(args.credits)),
    p_reason: args.reason,
    p_source: args.source,
    p_source_ref: args.sourceRef ?? null,
    p_feature: args.feature ?? null,
    p_metadata: args.metadata ?? {},
  });

  if (error || !data) {
    return { applied: false, balance: await getFlexCreditBalance(svcClient, args.userId), added: 0 };
  }
  const out = data as Record<string, unknown>;
  return {
    applied: out.applied === true,
    balance: Number(out.balance) || 0,
    added: Number(out.added) || 0,
    duplicate: out.duplicate === true || undefined,
  };
}
