import { describe, it, expect } from 'vitest';
import { estimateReadTime } from '@/screens/pause/components/companion/read-time-util';

/**
 * Pure-helper coverage for the shared companion Full View primitives. The
 * React-mounting parts of ReadTime / useStaggeredReveal / HistoryThread are
 * exercised at the page-integration level; here we lock the bucketing math so
 * regressions can't silently turn a "~90 s read" into "a glance".
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
