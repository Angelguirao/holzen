import { describe, expect, it } from 'vitest';

import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from './pause-session-persisted-tab-session-flow';
import {
  clearPersistedTabSession as clearDirect,
  loadPersistedTabSession as loadDirect,
  savePersistedTabSession as saveDirect,
} from './persisted-tab-session';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-flow';
import type { PersistedTabSessionStoragePort } from '@/features/pause/ports/persisted-tab-session-storage';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-persisted-tab-session-flow', () => {
  it('re-exports tab session helpers from persisted-tab-session', () => {
    const snapshot = makeTestPersistedPauseSession({ step: 'frame' });
    const storage: PersistedTabSessionStoragePort = {
      load: () => snapshot,
      save: () => {},
      clear: () => {},
    };

    expect(loadPersistedTabSession(storage)).toEqual(snapshot);
    expect(typeof savePersistedTabSession).toBe('function');
    expect(typeof clearPersistedTabSession).toBe('function');
    expect(loadPersistedTabSession).toBe(loadDirect);
    expect(savePersistedTabSession).toBe(saveDirect);
    expect(clearPersistedTabSession).toBe(clearDirect);
  });

  it('sibling cluster: persisted-tab-session umbrella exports stay distinct from terminal-entry umbrella exports', () => {
    expect(loadPersistedTabSession).not.toBe(isTerminalPauseDbState);
    expect(loadPersistedTabSession).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(loadPersistedTabSession).not.toBe(TERMINAL_PAUSE_DB_STATES);
    expect(savePersistedTabSession).not.toBe(isTerminalPauseDbState);
    expect(clearPersistedTabSession).not.toBe(persistedPauseSessionAllowsTerminalEntry);
  });
});
