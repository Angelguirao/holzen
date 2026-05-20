import { describe, expect, it } from 'vitest';
import { millisecondsUntilNextQuarterHour } from './milliseconds-until-next-quarter-hour';

describe('millisecondsUntilNextQuarterHour', () => {
  it('returns ms until the next :00/:15/:30/:45 boundary', () => {
    const now = new Date('2026-05-19T10:07:30.500Z');
    expect(millisecondsUntilNextQuarterHour(now)).toBe(7 * 60 * 1000 + 29 * 1000 + 500);
  });

  it('wraps to the next quarter when already on a boundary', () => {
    const now = new Date('2026-05-19T10:15:00.000Z');
    expect(millisecondsUntilNextQuarterHour(now)).toBe(15 * 60 * 1000);
  });
});
