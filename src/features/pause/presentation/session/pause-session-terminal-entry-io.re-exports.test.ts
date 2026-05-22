import { describe, expect, it } from 'vitest';

import {
  isTerminalPauseDbState as isTerminalDirect,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsDirect,
  TERMINAL_PAUSE_DB_STATES as terminalStatesDirect,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
import {
  isTerminalPauseDbState as isTerminalFromTerminalEntryFlow,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromTerminalEntryFlow,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromTerminalEntryFlow,
} from '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow';

import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-io';

describe('pause-session-terminal-entry-io re-exports', () => {
  it('re-exports terminal-entry guards from terminal-entry-guard leaf module', () => {
    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesDirect);
    expect(isTerminalPauseDbState).toBe(isTerminalDirect);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsDirect);
  });

  it('presentation I/O bindings match pause-session-terminal-entry-flow CI anchor (leaf parity)', () => {
    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesFromTerminalEntryFlow);
    expect(isTerminalPauseDbState).toBe(isTerminalFromTerminalEntryFlow);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsFromTerminalEntryFlow);
  });
});
