import { describe, expect, it } from 'vitest';
import { millisecondsUntilNextVolatilityCheck } from './milliseconds-until-next-volatility-check';

describe('millisecondsUntilNextVolatilityCheck', () => {
  it('returns ms until the next :00 boundary', () => {
    const now = new Date('2026-05-19T10:07:30.500Z');
    expect(millisecondsUntilNextVolatilityCheck(now)).toBe(52 * 60 * 1000 + 29 * 1000 + 500);
  });

  it('wraps to the next hour when already on a boundary', () => {
    const now = new Date('2026-05-19T10:00:00.000Z');
    expect(millisecondsUntilNextVolatilityCheck(now)).toBe(60 * 60 * 1000);
  });
});
