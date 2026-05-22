import { describe, expect, it } from 'vitest';

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
import { hasPersistedPauseSessionPayload as hasPersistedDirect } from '@/features/pause/domain/session/persisted-session-guards';
import { isPauseSessionWaitingForInstanceFetch as isWaitingDirect } from '@/features/pause/domain/session/waiting-for-instance-fetch';
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
});
