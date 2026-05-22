import { describe, expect, it } from 'vitest';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';
import { initialFrameDoneFromRestored } from './pause-session-frame-io';

describe('pause-session-frame-io', () => {
  it('re-exports frame hydration from restored-frame-ritual-state', () => {
    expect(initialFrameDoneFromRestored(null)).toBe(false);
    expect(initialFrameDoneFromRestored(makeTestPersistedPauseSession({ frameDone: true }))).toBe(true);
  });
});
