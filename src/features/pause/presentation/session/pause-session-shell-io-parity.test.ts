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
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow';
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
} from './pause-session-shell-io';
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
import {
  isTerminalPauseDbState as isTerminalFromTerminalEntryIo,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromTerminalEntryIo,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromTerminalEntryIo,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';
import { pickPauseHolzenProvidersSlice } from '@/features/pause/presentation/session/pause-session-providers-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

/**
 * Shell CI umbrella ↔ presentation I/O delegation parity (colocated beside `pause-session-shell-io.ts`).
 * Application-layer sibling parity files stay under `application/.../session/`.
 * Terminal-entry-io sibling: `pause-session-terminal-entry-shell-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins below ↔ `application/.../session/pause-session-terminal-entry-io-parity.test.ts`.
 * Providers-io sibling: `pause-session-providers-shell-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-session-providers-io-parity.test.ts`.
 */
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
    expect(computePauseSessionResolved).not.toBe(savePausePersistedTabSession);
    expect(hasPersistedPauseSessionPayload).not.toBe(clearPausePersistedTabSession);
    expect(isPauseSessionHeaderBackVisible).not.toBe(loadPersistedTabSession);
    expect(buildPauseSessionMountLogParams).not.toBe(savePersistedTabSession);
    expect(coalescePauseSessionShellViewModel).not.toBe(clearPersistedTabSession);
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(isTerminalPauseDbState);
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-terminal-entry-io-parity.test.ts` (shell chrome vs terminal guards).
   * Dedicated sibling file: `pause-session-terminal-entry-shell-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: terminal-entry-io exports stay distinct from shell-io hydration and header-back', () => {
    expect(computePauseSessionHydration).not.toBe(isTerminalFromTerminalEntryIo);
    expect(computePauseSessionResolved).not.toBe(persistedAllowsFromTerminalEntryIo);
    expect(isPauseSessionHeaderBackVisible).not.toBe(isTerminalFromTerminalEntryIo);
    expect(computePauseHeaderBackIntent).not.toBe(terminalStatesFromTerminalEntryIo);
    expect(buildPauseSessionMountLogParams).not.toBe(isTerminalFromTerminalEntryIo);
    expect(hasPersistedPauseSessionPayload).not.toBe(persistedAllowsFromTerminalEntryIo);
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(isTerminalFromTerminalEntryIo);
    // Reciprocal inline pins: `application/.../session/pause-session-terminal-entry-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-providers-io-parity.test.ts` (shell chrome vs Holzen slice).
   * Dedicated sibling file: `pause-session-providers-shell-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: providers-io export stays distinct from shell-io hydration and header-back', () => {
    expect(computePauseSessionHydration).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseSessionResolved).not.toBe(pickPauseHolzenProvidersSlice);
    expect(isPauseSessionHeaderBackVisible).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseHeaderBackIntent).not.toBe(pickPauseHolzenProvidersSlice);
    expect(buildPauseSessionMountLogParams).not.toBe(pickPauseHolzenProvidersSlice);
    expect(coalescePauseSessionShellViewModel).not.toBe(pickPauseHolzenProvidersSlice);
    expect(hasPersistedPauseSessionPayload).not.toBe(pickPauseHolzenProvidersSlice);
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computeHydrationFromShellIo).not.toBe(pickPauseHolzenProvidersSlice);
    // Reciprocal inline pins: `pause-session-providers-io-parity.test.ts`.
    // Full pins: `pause-session-providers-shell-io-sibling-parity.test.ts`.
  });

  /**
   * Dedicated sibling file: `pause-session-shell-scaffold-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: shell presentation exports stay distinct from scaffold, terminal-entry, and persisted-tab-session I/O', () => {
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
    expect(isPauseSessionWaitingForInstanceFetch).not.toBe(isTerminalPauseDbState);
    expect(computePauseSessionHydration).not.toBe(isTerminalFromTerminalEntryIo);
    expect(hasPersistedPauseSessionPayload).not.toBe(persistedAllowsFromTerminalEntryIo);
    expect(computePauseHeaderBackIntent).not.toBe(TERMINAL_PAUSE_DB_STATES);
    expect(computePauseHeaderBackIntent).not.toBe(terminalStatesFromTerminalEntryIo);
  });

  it('persisted payload guard matches leaf behavior (extended behavioral pin)', () => {
    const restored = makeTestPersistedPauseSession({ pauseInstanceId: 'inst-parity' });
    expect(hasPersistedPauseSessionPayload(restored)).toBe(true);
    expect(hasPersistedPauseSessionPayload(null)).toBe(false);
    expect(hasPersistedPauseSessionPayload({ pauseInstanceId: 'pi-parity', message: '' })).toBe(
      true,
    );
    expect(hasPersistedPauseSessionPayload({ pauseInstanceId: null, message: 'copy' })).toBe(true);
    expect(hasPersistedPauseSessionPayload({ pauseInstanceId: null, message: '   ' })).toBe(false);
    expect(hasPersistedFromShellIo(restored)).toBe(hasPersistedDirect(restored));
    expect(hasPersistedFromShellIo(null)).toBe(hasPersistedDirect(null));
    expect(hasPersistedFromShellIo({ pauseInstanceId: 'pi-parity', message: '' })).toBe(
      hasPersistedDirect({ pauseInstanceId: 'pi-parity', message: '' }),
    );
  });
});
