import { describe, it, expect } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
} from './restored-breath-ritual-state';

describe('initialBreathingFirstCompletedFromRestored', () => {
  it('returns false when no session', () => {
    expect(initialBreathingFirstCompletedFromRestored(null)).toBe(false);
  });

  it('prefers breathingFirstCompleted when set', () => {
    expect(initialBreathingFirstCompletedFromRestored(makeTestPersistedPauseSession({ breathingFirstCompleted: true }))).toBe(true);
    expect(initialBreathingFirstCompletedFromRestored(makeTestPersistedPauseSession({ breathingFirstCompleted: false }))).toBe(false);
  });

  it('falls back to legacy breathingCompleted when first flag absent', () => {
    expect(
      initialBreathingFirstCompletedFromRestored(
        makeTestPersistedPauseSession({ breathingCompleted: true, breathingFirstCompleted: undefined }),
      ),
    ).toBe(true);
  });

  it('prefers explicit false over legacy completed when both present', () => {
    expect(
      initialBreathingFirstCompletedFromRestored(
        makeTestPersistedPauseSession({ breathingFirstCompleted: false, breathingCompleted: true }),
      ),
    ).toBe(false);
  });
});

describe('initialBreathingSecondCompletedFromRestored', () => {
  it('returns false when no session', () => {
    expect(initialBreathingSecondCompletedFromRestored(null)).toBe(false);
  });

  it('reads stored flag with false default', () => {
    expect(initialBreathingSecondCompletedFromRestored(makeTestPersistedPauseSession({}))).toBe(false);
    expect(
      initialBreathingSecondCompletedFromRestored(makeTestPersistedPauseSession({ breathingSecondCompleted: true })),
    ).toBe(true);
  });
});
