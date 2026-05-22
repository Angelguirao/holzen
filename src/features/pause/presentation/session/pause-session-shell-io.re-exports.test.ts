import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionMountLogParams as buildMountLogFromFlow,
  coalescePauseSessionShellViewModel as coalesceShellVmFromFlow,
  computePauseHeaderBackIntent as computeHeaderBackFromFlow,
  computePauseSessionHydration as computeHydrationFromFlow,
  computePauseSessionResolved as computeResolvedFromFlow,
  hasPersistedPauseSessionPayload as hasPersistedFromFlow,
  isPauseSessionHeaderBackVisible as isHeaderBackVisibleFromFlow,
  isPauseSessionWaitingForInstanceFetch as isWaitingFromFlow,
} from '@/features/pause/application/use-cases/session/pause-session-shell-flow';
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
} from './pause-session-shell-io';

describe('pause-session-shell-io re-exports', () => {
  it('re-exports shell chrome helpers from session shell leaf modules', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationDirect);
    expect(computePauseSessionResolved).toBe(computeResolvedDirect);
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleDirect);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackDirect);
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogDirect);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmDirect);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedDirect);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingDirect);
  });

  it('presentation I/O bindings match pause-session-shell-flow CI anchor (leaf parity)', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationFromFlow);
    expect(computePauseSessionResolved).toBe(computeResolvedFromFlow);
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleFromFlow);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackFromFlow);
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogFromFlow);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmFromFlow);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedFromFlow);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingFromFlow);
  });
});
