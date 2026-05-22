import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/application/use-cases/session/pause-session-scaffold-flow';
import {
  buildPauseSessionPersistSnapshot as buildPersistFromLeaf,
} from '@/features/pause/application/use-cases/session/persist-snapshot';
import {
  buildPauseSessionScaffoldRitualDerived as buildDerivedFromLeaf,
} from '@/features/pause/application/use-cases/session/scaffold/scaffold-ritual-derived';
import {
  computePauseStorageRitualSyncPatch as computeSyncFromStorageLeaf,
} from '@/features/pause/application/use-cases/session/storage-ritual-sync';
import { hasPersistablePauseSessionAnchor as hasAnchorFromDomain } from '@/features/pause/domain/session/persisted-session-guards';
import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow';
import {
  computePauseSessionHydration,
  hasPersistedPauseSessionPayload,
} from '@/features/pause/presentation/session/pause-session-shell-io';
import {
  buildPauseSessionPersistSnapshot as buildPersistFromScaffoldIo,
  buildPauseSessionScaffoldRitualDerived as buildDerivedFromScaffoldIo,
  computePauseStorageRitualSyncPatch as computeSyncFromScaffoldIo,
  hasPersistablePauseSessionAnchor as hasAnchorFromScaffoldIo,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';

/**
 * Scaffold CI umbrella ↔ presentation I/O delegation parity.
 * Terminal-entry sibling: `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins below ↔ `pause-session-terminal-entry-io-parity.test.ts`.
 */
describe('pause-session-scaffold-io parity', () => {
  it('presentation I/O scaffold exports match pause-session-scaffold-flow CI umbrella', () => {
    expect(buildPauseSessionPersistSnapshot).toBe(buildPersistFromScaffoldIo);
    expect(computePauseStorageRitualSyncPatch).toBe(computeSyncFromScaffoldIo);
    expect(buildPauseSessionScaffoldRitualDerived).toBe(buildDerivedFromScaffoldIo);
    expect(hasPersistablePauseSessionAnchor).toBe(hasAnchorFromScaffoldIo);
  });

  it('scaffold-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(buildPauseSessionPersistSnapshot).toBe(buildPersistFromLeaf);
    expect(computePauseStorageRitualSyncPatch).toBe(computeSyncFromStorageLeaf);
    expect(buildPauseSessionScaffoldRitualDerived).toBe(buildDerivedFromLeaf);
    expect(hasPersistablePauseSessionAnchor).toBe(hasAnchorFromDomain);
  });

  it('presentation I/O re-exports leaf helpers (not port-bound tab-session use cases)', () => {
    expect(buildPauseSessionPersistSnapshot).toBe(buildPersistFromLeaf);
    expect(buildPauseSessionPersistSnapshot).not.toBe(loadPersistedTabSession);
    expect(computePauseStorageRitualSyncPatch).not.toBe(savePersistedTabSession);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(clearPersistedTabSession);
    expect(hasPersistablePauseSessionAnchor).not.toBe(loadPersistedTabSession);
  });

  it('sibling cluster: scaffold presentation exports stay distinct from shell I/O and persisted-tab-session flow', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(computePauseSessionHydration);
    expect(computePauseStorageRitualSyncPatch).not.toBe(computePauseSessionHydration);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(hasPersistedPauseSessionPayload);
    expect(hasPersistablePauseSessionAnchor).not.toBe(hasPersistedPauseSessionPayload);
    expect(hasPersistablePauseSessionAnchor).not.toBe(loadPersistedTabSession);
    expect(buildPauseSessionPersistSnapshot).not.toBe(loadPersistedTabSession);
    expect(computePauseStorageRitualSyncPatch).not.toBe(savePersistedTabSession);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(clearPersistedTabSession);
    expect(hasAnchorFromDomain).not.toBe(computePauseSessionHydration);
  });

  it('persistable anchor guard matches leaf behavior (extended behavioral pin)', () => {
    expect(hasPersistablePauseSessionAnchor('pi-parity', '')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, 'copy')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, '   ')).toBe(false);
    expect(hasAnchorFromScaffoldIo('pi-parity', '')).toBe(
      hasAnchorFromDomain('pi-parity', ''),
    );
    expect(hasAnchorFromScaffoldIo(null, 'copy')).toBe(hasAnchorFromDomain(null, 'copy'));
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-terminal-entry-io-parity.test.ts` (scaffold persist vs terminal guards).
   * Dedicated sibling file: `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: terminal-entry-io exports stay distinct from scaffold-io helpers', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(isTerminalPauseDbState);
    expect(computePauseStorageRitualSyncPatch).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(isTerminalPauseDbState);
    expect(hasPersistablePauseSessionAnchor).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(buildPauseSessionPersistSnapshot).not.toBe(TERMINAL_PAUSE_DB_STATES);
    expect(hasPersistablePauseSessionAnchor).not.toBe(TERMINAL_PAUSE_DB_STATES);
    // Reciprocal inline pins: `pause-session-terminal-entry-io-parity.test.ts`.
    // Full pins: `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts`.
  });
});
