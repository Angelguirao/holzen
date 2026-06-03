import { describe, expect, it } from 'vitest';
import { resolveMarketVolatilityRangeStatus } from '@/features/market/domain/market-volatility-range-status';

describe('resolveMarketVolatilityRangeStatus', () => {
  const profile = { threshold: 5, threshold_down: 5, cumulative_threshold: 15 };

  it('returns within when daily and cumulative are below thresholds', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: 3,
        direction: 'up',
        cumulativeChangePercent: 8,
      }),
    ).toEqual({ kind: 'within' });
  });

  it('returns daily_down when down move breaches threshold', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: -6,
        direction: 'down',
        cumulativeChangePercent: 2,
      }),
    ).toEqual({ kind: 'beyond', axis: 'daily_down' });
  });

  it('returns daily_up when up move breaches threshold', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: 7,
        direction: 'up',
        cumulativeChangePercent: 2,
      }),
    ).toEqual({ kind: 'beyond', axis: 'daily_up' });
  });

  it('returns cumulative when only 7d move breaches', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: 2,
        direction: 'up',
        cumulativeChangePercent: -16,
      }),
    ).toEqual({ kind: 'beyond', axis: 'cumulative' });
  });
});
