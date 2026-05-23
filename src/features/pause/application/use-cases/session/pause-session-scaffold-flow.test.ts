import { describe, expect, it } from 'vitest';

import { hasPersistablePauseSessionAnchor as hasPersistableAnchorDirect } from '@/features/pause/domain/session/persisted-session-guards';

import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './pause-session-scaffold-flow';
import { buildPauseSessionPersistSnapshot as buildPersistSnapshotDirect } from './persist-snapshot';
import {
  buildPauseSessionScaffoldRitualDerived as buildScaffoldDerivedDirect,
} from './scaffold/scaffold-ritual-derived';
import {
  computePauseStorageRitualSyncPatch as computeStorageSyncDirect,
} from './storage-ritual-sync';
import { computePauseSessionHydration } from './pause-session-shell-flow';
import { pickPauseHolzenProvidersSlice } from './pause-session-providers-flow';

const companions = { haiku: null, groundingTitle: null, groundingBody: null } as const;
const companionPrefs = {
  breathing: true,
  haiku: true,
  grounding: true,
  signal: true,
  zoomOut: true,
  history: true,
} as const;

describe('pause-session-scaffold-flow', () => {
  it('re-exports persist snapshot builder from persist-snapshot', () => {
    const snapshot = buildPauseSessionPersistSnapshot({
      message: 'hello',
      context: null,
      pauseInstanceId: 'pi-1',
      companions,
      companionPrefs,
      severity: 'mild',
      moodDone: false,
      moodAfterDone: false,
      selectedMood: null,
      selectedMoodAfter: null,
      feelIntensity: null,
      shiftIntensity: null,
      phase: 'session',
      decision: null,
      step: 'reflect',
      breathingFirstCompleted: false,
      breathingSecondCompleted: false,
      frameDone: false,
      ritualEntry: 'deep',
      briefStep: 'feel',
      briefIntegrateDone: false,
      selectedBriefFace: null,
    });

    expect(snapshot.pauseInstanceId).toBe('pi-1');
    expect(buildPauseSessionPersistSnapshot).toBe(buildPersistSnapshotDirect);
  });

  it('re-exports storage ritual sync and scaffold derived helpers from siblings', () => {
    expect(typeof computePauseStorageRitualSyncPatch).toBe('function');
    expect(typeof buildPauseSessionScaffoldRitualDerived).toBe('function');
    expect(computePauseStorageRitualSyncPatch).toBe(computeStorageSyncDirect);
    expect(buildPauseSessionScaffoldRitualDerived).toBe(buildScaffoldDerivedDirect);
  });

  it('re-exports persistable session anchor guard from domain', () => {
    expect(typeof hasPersistablePauseSessionAnchor).toBe('function');
    expect(hasPersistablePauseSessionAnchor).toBe(hasPersistableAnchorDirect);
    expect(hasPersistablePauseSessionAnchor('pi-1', '')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, 'copy')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, '   ')).toBe(false);
  });

  it('sibling cluster: shell-flow exports stay distinct from scaffold umbrella exports', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(computePauseSessionHydration);
    expect(computePauseStorageRitualSyncPatch).not.toBe(computePauseSessionHydration);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(computePauseSessionHydration);
    expect(hasPersistablePauseSessionAnchor).not.toBe(computePauseSessionHydration);
  });

  it('sibling cluster: providers-flow export stays distinct from scaffold umbrella exports', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(pickPauseHolzenProvidersSlice);
    expect(computePauseStorageRitualSyncPatch).not.toBe(pickPauseHolzenProvidersSlice);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(pickPauseHolzenProvidersSlice);
    expect(hasPersistablePauseSessionAnchor).not.toBe(pickPauseHolzenProvidersSlice);
    // Full cross-umbrella pins: `pause-session-providers-scaffold-flow-sibling-parity.test.ts`.
  });
});
