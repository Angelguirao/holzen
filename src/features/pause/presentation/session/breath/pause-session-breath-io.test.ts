import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: {},
}));

import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
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
});
