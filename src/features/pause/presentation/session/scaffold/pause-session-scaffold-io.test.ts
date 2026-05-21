import { describe, expect, it } from 'vitest';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
} from './pause-session-scaffold-io';

describe('pause-session-scaffold-io', () => {
  it('re-exports persist snapshot builder for scaffold conductors', () => {
    const snapshot = buildPauseSessionPersistSnapshot({
      message: 'm',
      context: null,
      pauseInstanceId: 'pi-1',
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
    });

    expect(snapshot.pauseInstanceId).toBe('pi-1');
    expect(snapshot.step).toBe('reflect');
  });

  it('re-exports storage ritual sync patch helper', () => {
    const patch = computePauseStorageRitualSyncPatch('pi-1', null);
    expect(patch).not.toBeNull();
    expect(patch!.ritualEntry).toBe('picker');
    expect(patch!.briefStep).toBe('feel');
  });

  it('re-exports scaffold ritual derived builder', () => {
    const derived = buildPauseSessionScaffoldRitualDerived({
      ritualEntry: 'deep',
      step: 'reflect',
      t: (key: string) => key,
    });

    expect(derived.macroProgressLine).toBeDefined();
  });
});
