import { describe, expect, it } from 'vitest';
import { resolveMarketVolatilityRangeStatus } from '@/features/market/domain/market-volatility-range-status';

describe('resolveMarketVolatilityRangeStatus', () => {
  const profile = { threshold: 5, threshold_down: 5 };

  it('returns within when daily move is below thresholds', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: 3,
        direction: 'up',
      }),
    ).toEqual({ kind: 'within' });
  });

  it('returns daily_down when down move breaches threshold', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: -6,
        direction: 'down',
      }),
    ).toEqual({ kind: 'beyond', axis: 'daily_down' });
  });

  it('returns daily_up when up move breaches threshold', () => {
    expect(
      resolveMarketVolatilityRangeStatus(profile, {
        changePercent: 7,
        direction: 'up',
      }),
    ).toEqual({ kind: 'beyond', axis: 'daily_up' });
  });
});
