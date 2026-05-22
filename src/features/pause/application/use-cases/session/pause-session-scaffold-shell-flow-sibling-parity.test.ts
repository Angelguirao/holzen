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
} from './pause-session-shell-flow';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './pause-session-scaffold-flow';
import * as scaffoldFlow from './pause-session-scaffold-flow';
import * as shellFlow from './pause-session-shell-flow';

describe('pause-session-scaffold-flow ↔ pause-session-shell-flow sibling parity', () => {
  it('scaffold-flow and shell-flow are distinct sibling CI anchors', () => {
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

    expect('buildPauseSessionPersistSnapshot' in shellFlow).toBe(false);
    expect('computePauseStorageRitualSyncPatch' in shellFlow).toBe(false);
    expect('buildPauseSessionScaffoldRitualDerived' in shellFlow).toBe(false);
    expect('hasPersistablePauseSessionAnchor' in shellFlow).toBe(false);
    expect('computePauseSessionHydration' in scaffoldFlow).toBe(false);
    expect('computePauseSessionResolved' in scaffoldFlow).toBe(false);
    expect('isPauseSessionHeaderBackVisible' in scaffoldFlow).toBe(false);
    expect('computePauseHeaderBackIntent' in scaffoldFlow).toBe(false);
    expect('buildPauseSessionMountLogParams' in scaffoldFlow).toBe(false);
    expect('coalescePauseSessionShellViewModel' in scaffoldFlow).toBe(false);
    expect('hasPersistedPauseSessionPayload' in scaffoldFlow).toBe(false);
    expect('isPauseSessionWaitingForInstanceFetch' in scaffoldFlow).toBe(false);
  });

  it('scaffold umbrella exports stay off shell hydration and header-back helpers', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(computePauseSessionHydration);
    expect(computePauseStorageRitualSyncPatch).not.toBe(computePauseSessionResolved);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(isPauseSessionHeaderBackVisible);
    expect(hasPersistablePauseSessionAnchor).not.toBe(computePauseHeaderBackIntent);
    expect(buildPauseSessionPersistSnapshot).not.toBe(coalescePauseSessionShellViewModel);
    expect(hasPersistablePauseSessionAnchor).not.toBe(isPauseSessionWaitingForInstanceFetch);
  });

  it('shell umbrella exports stay off scaffold persist/sync/derived helpers', () => {
    expect(computePauseSessionHydration).not.toBe(buildPauseSessionPersistSnapshot);
    expect(computePauseSessionResolved).not.toBe(computePauseStorageRitualSyncPatch);
    expect(isPauseSessionHeaderBackVisible).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(computePauseHeaderBackIntent).not.toBe(hasPersistablePauseSessionAnchor);
    expect(buildPauseSessionMountLogParams).not.toBe(buildPauseSessionPersistSnapshot);
    expect(hasPersistedPauseSessionPayload).not.toBe(hasPersistablePauseSessionAnchor);
  });
});
