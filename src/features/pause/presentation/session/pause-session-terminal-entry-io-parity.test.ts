/**
 * Presentation I/O parity for session terminal-entry cluster (colocated beside
 * `pause-session-terminal-entry-io.ts`; application `pause-session-terminal-entry-flow` stays CI umbrella).
 * Application mirror: `application/use-cases/session/pause-session-terminal-entry-io-parity.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  persistedTabSessionStorage: { port: 'persistedTabSessionStorage' },
}));

import {
  isTerminalPauseDbState,
  persistedPauseSessionAllowsTerminalEntry,
  TERMINAL_PAUSE_DB_STATES,
} from '@/features/pause/application/use-cases/session/pause-session-terminal-entry-flow';
import {
  clearPersistedTabSession,
  loadPersistedTabSession,
  savePersistedTabSession,
} from '@/features/pause/application/use-cases/session/pause-session-persisted-tab-session-flow';
import {
  isTerminalPauseDbState as isTerminalDirect,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsDirect,
  TERMINAL_PAUSE_DB_STATES as terminalStatesDirect,
} from '@/features/pause/application/use-cases/session/terminal-entry-guard';
import {
  isTerminalPauseDbState as isTerminalFromTerminalEntryIo,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromTerminalEntryIo,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromTerminalEntryIo,
} from '@/features/pause/presentation/session/pause-session-terminal-entry-io';
import {
  clearPausePersistedTabSession,
  loadPausePersistedTabSession,
  savePausePersistedTabSession,
} from '@/features/pause/presentation/session/pause-persisted-tab-session-io';
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
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from '@/features/pause/presentation/session/scaffold/pause-session-scaffold-io';
import { makeTestPersistedPauseSession } from '@/test/fixtures/make-test-persisted-pause-session';

/**
 * Terminal-entry CI umbrella ↔ presentation I/O delegation parity.
 * Shell-io sibling: `pause-session-terminal-entry-shell-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins below ↔ `pause-session-shell-io-parity.test.ts` and `pause-session-persisted-tab-session-io-parity.test.ts`.
 */
describe('pause-session-terminal-entry-io parity', () => {
  it('presentation I/O terminal-entry exports match pause-session-terminal-entry-flow CI umbrella', () => {
    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesFromTerminalEntryIo);
    expect(isTerminalPauseDbState).toBe(isTerminalFromTerminalEntryIo);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsFromTerminalEntryIo);
  });

  it('terminal-entry-flow CI umbrella composes the same leaf module as presentation I/O', () => {
    expect(TERMINAL_PAUSE_DB_STATES).toBe(terminalStatesDirect);
    expect(isTerminalPauseDbState).toBe(isTerminalDirect);
    expect(persistedPauseSessionAllowsTerminalEntry).toBe(persistedAllowsDirect);
  });

  it('presentation I/O re-exports leaf guards (not port-bound tab-session wrappers)', () => {
    expect(isTerminalPauseDbState).toBe(isTerminalDirect);
    expect(isTerminalPauseDbState).not.toBe(loadPausePersistedTabSession);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(savePausePersistedTabSession);
    expect(TERMINAL_PAUSE_DB_STATES).not.toBe(clearPausePersistedTabSession);
  });

  it('sibling cluster: terminal-entry presentation exports stay distinct from persisted-tab-session presentation exports', () => {
    expect(isTerminalPauseDbState).not.toBe(loadPausePersistedTabSession);
    expect(isTerminalPauseDbState).not.toBe(savePausePersistedTabSession);
    expect(isTerminalPauseDbState).not.toBe(clearPausePersistedTabSession);
    expect(persistedPauseSessionAllowsTerminalEntry).not.toBe(loadPersistedTabSession);
    expect(TERMINAL_PAUSE_DB_STATES).not.toBe(loadPausePersistedTabSession);
    expect(isTerminalDirect).not.toBe(loadPersistedTabSession);
  });

  it('persisted allow helper matches leaf behavior (extended behavioral pin)', () => {
    const restored = makeTestPersistedPauseSession({ pauseInstanceId: 'inst-parity' });
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'inst-parity')).toBe(true);
    expect(persistedPauseSessionAllowsTerminalEntry(restored, 'other')).toBe(false);
    expect(persistedAllowsFromTerminalEntryIo(restored, 'inst-parity')).toBe(
      persistedAllowsDirect(restored, 'inst-parity'),
    );
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-shell-io-parity.test.ts` (terminal guards vs shell chrome).
   * Dedicated sibling file: `pause-session-terminal-entry-shell-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: shell-io exports stay distinct from terminal-entry-io guards', () => {
    expect(isTerminalFromTerminalEntryIo).not.toBe(computePauseSessionHydration);
    expect(isTerminalFromTerminalEntryIo).not.toBe(computePauseSessionResolved);
    expect(persistedAllowsFromTerminalEntryIo).not.toBe(isPauseSessionHeaderBackVisible);
    expect(terminalStatesFromTerminalEntryIo).not.toBe(coalescePauseSessionShellViewModel);
    expect(isTerminalFromTerminalEntryIo).not.toBe(buildPauseSessionMountLogParams);
    expect(persistedAllowsFromTerminalEntryIo).not.toBe(hasPersistedPauseSessionPayload);
    expect(isTerminalFromTerminalEntryIo).not.toBe(isPauseSessionWaitingForInstanceFetch);
    // Reciprocal inline pins: `pause-session-shell-io-parity.test.ts`.
    // Full pins: `pause-session-terminal-entry-shell-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-scaffold-io-parity.test.ts` (terminal guards vs scaffold persist).
   * Dedicated sibling file: `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: scaffold-io exports stay distinct from terminal-entry-io guards', () => {
    expect(isTerminalFromTerminalEntryIo).not.toBe(buildPauseSessionPersistSnapshot);
    expect(isTerminalFromTerminalEntryIo).not.toBe(computePauseStorageRitualSyncPatch);
    expect(persistedAllowsFromTerminalEntryIo).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(terminalStatesFromTerminalEntryIo).not.toBe(hasPersistablePauseSessionAnchor);
    expect(isTerminalFromTerminalEntryIo).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(persistedAllowsFromTerminalEntryIo).not.toBe(computePauseStorageRitualSyncPatch);
    // Reciprocal inline pins: `pause-session-scaffold-io-parity.test.ts`.
    // Full pins: `pause-session-terminal-entry-scaffold-io-sibling-parity.test.ts`.
  });
});
