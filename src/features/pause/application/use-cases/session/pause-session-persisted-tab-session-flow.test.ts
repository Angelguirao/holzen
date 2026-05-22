import { describe, expect, it } from 'vitest';

import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from './pause-session-persisted-tab-session-flow';
import type { PersistedTabSessionStoragePort } from '@/features/pause/ports/persisted-tab-session-storage';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-persisted-tab-session-flow', () => {
  it('re-exports tab session helpers from persisted-tab-session', () => {
    const snapshot = makeTestPersistedPauseSession({ step: 'brief' });
    const storage: PersistedTabSessionStoragePort = {
      load: () => snapshot,
      save: () => {},
      clear: () => {},
    };

    expect(loadPersistedTabSession(storage)).toEqual(snapshot);
    expect(typeof savePersistedTabSession).toBe('function');
    expect(typeof clearPersistedTabSession).toBe('function');
  });
});
