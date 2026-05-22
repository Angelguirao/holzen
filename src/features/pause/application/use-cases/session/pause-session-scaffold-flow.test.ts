import { describe, expect, it } from 'vitest';

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
    expect(hasPersistablePauseSessionAnchor('pi-1', '')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, 'copy')).toBe(true);
    expect(hasPersistablePauseSessionAnchor(null, '   ')).toBe(false);
  });
});
