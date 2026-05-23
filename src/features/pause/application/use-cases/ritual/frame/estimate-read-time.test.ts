import { describe, it, expect } from 'vitest';
import { estimateReadTime } from './estimate-read-time';

/**
 * Pure-helper coverage for companion Full View read-time bucketing.
 */
describe('estimateReadTime', () => {
  it('returns a glance for tiny content', () => {
    expect(estimateReadTime(0)).toEqual({ kind: 'glance' });
    expect(estimateReadTime(120)).toEqual({ kind: 'glance' });
    expect(estimateReadTime(149)).toEqual({ kind: 'glance' });
  });

  it('returns ~30 s for short paragraphs', () => {
    expect(estimateReadTime(150)).toEqual({ kind: 'thirty' });
    expect(estimateReadTime(300)).toEqual({ kind: 'thirty' });
    expect(estimateReadTime(499)).toEqual({ kind: 'thirty' });
  });

  it('returns ~90 s for Signal / Grounding length content', () => {
    expect(estimateReadTime(500)).toEqual({ kind: 'ninety' });
    expect(estimateReadTime(900)).toEqual({ kind: 'ninety' });
    expect(estimateReadTime(1199)).toEqual({ kind: 'ninety' });
  });

  it('returns minutes for long content, never less than 2', () => {
    const longShort = estimateReadTime(1200);
    expect(longShort.kind).toBe('minutes');
    expect(longShort.minutes).toBeGreaterThanOrEqual(2);

    const wayLong = estimateReadTime(12000);
    expect(wayLong.kind).toBe('minutes');
    expect(wayLong.minutes!).toBeGreaterThanOrEqual(3);
  });
});
