import { describe, expect, it } from 'vitest';

import { pickPauseHolzenProvidersSlice as pickSliceDirect } from '@/features/pause/application/use-cases/session/pause-holzen-providers-slice';
import { pickPauseHolzenProvidersSlice } from '@/features/pause/application/use-cases/session/pause-session-providers-flow';
import {
  pickPauseHolzenProvidersSlice as pickSliceFromProvidersIo,
} from '@/features/pause/presentation/session/pause-session-providers-io';
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

/**
 * Shell-io / scaffold-io sibling pins: `pause-session-providers-shell-io-sibling-parity.test.ts`
 * and `pause-session-providers-scaffold-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-session-shell-io-parity.test.ts` / `pause-session-scaffold-io-parity.test.ts`.
 */
describe('pause-session-providers-io parity', () => {
  it('presentation I/O provider picker matches pause-session-providers-flow CI umbrella', () => {
    expect(pickPauseHolzenProvidersSlice).toBe(pickSliceFromProvidersIo);
  });

  it('providers-flow CI umbrella composes the same leaf module as presentation I/O', () => {
    expect(pickPauseHolzenProvidersSlice).toBe(pickSliceDirect);
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-scaffold-io-parity.test.ts` (Holzen slice vs scaffold persist).
   * Dedicated sibling file: `pause-session-providers-scaffold-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: scaffold-io exports stay distinct from providers-io', () => {
    expect(pickSliceFromProvidersIo).not.toBe(buildPauseSessionPersistSnapshot);
    expect(pickSliceFromProvidersIo).not.toBe(computePauseStorageRitualSyncPatch);
    expect(pickSliceFromProvidersIo).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(pickSliceFromProvidersIo).not.toBe(hasPersistablePauseSessionAnchor);
    expect(pickPauseHolzenProvidersSlice).not.toBe(buildPauseSessionPersistSnapshot);
    // Reciprocal inline pins: `pause-session-scaffold-io-parity.test.ts`.
    // Full pins: `pause-session-providers-scaffold-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-shell-io-parity.test.ts` (Holzen slice vs shell chrome).
   * Dedicated sibling file: `pause-session-providers-shell-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: shell-io exports stay distinct from providers-io', () => {
    expect(pickSliceFromProvidersIo).not.toBe(computePauseSessionHydration);
    expect(pickSliceFromProvidersIo).not.toBe(computePauseSessionResolved);
    expect(pickSliceFromProvidersIo).not.toBe(isPauseSessionHeaderBackVisible);
    expect(pickSliceFromProvidersIo).not.toBe(computePauseHeaderBackIntent);
    expect(pickSliceFromProvidersIo).not.toBe(buildPauseSessionMountLogParams);
    expect(pickSliceFromProvidersIo).not.toBe(coalescePauseSessionShellViewModel);
    expect(pickSliceFromProvidersIo).not.toBe(hasPersistedPauseSessionPayload);
    expect(pickSliceFromProvidersIo).not.toBe(isPauseSessionWaitingForInstanceFetch);
    expect(pickPauseHolzenProvidersSlice).not.toBe(computePauseSessionHydration);
    // Reciprocal inline pins: `pause-session-shell-io-parity.test.ts`.
    // Full pins: `pause-session-providers-shell-io-sibling-parity.test.ts`.
  });
});
