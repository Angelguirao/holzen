import { describe, expect, it } from 'vitest';
import { isVolatilityThresholdBreached } from '@/features/market/domain/volatility-thresholds';

describe('isVolatilityThresholdBreached', () => {
  it('returns true when daily move exceeds the up threshold', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 5, threshold_down: 5 },
        { changePercent: 6, direction: 'up' },
      ),
    ).toBe(true);
  });

  it('uses threshold_down for down moves', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 10, threshold_down: 3 },
        { changePercent: -4, direction: 'down' },
      ),
    ).toBe(true);
  });

  it('returns false when daily move is below thresholds', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 5, threshold_down: 5 },
        { changePercent: 3, direction: 'up' },
      ),
    ).toBe(false);
  });
});
