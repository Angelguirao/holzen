import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  persistedTabSessionStorage: { port: 'persistedTabSessionStorage' },
}));

import {
  computePauseSessionHydration as computeHydrationDirect,
  computePauseSessionResolved as computeResolvedDirect,
} from '@/features/pause/application/use-cases/session/hydration';
import {
  computePauseHeaderBackIntent as computeHeaderBackDirect,
  isPauseSessionHeaderBackVisible as isHeaderBackVisibleDirect,
} from '@/features/pause/application/use-cases/session/header-back';
import { buildPauseSessionMountLogParams as buildMountLogDirect } from '@/features/pause/application/use-cases/session/mount-log-params';
import { coalescePauseSessionShellViewModel as coalesceShellVmDirect } from '@/features/pause/application/use-cases/session/shell-view-model';
import {
  hasPersistablePauseSessionAnchor as hasAnchorFromDomain,
  hasPersistedPauseSessionPayload as hasPersistedDirect,
} from '@/features/pause/domain/session/persisted-session-guards';
import { isPauseSessionWaitingForInstanceFetch as isWaitingDirect } from '@/features/pause/domain/session/waiting-for-instance-fetch';
import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow';
import {
  buildPauseSessionMountLogParams,
  coalescePauseSessionShellViewModel,
  computePauseHeaderBackIntent,
  computePauseSessionHydration,
  computePauseSessionResolved,
  hasPersistedPauseSessionPayload,
  isPauseSessionHeaderBackVisible,
  isPauseSessionWaitingForInstanceFetch,
} from '@/features/pause/application/use-cases/session/pause-session-shell-flow';
import {
  buildPauseSessionMountLogParams as buildMountLogFromShellIo,
  coalescePauseSessionShellViewModel as coalesceShellVmFromShellIo,
  computePauseHeaderBackIntent as computeHeaderBackFromShellIo,
  computePauseSessionHydration as computeHydrationFromShellIo,
  computePauseSessionResolved as computeResolvedFromShellIo,
  hasPersistedPauseSessionPayload as hasPersistedFromShellIo,
  isPauseSessionHeaderBackVisible as isHeaderBackVisibleFromShellIo,
  isPauseSessionWaitingForInstanceFetch as isWaitingFromShellIo,
} from '@/features/pause/presentation/session/pause-session-shell-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from '@/features/pause/presentation/session/pause-persisted-tab-session-io';

describe('pause-session-shell-io parity', () => {
  it('presentation I/O shell exports match pause-session-shell-flow CI umbrella', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationFromShellIo);
    expect(computePauseSessionResolved).toBe(computeResolvedFromShellIo);
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleFromShellIo);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackFromShellIo);
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogFromShellIo);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmFromShellIo);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedFromShellIo);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingFromShellIo);
  });

  it('session-shell-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationDirect);
    expect(computePauseSessionResolved).toBe(computeResolvedDirect);
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleDirect);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackDirect);
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogDirect);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmDirect);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedDirect);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingDirect);
  });

  it('presentation I/O re-exports leaf shell helpers (not port-bound tab-session wrappers)', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationDirect);
    expect(computePauseSessionHydration).not.toBe(loadPausePersistedTabSession);
    expect(buildPauseSessionMountLogParams).not.toBe(savePausePersistedTabSession);
    expect(coalescePauseSessionShellViewModel).not.toBe(clearPausePersistedTabSession);
    expect(hasPersistedPauseSessionPayload).not.toBe(loadPersistedTabSession);
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(savePersistedTabSession);
  });

  it('sibling cluster: shell presentation exports stay distinct from scaffold I/O and persisted-tab-session flow', () => {
    expect(computePauseSessionHydration).not.toBe(buildPauseSessionPersistSnapshot);
    expect(computePauseSessionHydration).not.toBe(computePauseStorageRitualSyncPatch);
    expect(computePauseSessionHydration).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(hasPersistedPauseSessionPayload).not.toBe(hasPersistablePauseSessionAnchor);
    expect(hasPersistedPauseSessionPayload).not.toBe(buildPauseSessionPersistSnapshot);
    expect(isPauseSessionHeaderBackVisible).not.toBe(loadPausePersistedTabSession);
    expect(computePauseHeaderBackIntent).not.toBe(savePausePersistedTabSession);
    expect(buildPauseSessionMountLogParams).not.toBe(clearPausePersistedTabSession);
    expect(coalescePauseSessionShellViewModel).not.toBe(loadPersistedTabSession);
    expect(hasPersistedDirect).not.toBe(hasAnchorFromDomain);
    expect(computeHydrationDirect).not.toBe(buildPauseSessionScaffoldRitualDerived);
  });

  it('persisted payload guard matches leaf behavior (extended behavioral pin)', () => {
    expect(hasPersistedPauseSessionPayload(null)).toBe(false);
    expect(hasPersistedPauseSessionPayload({ pauseInstanceId: 'pi-parity', message: '' })).toBe(
      true,
    );
    expect(hasPersistedPauseSessionPayload({ pauseInstanceId: null, message: 'copy' })).toBe(true);
    expect(hasPersistedPauseSessionPayload({ pauseInstanceId: null, message: '   ' })).toBe(false);
    expect(hasPersistedFromShellIo({ pauseInstanceId: 'pi-parity', message: '' })).toBe(
      hasPersistedDirect({ pauseInstanceId: 'pi-parity', message: '' }),
    );
  });
});
