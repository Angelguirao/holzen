export type SubscriptionBillingInterval = 'month' | 'year' | 'day' | 'week';

export type SubscriptionSnapshot = {
  subscribed: boolean;
  tier: 'free' | 'pro' | 'pro_plus' | 'lifetime';
  monthlyUsed: number;
  monthlyRemaining: number | undefined;
  companionLimit: number;
  companionUsed: number;
  companionRemaining: number;
  wallpaperLimit: number;
  wallpaperUsed: number;
  wallpaperRemaining: number;
  insightsLimit: number;
  insightsUsed: number;
  insightsRemaining: number;
  flexCreditsBalance: number;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  /** From Stripe `price.recurring.interval` (fresh `check-subscription` only) */
  subscriptionBillingInterval: SubscriptionBillingInterval | null;
};

export interface SubCache {
  subscribed: boolean;
  tier: 'free' | 'pro' | 'pro_plus' | 'lifetime';
  monthlyUsed: number;
  monthlyRemaining: number | undefined;
  companionLimit: number;
  companionUsed: number;
  companionRemaining: number;
  wallpaperLimit: number;
  wallpaperUsed: number;
  wallpaperRemaining: number;
  insightsLimit: number;
  insightsUsed: number;
  insightsRemaining: number;
  flexCreditsBalance: number;
  ts: number;
}
