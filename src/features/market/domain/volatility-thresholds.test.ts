import { describe, expect, it } from 'vitest';
import {
  isCumulativeMoveTriggered,
  isVolatilityThresholdBreached,
} from '@/features/market/domain/volatility-thresholds';

describe('isVolatilityThresholdBreached', () => {
  it('returns true when daily move exceeds the up threshold', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 5, threshold_down: 5, cumulative_threshold: 15 },
        { changePercent: 6, cumulativeChangePercent: 2, direction: 'up' },
      ),
    ).toBe(true);
  });

  it('uses threshold_down for down moves', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 10, threshold_down: 3, cumulative_threshold: 15 },
        { changePercent: -4, cumulativeChangePercent: 1, direction: 'down' },
      ),
    ).toBe(true);
  });

  it('returns true when only cumulative move exceeds threshold', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 5, cumulative_threshold: 10 },
        { changePercent: 2, cumulativeChangePercent: -12, direction: 'down' },
      ),
    ).toBe(true);
  });

  it('returns false when both daily and cumulative are below thresholds', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 5, cumulative_threshold: 15 },
        { changePercent: 3, cumulativeChangePercent: 8, direction: 'up' },
      ),
    ).toBe(false);
  });

  it('matches isCumulativeMoveTriggered semantics for cumulative-only breach', () => {
    const cumulative = 16;
    expect(isCumulativeMoveTriggered(cumulative, 15)).toBe(true);
    expect(
      isVolatilityThresholdBreached(
        { threshold: 99, cumulative_threshold: 15 },
        { changePercent: 1, cumulativeChangePercent: cumulative, direction: 'up' },
      ),
    ).toBe(true);
  });
});
