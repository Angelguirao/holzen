import { describe, expect, it } from 'vitest';

import {
  computePauseSessionHydration,
  computePauseSessionResolved,
  isPauseSessionHeaderBackVisible,
} from './pause-session-shell-flow';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-flow';
import * as shellFlow from './pause-session-shell-flow';
import * as terminalEntryFlow from './pause-session-terminal-entry-flow';

describe('pause-session-terminal-entry-flow ↔ pause-session-shell-flow sibling parity', () => {
  it('terminal-entry-flow and shell-flow are distinct sibling CI anchors', () => {
    expect(typeof isTerminalPauseDbState).toBe('function');
    expect(typeof persistedPauseSessionAllowsTerminalEntry).toBe('function');
    expect(TERMINAL_PAUSE_DB_STATES instanceof Set).toBe(true);
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(typeof isPauseSessionHeaderBackVisible).toBe('function');

    expect('isTerminalPauseDbState' in shellFlow).toBe(false);
    expect('persistedPauseSessionAllowsTerminalEntry' in shellFlow).toBe(false);
    expect('TERMINAL_PAUSE_DB_STATES' in shellFlow).toBe(false);
    expect('computePauseSessionHydration' in terminalEntryFlow).toBe(false);
    expect('computePauseSessionResolved' in terminalEntryFlow).toBe(false);
    expect('isPauseSessionHeaderBackVisible' in terminalEntryFlow).toBe(false);
  });

  it('terminal-entry umbrella exports stay off shell hydration and header-back helpers', () => {
    expect(isTerminalPauseDbState).not.toBe(computePauseSessionHydration);
    expect(isTerminalPauseDbState).not.toBe(computePauseSessionResolved);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(isPauseSessionHeaderBackVisible);
    expect(TERMINAL_PAUSE_DB_STATES).not.toBe(computePauseSessionResolved);
  });

  it('shell umbrella exports stay off terminal-entry guards', () => {
    expect(computePauseSessionHydration).not.toBe(isTerminalPauseDbState);
    expect(computePauseSessionResolved).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(isPauseSessionHeaderBackVisible).not.toBe(isTerminalPauseDbState);
  });
});
