import { describe, expect, it } from 'vitest';

import { initialFrameDoneFromRestored } from './pause-session-frame-flow';
import { initialFrameDoneFromRestored as initialFrameDoneDirect } from '../ritual/frame/restored-frame-ritual-state';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-frame-flow', () => {
  it('re-exports restored frame hydration from restored-frame-ritual-state', () => {
    const restored = makeTestPersistedPauseSession({ frameDone: true });

    expect(initialFrameDoneFromRestored(restored)).toBe(true);
    expect(initialFrameDoneFromRestored(null)).toBe(false);
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneDirect);
  });
});
