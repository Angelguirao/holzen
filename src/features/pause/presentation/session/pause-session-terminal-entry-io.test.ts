import { describe, expect, it } from 'vitest';
import {
  isTerminalPauseDbState as isTerminalFromLeaf,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromLeaf,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromLeaf,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-terminal-entry-io', () => {
  it('re-exports terminal DB states from terminal-entry-guard', () => {
    expect(TERMINAL_PAUSE_DB_STATES.has('completed')).toBe(true);
    expect(isTerminalPauseDbState('active')).toBe(false);
    expect(isTerminalPauseDbState('expired')).toBe(true);
  });

  it('re-exports persisted session allow helper', () => {
    const restored = makeTestPersistedPauseSession({ pauseInstanceId: 'inst-1' });
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'inst-1')).toBe(true);
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'other')).toBe(false);
  });

  it('presentation I/O re-exports match application leaf module (direct re-export parity)', () => {
    expect(isTerminalPauseDbState).toBe(isTerminalFromLeaf);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsFromLeaf);
    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesFromLeaf);
  });
});
