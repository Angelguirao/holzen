import { describe, expect, it } from 'vitest';

import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import * as scaffoldIo from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import * as terminalEntryIo from '@/features/pause/presentation/session/pause-session-terminal-entry-io';

/**
 * Sibling parity: terminal-entry-io vs scaffold-io presentation I/O (parity with
 * `pause-session-terminal-entry-shell-flow-sibling-parity.test.ts` and
 * `pause-session-providers-scaffold-io-sibling-parity.test.ts`).
 */
describe('pause-session-terminal-entry-io ↔ pause-session-scaffold-io sibling parity', () => {
  it('terminal-entry-io and scaffold-io are distinct sibling presentation I/O anchors', () => {
    expect(typeof isTerminalPauseDbState).toBe('function');
    expect(typeof persistedPauseSessionAllowsTerminalEntry).toBe('function');
    expect(TERMINAL_PAUSE_DB_STATES instanceof Set).toBe(true);
    expect(typeof buildPauseSessionPersistSnapshot).toBe('function');
    expect(typeof computePauseStorageRitualSyncPatch).toBe('function');
    expect(typeof buildPauseSessionScaffoldRitualDerived).toBe('function');
    expect(typeof hasPersistablePauseSessionAnchor).toBe('function');

    expect('isTerminalPauseDbState' in scaffoldIo).toBe(false);
    expect('persistedPauseSessionAllowsTerminalEntry' in scaffoldIo).toBe(false);
    expect('TERMINAL_PAUSE_DB_STATES' in scaffoldIo).toBe(false);
    expect('buildPauseSessionPersistSnapshot' in terminalEntryIo).toBe(false);
    expect('computePauseStorageRitualSyncPatch' in terminalEntryIo).toBe(false);
    expect('buildPauseSessionScaffoldRitualDerived' in terminalEntryIo).toBe(false);
    expect('hasPersistablePauseSessionAnchor' in terminalEntryIo).toBe(false);
  });

  it('terminal-entry-io exports stay off scaffold persist/sync/derived helpers', () => {
    expect(isTerminalPauseDbState).not.toBe(buildPauseSessionPersistSnapshot);
    expect(isTerminalPauseDbState).not.toBe(computePauseStorageRitualSyncPatch);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(TERMINAL_PAUSE_DB_STATES).not.toBe(hasPersistablePauseSessionAnchor);
  });

  it('scaffold-io exports stay off terminal-entry guards', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(isTerminalPauseDbState);
    expect(computePauseStorageRitualSyncPatch).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(isTerminalPauseDbState);
    expect(hasPersistablePauseSessionAnchor).not.toBe(persistedPauseSessionAllowsTerminalEntry);
  });
});
