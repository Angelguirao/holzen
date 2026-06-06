import {
  isCumulativeMoveTriggered,
  type VolatilityThresholdProfile,
} from '@/legacy/cumulative-threshold/volatility-thresholds-cumulative';

export type MarketVolatilityRangeStatusWithCumulative =
  | { kind: 'within' }
  | { kind: 'beyond'; axis: 'daily_up' | 'daily_down' | 'cumulative' };

export type MarketVolatilityRangeInputWithCumulative = {
  changePercent: number;
  direction: 'up' | 'down';
  cumulativeChangePercent?: number;
};

/** Archived UI projection including 7-day cumulative axis. */
export function resolveMarketVolatilityRangeStatusWithCumulative(
  profile: VolatilityThresholdProfile,
  data: MarketVolatilityRangeInputWithCumulative,
): MarketVolatilityRangeStatusWithCumulative {
  const absChange = Math.abs(data.changePercent);
  const effectiveThreshold =
    data.direction === 'down'
      ? (profile.threshold_down ?? profile.threshold ?? 5)
      : (profile.threshold ?? 5);
  const dailyTriggered = absChange >= effectiveThreshold;
  const cumulativeTriggered = isCumulativeMoveTriggered(
    data.cumulativeChangePercent,
    profile.cumulative_threshold,
  );

  if (!dailyTriggered && !cumulativeTriggered) {
    return { kind: 'within' };
  }
  if (cumulativeTriggered && !dailyTriggered) {
    return { kind: 'beyond', axis: 'cumulative' };
  }
  return {
    kind: 'beyond',
    axis: data.direction === 'down' ? 'daily_down' : 'daily_up',
  };
}
