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
});
