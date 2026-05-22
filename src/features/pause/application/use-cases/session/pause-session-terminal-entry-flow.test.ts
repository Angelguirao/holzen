import { describe, expect, it } from 'vitest';

import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-flow';
import {
  isTerminalPauseDbState as isTerminalDirect,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsDirect,
  TERMINAL_PAUSE_DB_STATES as terminalStatesDirect,
} from './terminal-entry-guard';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-terminal-entry-flow', () => {
  it('re-exports terminal-entry guards from terminal-entry-guard', () => {
    expect(TERMINAL_PAUSE_DB_STATES.has('completed')).toBe(true);
    expect(isTerminalPauseDbState('active')).toBe(false);
    expect(isTerminalPauseDbState('expired')).toBe(true);

    const restored = makeTestPersistedPauseSession({ pauseInstanceId: 'inst-1' });
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'inst-1')).toBe(true);
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'other')).toBe(false);

    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesDirect);
    expect(isTerminalPauseDbState).toBe(isTerminalDirect);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsDirect);
  });
});
