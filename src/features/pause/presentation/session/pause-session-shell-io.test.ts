import { describe, expect, it } from 'vitest';
import {
  computePauseSessionHydration as computeHydrationFromLeaf,
  computePauseSessionResolved as computeResolvedFromLeaf,
} from '@/features/pause/application/use-cases/session/hydration';
import {
  computePauseHeaderBackIntent as computeHeaderBackFromLeaf,
  isPauseSessionHeaderBackVisible as isHeaderBackVisibleFromLeaf,
} from '@/features/pause/application/use-cases/session/header-back';
import { buildPauseSessionMountLogParams as buildMountLogFromLeaf } from '@/features/pause/application/use-cases/session/mount-log-params';
import { coalescePauseSessionShellViewModel as coalesceShellVmFromLeaf } from '@/features/pause/application/use-cases/session/shell-view-model';
import { hasPersistedPauseSessionPayload as hasPersistedFromDomain } from '@/features/pause/domain/session/persisted-session-guards';
import { isPauseSessionWaitingForInstanceFetch as isWaitingFromDomain } from '@/features/pause/domain/session/waiting-for-instance-fetch';
import { pickPauseHolzenProvidersSlice } from './pause-session-providers-io';
import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from './pause-session-terminal-entry-io';
import {
  buildPauseSessionPersistSnapshot as buildPersistFromScaffoldIo,
  buildPauseSessionScaffoldRitualDerived as buildDerivedFromScaffoldIo,
  computePauseStorageRitualSyncPatch as computeSyncFromScaffoldIo,
  hasPersistablePauseSessionAnchor as hasAnchorFromScaffoldIo,
} from './scaffold/pause-session-scaffold-io';
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

describe('pause-session-shell-io', () => {
  it('re-exports hydration helpers from session shell subcluster modules', () => {
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(typeof hasPersistedPauseSessionPayload).toBe('function');
    expect(typeof isPauseSessionWaitingForInstanceFetch).toBe('function');
  });

  it('re-exports header back visibility and intent helpers for session conductors', () => {
    expect(
      isPauseSessionHeaderBackVisible({
        phase: 'session',
        ritualEntry: 'brief',
        briefStep: 'breath',
        step: 'feel',
        breathTimedActive: false,
        breathFirstTimedPatternStarted: false,
        breathSecondTimedPatternStarted: false,
        breathingFirstCompleted: false,
        breathingSecondCompleted: false,
      }),
    ).toBe(true);

    expect(
      computePauseHeaderBackIntent({
        ritualEntry: 'brief',
        briefStep: 'breath',
        step: 'feel',
        breathTimedActive: false,
        breathingFirstCompleted: false,
        breathingSecondCompleted: false,
      }),
    ).toEqual({ kind: 'go_back' });
  });

  it('presentation I/O re-exports match application leaf modules (direct re-export parity)', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationFromLeaf);
    expect(computePauseSessionResolved).toBe(computeResolvedFromLeaf);
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleFromLeaf);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackFromLeaf);
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogFromLeaf);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmFromLeaf);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedFromDomain);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingFromDomain);
  });

  it('sibling cluster: scaffold-io exports stay distinct from shell-io re-exports', () => {
    expect(computePauseSessionHydration).not.toBe(buildPersistFromScaffoldIo);
    expect(computePauseSessionResolved).not.toBe(computeSyncFromScaffoldIo);
    expect(coalescePauseSessionShellViewModel).not.toBe(buildDerivedFromScaffoldIo);
    expect(hasPersistedPauseSessionPayload).not.toBe(hasAnchorFromScaffoldIo);
    expect(buildPauseSessionMountLogParams).not.toBe(buildPersistFromScaffoldIo);
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-terminal-entry-io.test.ts` (shell hydration vs terminal guards).
   * Dedicated sibling file: `pause-session-terminal-entry-shell-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: terminal-entry-io exports stay distinct from shell-io', () => {
    expect(computePauseSessionHydration).not.toBe(isTerminalPauseDbState);
    expect(computePauseSessionResolved).not.toBe(persistedPauseSessionAllowsTerminalEntry);
    expect(coalescePauseSessionShellViewModel).not.toBe(TERMINAL_PAUSE_DB_STATES);
    expect(buildPauseSessionMountLogParams).not.toBe(isTerminalPauseDbState);
    // Reciprocal inline pins: `pause-session-terminal-entry-io.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-providers-io.test.ts`.
   * Dedicated sibling file: `pause-session-providers-shell-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: providers-io Holzen slice picker stays distinct from shell-io', () => {
    expect(computePauseSessionHydration).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseSessionResolved).not.toBe(pickPauseHolzenProvidersSlice);
    expect(isPauseSessionHeaderBackVisible).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseHeaderBackIntent).not.toBe(pickPauseHolzenProvidersSlice);
    expect(buildPauseSessionMountLogParams).not.toBe(pickPauseHolzenProvidersSlice);
    expect(coalescePauseSessionShellViewModel).not.toBe(pickPauseHolzenProvidersSlice);
    expect(hasPersistedPauseSessionPayload).not.toBe(pickPauseHolzenProvidersSlice);
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(pickPauseHolzenProvidersSlice);
  });
});
