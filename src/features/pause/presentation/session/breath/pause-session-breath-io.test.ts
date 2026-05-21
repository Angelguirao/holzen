import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: {},
}));

import {
  applyBreathSegmentLogOutcome,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
} from './pause-session-breath-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-breath-io', () => {
  it('re-exports restored breath completion flags for ritual hydration', () => {
    const restored = makeTestPersistedPauseSession({
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });

    expect(initialBreathingFirstCompletedFromRestored(restored)).toBe(true);
    expect(initialBreathingSecondCompletedFromRestored(restored)).toBe(false);
    expect(initialBreathingFirstCompletedFromRestored(null)).toBe(false);
  });

  it('re-exports breath segment RPC outcome + restored dedupe flags', () => {
    const restored = makeTestPersistedPauseSession({ step: 'reflect' });
    const ref = { current: false };

    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(restored)).toEqual({
      segment1Logged: true,
      segment2Logged: false,
    });
    expect(
      applyBreathSegmentLogOutcome({ status: 'success', markSegmentLogged: true }, ref),
    ).toBe(true);
    expect(ref.current).toBe(true);
  });
});
