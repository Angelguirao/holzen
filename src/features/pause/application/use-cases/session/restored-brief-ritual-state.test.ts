import { describe, it, expect } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import {
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialSelectedBriefFaceFromRestored,
} from './restored-brief-ritual-state';

describe('initialBriefPauseStepFromRestored', () => {
  it('defaults to feel when no session or not a brief ritual', () => {
    expect(initialBriefPauseStepFromRestored(null)).toBe('feel');
    expect(initialBriefPauseStepFromRestored(makeTestPersistedPauseSession({ ritualDepth: 'deep' }))).toBe('feel');
    expect(initialBriefPauseStepFromRestored(makeTestPersistedPauseSession({}))).toBe('feel');
  });

  it('uses stored briefStep when ritual is brief', () => {
    expect(
      initialBriefPauseStepFromRestored(
        makeTestPersistedPauseSession({ ritualDepth: 'brief', briefStep: 'integrate' }),
      ),
    ).toBe('integrate');
  });

  it('falls back to feel when brief ritual has no briefStep', () => {
    expect(initialBriefPauseStepFromRestored(makeTestPersistedPauseSession({ ritualDepth: 'brief' }))).toBe('feel');
  });
});

describe('initialBriefIntegrateDoneFromRestored', () => {
  it('defaults false when absent', () => {
    expect(initialBriefIntegrateDoneFromRestored(null)).toBe(false);
    expect(initialBriefIntegrateDoneFromRestored(makeTestPersistedPauseSession({}))).toBe(false);
  });

  it('reads stored flag', () => {
    expect(
      initialBriefIntegrateDoneFromRestored(makeTestPersistedPauseSession({ ritualDepth: 'brief', briefIntegrateDone: true })),
    ).toBe(true);
  });
});

describe('initialSelectedBriefFaceFromRestored', () => {
  it('defaults null when absent', () => {
    expect(initialSelectedBriefFaceFromRestored(null)).toBeNull();
    expect(initialSelectedBriefFaceFromRestored(makeTestPersistedPauseSession({}))).toBeNull();
  });

  it('reads stored briefFace', () => {
    expect(
      initialSelectedBriefFaceFromRestored(makeTestPersistedPauseSession({ ritualDepth: 'brief', briefFace: 'anxious' })),
    ).toBe('anxious');
  });
});
