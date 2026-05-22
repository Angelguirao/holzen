import { describe, expect, it } from 'vitest';

import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow';
import {
  isTerminalPauseDbState as isTerminalDirect,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsDirect,
  TERMINAL_PAUSE_DB_STATES as terminalStatesDirect,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
import {
  isTerminalPauseDbState as isTerminalFromTerminalEntryIo,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromTerminalEntryIo,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromTerminalEntryIo,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';

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
});
