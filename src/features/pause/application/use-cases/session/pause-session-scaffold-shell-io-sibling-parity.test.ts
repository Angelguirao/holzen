import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import {
  buildPauseSessionMountLogParams,
  coalescePauseSessionShellViewModel,
  computePauseHeaderBackIntent,
  computePauseSessionHydration,
  computePauseSessionResolved,
  hasPersistedPauseSessionPayload,
  isPauseSessionHeaderBackVisible,
  isPauseSessionWaitingForInstanceFetch,
} from '@/features/pause/presentation/session/pause-session-shell-io';
import * as scaffoldIo from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import * as shellIo from '@/features/pause/presentation/session/pause-session-shell-io';

/**
 * Sibling parity: scaffold-io vs shell-io presentation I/O (parity with
 * `pause-session-scaffold-shell-flow-sibling-parity.test.ts` and
 * `pause-session-terminal-entry-shell-flow-sibling-parity.test.ts`).
 */
describe('pause-session-scaffold-io ↔ pause-session-shell-io sibling parity', () => {
  it('scaffold-io and shell-io are distinct sibling presentation I/O anchors', () => {
    expect(typeof buildPauseSessionPersistSnapshot).toBe('function');
    expect(typeof computePauseStorageRitualSyncPatch).toBe('function');
    expect(typeof buildPauseSessionScaffoldRitualDerived).toBe('function');
    expect(typeof hasPersistablePauseSessionAnchor).toBe('function');
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(typeof isPauseSessionHeaderBackVisible).toBe('function');
    expect(typeof computePauseHeaderBackIntent).toBe('function');
    expect(typeof buildPauseSessionMountLogParams).toBe('function');
    expect(typeof coalescePauseSessionShellViewModel).toBe('function');
    expect(typeof hasPersistedPauseSessionPayload).toBe('function');
    expect(typeof isPauseSessionWaitingForInstanceFetch).toBe('function');

    expect('buildPauseSessionPersistSnapshot' in shellIo).toBe(false);
    expect('computePauseStorageRitualSyncPatch' in shellIo).toBe(false);
    expect('buildPauseSessionScaffoldRitualDerived' in shellIo).toBe(false);
    expect('hasPersistablePauseSessionAnchor' in shellIo).toBe(false);
    expect('computePauseSessionHydration' in scaffoldIo).toBe(false);
    expect('computePauseSessionResolved' in scaffoldIo).toBe(false);
    expect('isPauseSessionHeaderBackVisible' in scaffoldIo).toBe(false);
    expect('computePauseHeaderBackIntent' in scaffoldIo).toBe(false);
    expect('buildPauseSessionMountLogParams' in scaffoldIo).toBe(false);
    expect('coalescePauseSessionShellViewModel' in scaffoldIo).toBe(false);
    expect('hasPersistedPauseSessionPayload' in scaffoldIo).toBe(false);
    expect('isPauseSessionWaitingForInstanceFetch' in scaffoldIo).toBe(false);
  });

  it('scaffold-io exports stay off shell hydration and header-back helpers', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(computePauseSessionHydration);
    expect(computePauseStorageRitualSyncPatch).not.toBe(computePauseSessionResolved);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(isPauseSessionHeaderBackVisible);
    expect(hasPersistablePauseSessionAnchor).not.toBe(computePauseHeaderBackIntent);
    expect(buildPauseSessionPersistSnapshot).not.toBe(coalescePauseSessionShellViewModel);
    expect(hasPersistablePauseSessionAnchor).not.toBe(isPauseSessionWaitingForInstanceFetch);
  });

  it('shell-io exports stay off scaffold persist/sync/derived helpers', () => {
    expect(computePauseSessionHydration).not.toBe(buildPauseSessionPersistSnapshot);
    expect(computePauseSessionResolved).not.toBe(computePauseStorageRitualSyncPatch);
    expect(isPauseSessionHeaderBackVisible).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(computePauseHeaderBackIntent).not.toBe(hasPersistablePauseSessionAnchor);
    expect(buildPauseSessionMountLogParams).not.toBe(buildPauseSessionPersistSnapshot);
    expect(hasPersistedPauseSessionPayload).not.toBe(hasPersistablePauseSessionAnchor);
  });
});
