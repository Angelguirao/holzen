import type { VolatilityThresholdProfile } from '@/features/market/domain/volatility-thresholds';

export type MarketVolatilityRangeStatus =
  | { kind: 'within' }
  | { kind: 'beyond'; axis: 'daily_up' | 'daily_down' };

export type MarketVolatilityRangeInput = {
  changePercent: number;
  direction: 'up' | 'down';
};

/**
 * UI projection: is the current quote inside the user's daily pause auto-trigger bands?
 * Authority for cron triggers remains server-side; this mirrors `_shared/volatility-thresholds`.
 */
export function resolveMarketVolatilityRangeStatus(
  profile: VolatilityThresholdProfile,
  data: MarketVolatilityRangeInput,
): MarketVolatilityRangeStatus {
  const absChange = Math.abs(data.changePercent);
  const effectiveThreshold =
    data.direction === 'down'
      ? (profile.threshold_down ?? profile.threshold ?? 5)
      : (profile.threshold ?? 5);
  if (absChange < effectiveThreshold) {
    return { kind: 'within' };
  }
  return {
    kind: 'beyond',
    axis: data.direction === 'down' ? 'daily_down' : 'daily_up',
  };
}
