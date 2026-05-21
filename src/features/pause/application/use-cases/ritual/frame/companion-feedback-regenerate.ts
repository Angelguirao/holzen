export type CompanionRegenerateClickResult =
  | { action: 'noop' }
  | { action: 'require_pro' }
  | { action: 'limit_reached' }
  | { action: 'run' };

/** Client-side gate for companion regenerate tap (Pro + limits unchanged). */
export function resolveCompanionRegenerateClick(input: {
  canRegenerate: boolean;
  regenBusy: boolean;
  isPro: boolean;
  limitReached: boolean;
}): CompanionRegenerateClickResult {
  if (!input.canRegenerate || input.regenBusy) return { action: 'noop' };
  if (!input.isPro) return { action: 'require_pro' };
  if (input.limitReached) return { action: 'limit_reached' };
  return { action: 'run' };
}
