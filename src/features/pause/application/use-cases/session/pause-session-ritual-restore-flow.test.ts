import { describe, expect, it } from 'vitest';

import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
} from './pause-session-ritual-restore-flow';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-ritual-restore-flow', () => {
  it('re-exports restored breath hydration from restored-breath-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({
      breathingFirstCompleted: true,
      breathingSecondCompleted: false,
    });

    expect(initialBreathingFirstCompletedFromRestored(restored)).toBe(true);
    expect(initialBreathingSecondCompletedFromRestored(restored)).toBe(false);
    expect(initialBreathingFirstCompletedFromRestored(null)).toBe(false);
  });
});
