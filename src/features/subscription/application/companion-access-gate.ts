import { isPaidLimitReached } from './limit-upsell';

export type CompanionAccessDeniedReason = 'upgrade_required' | 'limit_reached';

/** Pure gate: null means the user may invoke a paid companion generation. */
export function classifyCompanionAccessDenied(input: {
  isPro: boolean;
  companionRemaining: number;
  flexCreditsBalance: number;
}): CompanionAccessDeniedReason | null {
  if (!input.isPro) return 'upgrade_required';
  if (
    isPaidLimitReached({
      remaining: input.companionRemaining,
      flexCreditsBalance: input.flexCreditsBalance,
    })
  ) {
    return 'limit_reached';
  }
  return null;
}
