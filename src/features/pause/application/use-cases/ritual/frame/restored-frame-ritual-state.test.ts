import { describe, it, expect } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import { initialFrameDoneFromRestored } from './restored-frame-ritual-state';

describe('initialFrameDoneFromRestored', () => {
  it('returns false when no session', () => {
    expect(initialFrameDoneFromRestored(null)).toBe(false);
  });

  it('reads stored flag with false default', () => {
    expect(initialFrameDoneFromRestored(makeTestPersistedPauseSession({}))).toBe(false);
    expect(initialFrameDoneFromRestored(makeTestPersistedPauseSession({ frameDone: true }))).toBe(true);
  });
});
