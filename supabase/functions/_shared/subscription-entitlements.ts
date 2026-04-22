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
  svcClient: any,
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
  svcClient: any,
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
