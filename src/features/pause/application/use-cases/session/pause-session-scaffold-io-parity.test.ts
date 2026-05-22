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
  buildPauseSessionPersistSnapshot as buildPersistFromScaffoldIo,
  buildPauseSessionScaffoldRitualDerived as buildDerivedFromScaffoldIo,
  computePauseStorageRitualSyncPatch as computeSyncFromScaffoldIo,
  hasPersistablePauseSessionAnchor as hasAnchorFromScaffoldIo,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';

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
});
