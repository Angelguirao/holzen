import { describe, expect, it, vi } from 'vitest';
import { computeManualCooldownRemainingMs } from './compute-pause-trigger-cooldowns';

vi.mock('@/features/market/public', () => ({
  getManualReflectionCooldownMs: () => 60_000,
}));

describe('computeManualCooldownRemainingMs', () => {
  it('returns 0 when no prior manual trigger', () => {
    expect(computeManualCooldownRemainingMs(null, 100_000)).toBe(0);
  });

  it('returns remaining cooldown within the window', () => {
    expect(computeManualCooldownRemainingMs(50_000, 80_000)).toBe(30_000);
  });

  it('returns 0 after cooldown elapsed', () => {
    expect(computeManualCooldownRemainingMs(0, 120_000)).toBe(0);
  });
});
