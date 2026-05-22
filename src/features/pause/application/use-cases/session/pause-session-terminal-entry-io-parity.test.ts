import { describe, expect, it } from 'vitest';

import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow';
import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow';
import {
  isTerminalPauseDbState as isTerminalDirect,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsDirect,
  TERMINAL_PAUSE_DB_STATES as terminalStatesDirect,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
import {
  clearPausePersistedTabSession,
  isTerminalPauseDbState as isTerminalFromTerminalEntryIo,
  loadPausePersistedTabSession,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromTerminalEntryIo,
  savePausePersistedTabSession,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromTerminalEntryIo,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

describe('pause-session-terminal-entry-io parity', () => {
  it('presentation I/O terminal-entry exports match pause-session-terminal-entry-flow CI umbrella', () => {
    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesFromTerminalEntryIo);
    expect(isTerminalPauseDbState).toBe(isTerminalFromTerminalEntryIo);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsFromTerminalEntryIo);
  });

  it('terminal-entry-flow CI umbrella composes the same leaf module as presentation I/O', () => {
    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesDirect);
    expect(isTerminalPauseDbState).toBe(isTerminalDirect);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsDirect);
  });

  it('presentation I/O re-exports leaf guards (not port-bound tab-session wrappers)', () => {
    expect(isTerminalPauseDbState).toBe(isTerminalDirect);
    expect(isTerminalPauseDbState).not.toBe(loadPausePersistedTabSession);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(savePausePersistedTabSession);
    expect(TERMINAL_PAUSE_DB_STATES).not.toBe(clearPausePersistedTabSession);
  });

  it('sibling cluster: terminal-entry presentation exports stay distinct from persisted-tab-session presentation exports', () => {
    expect(isTerminalPauseDbState).not.toBe(loadPausePersistedTabSession);
    expect(isTerminalPauseDbState).not.toBe(savePausePersistedTabSession);
    expect(isTerminalPauseDbState).not.toBe(clearPausePersistedTabSession);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(loadPersistedTabSession);
    expect(TERMINAL_PAUSE_DB_STATES).not.toBe(loadPausePersistedTabSession);
    expect(isTerminalDirect).not.toBe(loadPersistedTabSession);
  });

  it('persisted allow helper matches leaf behavior (extended behavioral pin)', () => {
    const restored = makeTestPersistedPauseSession({ pauseInstanceId: 'inst-parity' });
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'inst-parity')).toBe(true);
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'other')).toBe(false);
    expect(persistedAllowsFromTerminalEntryIo(restored, 'inst-parity')).toBe(
      persistedAllowsDirect(restored, 'inst-parity'),
    );
  });
});
