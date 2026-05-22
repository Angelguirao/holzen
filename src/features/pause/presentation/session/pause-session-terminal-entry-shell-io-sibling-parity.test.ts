import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionMountLogParams,
  coalescePauseSessionShellViewModel,
  computePauseHeaderBackIntent,
  computePauseSessionHydration,
  computePauseSessionResolved,
  hasPersistedPauseSessionPayload,
  isPauseSessionHeaderBackVisible,
  isPauseSessionWaitingForInstanceFetch,
} from './pause-session-shell-io';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-io';
import * as shellIo from './pause-session-shell-io';
import * as terminalEntryIo from './pause-session-terminal-entry-io';

/**
 * Dedicated presentation sibling guard (parity with
 * `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` and
 * `pause-session-shell-scaffold-io-sibling-parity.test.ts`.
 * Reciprocal inline pins: `pause-session-terminal-entry-io.test.ts`, `pause-session-shell-io.test.ts`.
 */
describe('pause-session-terminal-entry-io ↔ pause-session-shell-io sibling parity', () => {
  it('terminal-entry-io and shell-io are distinct sibling presentation I/O anchors', () => {
    expect(typeof isTerminalPauseDbState).toBe('function');
    expect(typeof persistedPauseSessionAllowsTerminalEntry).toBe('function');
    expect(TERMINAL_PAUSE_DB_STATES instanceof Set).toBe(true);
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(typeof isPauseSessionHeaderBackVisible).toBe('function');
    expect(typeof computePauseHeaderBackIntent).toBe('function');
    expect(typeof buildPauseSessionMountLogParams).toBe('function');
    expect(typeof coalescePauseSessionShellViewModel).toBe('function');
    expect(typeof hasPersistedPauseSessionPayload).toBe('function');
    expect(typeof isPauseSessionWaitingForInstanceFetch).toBe('function');

    expect('isTerminalPauseDbState' in shellIo).toBe(false);
    expect('persistedPauseSessionAllowsTerminalEntry' in shellIo).toBe(false);
    expect('TERMINAL_PAUSE_DB_STATES' in shellIo).toBe(false);
    expect('computePauseSessionHydration' in terminalEntryIo).toBe(false);
    expect('computePauseSessionResolved' in terminalEntryIo).toBe(false);
    expect('isPauseSessionHeaderBackVisible' in terminalEntryIo).toBe(false);
    expect('buildPauseSessionMountLogParams' in terminalEntryIo).toBe(false);
    expect('coalescePauseSessionShellViewModel' in terminalEntryIo).toBe(false);
  });

  it('terminal-entry-io exports stay off shell hydration and header-back helpers', () => {
    expect(isTerminalPauseDbState).not.toBe(computePauseSessionHydration);
    expect(isTerminalPauseDbState).not.toBe(computePauseSessionResolved);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(isPauseSessionHeaderBackVisible);
    expect(TERMINAL_PAUSE_DB_STATES).not.toBe(coalescePauseSessionShellViewModel);
    expect(isTerminalPauseDbState).not.toBe(buildPauseSessionMountLogParams);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(hasPersistedPauseSessionPayload);
  });

  it('shell-io exports stay off terminal-entry guards', () => {
    expect(computePauseSessionHydration).not.toBe(isTerminalPauseDbState);
    expect(computePauseSessionResolved).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(isPauseSessionHeaderBackVisible).not.toBe(isTerminalPauseDbState);
    expect(buildPauseSessionMountLogParams).not.toBe(TERMINAL_PAUSE_DB_STATES);
    expect(hasPersistedPauseSessionPayload).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(isTerminalPauseDbState);
  });
});
