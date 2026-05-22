import { describe, expect, it } from 'vitest';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-terminal-entry-io', () => {
  it('re-exports terminal DB states from pause-session-terminal-entry-flow', () => {
    expect(TERMINAL_PAUSE_DB_STATES.has('completed')).toBe(true);
    expect(isTerminalPauseDbState('active')).toBe(false);
    expect(isTerminalPauseDbState('expired')).toBe(true);
  });

  it('re-exports persisted session allow helper', () => {
    const restored = makeTestPersistedPauseSession({ pauseInstanceId: 'inst-1' });
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'inst-1')).toBe(true);
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'other')).toBe(false);
  });
});
