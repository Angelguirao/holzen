import { describe, expect, it } from 'vitest';

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
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './pause-session-scaffold-flow';
import {
  buildPauseSessionPersistSnapshot as buildPersistFromScaffoldIo,
  buildPauseSessionScaffoldRitualDerived as buildDerivedFromScaffoldIo,
  computePauseStorageRitualSyncPatch as computeSyncFromScaffoldIo,
  hasPersistablePauseSessionAnchor as hasAnchorFromScaffoldIo,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';

/**
 * Application scaffold I/O parity (colocated beside `pause-session-scaffold-flow.ts`).
 * Presentation mirror: `presentation/session/scaffold/pause-session-scaffold-io-parity.test.ts`.
 * Imports scaffold-flow CI umbrella for `.toBe` identity pins only — production scaffold I/O keeps
 * sibling session subcluster leaf imports.
 */
describe('pause-session-scaffold-io parity (application)', () => {
  it('presentation scaffold I/O matches pause-session-scaffold-flow CI umbrella', () => {
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

  it('persistable anchor guard matches leaf behavior (extended behavioral pin)', () => {
    expect(hasPersistablePauseSessionAnchor('pi-parity', '')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, 'copy')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, '   ')).toBe(false);
    expect(hasAnchorFromScaffoldIo('pi-parity', '')).toBe(
      hasAnchorFromDomain('pi-parity', ''),
    );
    expect(hasAnchorFromScaffoldIo(null, 'copy')).toBe(hasAnchorFromDomain(null, 'copy'));
  });
});
