import { describe, expect, it } from 'vitest';
import { applyBreathSegmentLogOutcome } from './apply-breath-segment-log-outcome';

describe('applyBreathSegmentLogOutcome', () => {
  it('sets ref only on successful mark', () => {
    const ref = { current: false };
    expect(applyBreathSegmentLogOutcome({ status: 'already_logged' }, ref)).toBe(true);
    expect(ref.current).toBe(false);

    expect(
      applyBreathSegmentLogOutcome({ status: 'success', markSegmentLogged: true }, ref),
    ).toBe(true);
    expect(ref.current).toBe(true);

    ref.current = false;
    expect(applyBreathSegmentLogOutcome({ status: 'sync_failed' }, ref)).toBe(false);
    expect(ref.current).toBe(false);
  });
});
