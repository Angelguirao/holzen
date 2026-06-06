import { describe, expect, it } from 'vitest';
import {
  isCumulativeMoveTriggered,
  isVolatilityThresholdBreached,
} from '@/legacy/cumulative-threshold/volatility-thresholds-cumulative';

describe('legacy cumulative volatility thresholds', () => {
  it('returns true when only cumulative move exceeds threshold', () => {
    expect(
      isVolatilityThresholdBreached(
        { threshold: 5, cumulative_threshold: 10 },
        { changePercent: 2, cumulativeChangePercent: -12, direction: 'down' },
      ),
    ).toBe(true);
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
