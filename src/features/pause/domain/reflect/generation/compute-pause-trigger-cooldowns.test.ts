import { describe, expect, it, vi } from 'vitest';
import {
  computeAutoCooldownRemainingMs,
  computeManualCooldownRemainingMs,
} from './compute-pause-trigger-cooldowns';

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

describe('computeAutoCooldownRemainingMs', () => {
  it('returns 0 when no last trigger', () => {
    expect(computeAutoCooldownRemainingMs(null, 4)).toBe(0);
  });

  it('returns remaining ms from profile cooldown hours', () => {
    const last = new Date('2026-01-01T10:00:00Z').toISOString();
    const now = new Date('2026-01-01T11:30:00Z').getTime();
    expect(computeAutoCooldownRemainingMs(last, 4, now)).toBe(2.5 * 60 * 60 * 1000);
  });
});
