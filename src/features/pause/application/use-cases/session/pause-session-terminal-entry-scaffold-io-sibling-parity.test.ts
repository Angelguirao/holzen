import { describe, expect, it } from 'vitest';

import * as scaffoldIo from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import * as terminalEntryIo from '@/features/pause/presentation/session/pause-session-terminal-entry-io';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';

/**
 * Application sibling parity: terminal-entry-io vs scaffold-io (parity with presentation
 * `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` and
 * `pause-session-terminal-entry-shell-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-session-terminal-entry-io-parity.test.ts` ↔
 * `pause-session-scaffold-io-parity.test.ts`.
 */
describe('pause-session-terminal-entry-io ↔ pause-session-scaffold-io sibling parity (application)', () => {
  it('terminal-entry-io and scaffold-io are distinct presentation I/O anchors', () => {
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
    expect(isTerminalPauseDbState).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(computePauseStorageRitualSyncPatch);
  });

  it('scaffold-io exports stay off terminal-entry guards', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(isTerminalPauseDbState);
    expect(computePauseStorageRitualSyncPatch).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(isTerminalPauseDbState);
    expect(hasPersistablePauseSessionAnchor).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(buildPauseSessionPersistSnapshot).not.toBe(TERMINAL_PAUSE_DB_STATES);
    expect(hasPersistablePauseSessionAnchor).not.toBe(TERMINAL_PAUSE_DB_STATES);
  });
});
