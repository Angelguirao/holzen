import { describe, expect, it } from 'vitest';
import { bucketChangePercent } from './pause-fingerprint';

describe('bucketChangePercent', () => {
  it('truncates to whole percentage points', () => {
    expect(bucketChangePercent(5.1)).toBe(5);
    expect(bucketChangePercent(5.9)).toBe(5);
    expect(bucketChangePercent(-5.9)).toBe(-5);
    expect(bucketChangePercent(6.0)).toBe(6);
  });

  it('treats sub-point moves within the same integer as identical', () => {
    expect(bucketChangePercent(5.04)).toBe(bucketChangePercent(5.14));
    expect(bucketChangePercent(-4.91)).toBe(bucketChangePercent(-4.11));
  });

  it('returns 0 for non-finite input', () => {
    expect(bucketChangePercent(Number.NaN)).toBe(0);
    expect(bucketChangePercent(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
