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
  computePauseSessionHydration as computeHydrationDirect,
  computePauseSessionResolved as computeResolvedDirect,
} from './hydration';
import {
  computePauseHeaderBackIntent as computeHeaderBackDirect,
  isPauseSessionHeaderBackVisible as isHeaderBackVisibleDirect,
} from './header-back';
import { buildPauseSessionMountLogParams as buildMountLogDirect } from './mount-log-params';
import { coalescePauseSessionShellViewModel as coalesceShellVmDirect } from './shell-view-model';
import { hasPersistedPauseSessionPayload as hasPersistedDirect } from '@/features/pause/domain/session/persisted-session-guards';
import { isPauseSessionWaitingForInstanceFetch as isWaitingDirect } from '@/features/pause/domain/session/waiting-for-instance-fetch';
import {
  buildPauseSessionPersistSnapshot as buildPersistFromScaffoldFlow,
  buildPauseSessionScaffoldRitualDerived as buildDerivedFromScaffoldFlow,
  computePauseStorageRitualSyncPatch as computeSyncFromScaffoldFlow,
  hasPersistablePauseSessionAnchor as hasAnchorFromScaffoldFlow,
} from './pause-session-scaffold-flow';
import {
  isTerminalPauseDbState as isTerminalFromTerminalEntryFlow,
  persistedPauseSessionAllowsTerminalEntry as persistedAllowsFromTerminalEntryFlow,
  TERMINAL_PAUSE_DB_STATES as terminalStatesFromTerminalEntryFlow,
} from './pause-session-terminal-entry-flow';

describe('pause-session-shell-flow', () => {
  it('re-exports hydration helpers from hydration', () => {
    expect(typeof computePauseSessionHydration).toBe('function');
    expect(typeof computePauseSessionResolved).toBe('function');
    expect(computePauseSessionHydration).toBe(computeHydrationDirect);
    expect(computePauseSessionResolved).toBe(computeResolvedDirect);
  });

  it('re-exports header back visibility and intent helpers from header-back', () => {
    const input = {
      phase: 'session' as const,
      ritualEntry: 'brief' as const,
      briefStep: 'breath' as const,
      step: 'feel' as const,
      breathTimedActive: false,
      breathFirstTimedPatternStarted: false,
      breathSecondTimedPatternStarted: false,
      breathingFirstCompleted: false,
      breathingSecondCompleted: false,
    };

    expect(isPauseSessionHeaderBackVisible(input)).toBe(true);
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
    expect(isPauseSessionHeaderBackVisible).toBe(isHeaderBackVisibleDirect);
    expect(computePauseHeaderBackIntent).toBe(computeHeaderBackDirect);
  });

  it('re-exports mount log and shell view-model helpers from siblings', () => {
    expect(typeof buildPauseSessionMountLogParams).toBe('function');
    expect(typeof coalescePauseSessionShellViewModel).toBe('function');
    expect(buildPauseSessionMountLogParams).toBe(buildMountLogDirect);
    expect(coalescePauseSessionShellViewModel).toBe(coalesceShellVmDirect);
  });

  it('re-exports persisted-session guards from domain', () => {
    expect(hasPersistedPauseSessionPayload({ pauseInstanceId: 'pi-1', message: '' })).toBe(true);
    expect(
      isPauseSessionWaitingForInstanceFetch({
        hydrationStatus: 'fetch',
        fetchFailed: false,
        fetchedInstance: null,
      }),
    ).toBe(true);
    expect(hasPersistedPauseSessionPayload).toBe(hasPersistedDirect);
    expect(isPauseSessionWaitingForInstanceFetch).toBe(isWaitingDirect);
  });

  it('sibling cluster: scaffold-flow exports stay distinct from shell umbrella exports', () => {
    expect(computePauseSessionHydration).not.toBe(buildPersistFromScaffoldFlow);
    expect(computePauseSessionResolved).not.toBe(computeSyncFromScaffoldFlow);
    expect(coalescePauseSessionShellViewModel).not.toBe(buildDerivedFromScaffoldFlow);
    expect(hasPersistedPauseSessionPayload).not.toBe(hasAnchorFromScaffoldFlow);
    expect(buildPauseSessionMountLogParams).not.toBe(buildPersistFromScaffoldFlow);
  });

  it('sibling cluster: terminal-entry-flow exports stay distinct from shell umbrella exports', () => {
    expect(computePauseSessionHydration).not.toBe(isTerminalFromTerminalEntryFlow);
    expect(computePauseSessionResolved).not.toBe(persistedAllowsFromTerminalEntryFlow);
    expect(isPauseSessionHeaderBackVisible).not.toBe(isTerminalFromTerminalEntryFlow);
    expect(hasPersistedPauseSessionPayload).not.toBe(terminalStatesFromTerminalEntryFlow);
    expect(coalescePauseSessionShellViewModel).not.toBe(persistedAllowsFromTerminalEntryFlow);
  });
});
