import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionPersistSnapshot as buildPersistFromFlow,
  buildPauseSessionScaffoldRitualDerived as buildDerivedFromFlow,
  computePauseStorageRitualSyncPatch as computeSyncFromFlow,
  hasPersistablePauseSessionAnchor as hasAnchorFromFlow,
} from '@/features/pause/application/use-cases/session/pause-session-scaffold-flow';
import {
  buildPauseSessionPersistSnapshot as buildPersistDirect,
  type PauseSessionPersistSnapshotInput,
} from '@/features/pause/application/use-cases/session/persist-snapshot';
import {
  buildPauseSessionScaffoldRitualDerived as buildDerivedDirect,
} from '@/features/pause/application/use-cases/session/scaffold/scaffold-ritual-derived';
import {
  computePauseStorageRitualSyncPatch as computeSyncDirect,
} from '@/features/pause/application/use-cases/session/storage-ritual-sync';
import { hasPersistablePauseSessionAnchor as hasAnchorDirect } from '@/features/pause/domain/session/persisted-session-guards';

import { pickPauseHolzenProvidersSlice as pickSliceFromProvidersIo } from '../pause-session-providers-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './pause-session-scaffold-io';

describe('pause-session-scaffold-io re-exports', () => {
  it('re-exports persist/sync/derived helpers from session scaffold leaf modules', () => {
    expect(buildPauseSessionPersistSnapshot).toBe(buildPersistDirect);
    expect(computePauseStorageRitualSyncPatch).toBe(computeSyncDirect);
    expect(buildPauseSessionScaffoldRitualDerived).toBe(buildDerivedDirect);
    expect(hasPersistablePauseSessionAnchor).toBe(hasAnchorDirect);
  });

  it('presentation I/O bindings match pause-session-scaffold-flow CI anchor (leaf parity)', () => {
    expect(buildPauseSessionPersistSnapshot).toBe(buildPersistFromFlow);
    expect(computePauseStorageRitualSyncPatch).toBe(computeSyncFromFlow);
    expect(buildPauseSessionScaffoldRitualDerived).toBe(buildDerivedFromFlow);
    expect(hasPersistablePauseSessionAnchor).toBe(hasAnchorFromFlow);
  });

  it('sibling cluster: providers-io export stays distinct from scaffold-io exports', () => {
    expect(buildPauseSessionPersistSnapshot).not.toBe(pickSliceFromProvidersIo);
    expect(computePauseStorageRitualSyncPatch).not.toBe(pickSliceFromProvidersIo);
    expect(buildPauseSessionScaffoldRitualDerived).not.toBe(pickSliceFromProvidersIo);
    expect(hasPersistablePauseSessionAnchor).not.toBe(pickSliceFromProvidersIo);
  });

  it('persist snapshot export remains callable (smoke)', () => {
    const input: PauseSessionPersistSnapshotInput = {
      message: 'm',
      context: null,
      pauseInstanceId: 'pi-scaffold-reexport',
      companions: { haiku: null, groundingTitle: null, groundingBody: null },
      companionPrefs: {
        breathing: true,
        haiku: true,
        grounding: true,
        signal: true,
        zoomOut: true,
        history: true,
      },
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
    };
    expect(buildPauseSessionPersistSnapshot(input).pauseInstanceId).toBe('pi-scaffold-reexport');
  });
});
