import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREGENERATE_CACHE_TOPUP,
  mergePregenerateCacheTopup,
} from './pregenerate-cache-topup-config';

describe('mergePregenerateCacheTopup', () => {
  it('returns defaults for null/undefined', () => {
    const a = mergePregenerateCacheTopup(null);
    const b = mergePregenerateCacheTopup(undefined);
    expect(a).toEqual(DEFAULT_PREGENERATE_CACHE_TOPUP);
    expect(b).toEqual(DEFAULT_PREGENERATE_CACHE_TOPUP);
  });

  it('merges partial overrides and clamps', () => {
    const m = mergePregenerateCacheTopup({
      signal: { minHealthyRows: 99, maxGeneratePerRun: 3 },
      historical_insight: { minHealthyRows: -5, maxGeneratePerRun: 999 },
    });
    expect(m.signal.minHealthyRows).toBe(99);
    expect(m.signal.maxGeneratePerRun).toBe(3);
    expect(m.historical_insight.minHealthyRows).toBe(0);
    expect(m.historical_insight.maxGeneratePerRun).toBe(20);
    expect(m.ground_nudge).toEqual(DEFAULT_PREGENERATE_CACHE_TOPUP.ground_nudge);
  });
});
