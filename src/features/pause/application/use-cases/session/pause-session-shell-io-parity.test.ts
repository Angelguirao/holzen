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
import { hasPersistedPauseSessionPayload as hasPersistedDirect } from '@/features/pause/domain/session/persisted-session-guards';
import { isPauseSessionWaitingForInstanceFetch as isWaitingDirect } from '@/features/pause/domain/session/waiting-for-instance-fetch';
import { isTerminalPauseDbState } from '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow';
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
} from './pause-session-shell-flow';
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
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
import {
  isTerminalPauseDbState as isTerminalFromTerminalEntryIo,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromTerminalEntryIo,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromTerminalEntryIo,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

/**
 * Application shell I/O parity (colocated beside `pause-session-shell-flow.ts`).
 * Presentation mirror: `presentation/session/pause-session-shell-io-parity.test.ts`.
 * Imports shell-flow CI umbrella for `.toBe` identity pins only — production shell I/O keeps
 * sibling session subcluster leaf imports.
 * Terminal-entry-io sibling: reciprocal inline pins ↔ `pause-session-terminal-entry-io-parity.test.ts`
 * (application + presentation); dedicated `pause-session-terminal-entry-shell-io-sibling-parity.test.ts`.
 */
describe('pause-session-shell-io parity (application)', () => {
  it('presentation shell I/O matches session shell-flow CI umbrella', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationFromShellIo);
    expect(computePauseSessionResolved).toBe(computeResolvedFromShellIo);
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleFromShellIo);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackFromShellIo);
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogFromShellIo);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmFromShellIo);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedFromShellIo);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingFromShellIo);
  });

  it('shell-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(computePauseSessionHydration).toBe(computeHydrationDirect);
    expect(computePauseSessionResolved).toBe(computeResolvedDirect);
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleDirect);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackDirect);
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogDirect);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmDirect);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedDirect);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingDirect);
  });

  it('persisted payload guard matches leaf behavior (extended behavioral pin)', () => {
    const restored = makeTestPersistedPauseSession({ pauseInstanceId: 'inst-parity' });
    expect(hasPersistedPauseSessionPayload(restored)).toBe(true);
    expect(hasPersistedPauseSessionPayload(null)).toBe(false);
    expect(hasPersistedFromShellIo(restored)).toBe(hasPersistedDirect(restored));
    expect(hasPersistedFromShellIo(null)).toBe(hasPersistedDirect(null));
  });

  it('presentation shell I/O re-exports leaf shell helpers (not port-bound tab-session wrappers)', () => {
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
    expect(computeHydrationFromShellIo).not.toBe(isTerminalFromTerminalEntryIo);
    expect(computeResolvedFromShellIo).not.toBe(persistedAllowsFromTerminalEntryIo);
    expect(isHeaderBackVisibleFromShellIo).not.toBe(isTerminalFromTerminalEntryIo);
    expect(computeHeaderBackFromShellIo).not.toBe(terminalStatesFromTerminalEntryIo);
    expect(buildMountLogFromShellIo).not.toBe(isTerminalFromTerminalEntryIo);
    expect(hasPersistedFromShellIo).not.toBe(persistedAllowsFromTerminalEntryIo);
    expect(isWaitingFromShellIo).not.toBe(isTerminalFromTerminalEntryIo);
    // Reciprocal inline pins: `application/.../pause-session-terminal-entry-io-parity.test.ts`,
    // `presentation/session/pause-session-terminal-entry-io-parity.test.ts`.
    // Full pins: `pause-session-terminal-entry-shell-io-sibling-parity.test.ts`.
  });
});
