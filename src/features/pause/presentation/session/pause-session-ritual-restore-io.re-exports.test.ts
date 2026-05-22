import { describe, expect, it } from 'vitest';

import { mapPersistedStep as mapPersistedStepDirect } from '@/features/pause/domain/session/map-persisted-step';
import {
  initialBreathingFirstCompletedFromRestored as initialBreathFirstDirect,
  initialBreathingSecondCompletedFromRestored as initialBreathSecondDirect,
} from '@/features/pause/application/use-cases/ritual/breathe/restored-breath-ritual-state';
import {
  initialDecisionFromRestored as initialDecisionDirect,
  initialPhaseFromRestored as initialPhaseDirect,
} from '@/features/pause/application/use-cases/ritual/decide/restored-decide-ritual-state';
import { initialFrameDoneFromRestored as initialFrameDoneDirect } from '@/features/pause/application/use-cases/ritual/frame/restored-frame-ritual-state';
import {
  initialBriefIntegrateDoneFromRestored as initialBriefIntegrateDoneDirect,
  initialBriefPauseStepFromRestored as initialBriefPauseStepDirect,
  initialSelectedBriefFaceFromRestored as initialSelectedBriefFaceDirect,
} from '@/features/pause/application/use-cases/session/restored-brief-ritual-state';
import { initialRitualEntry as initialRitualEntryDirect } from '@/features/pause/application/use-cases/session/initial-ritual-entry';
import {
  initialBreathingFirstCompletedFromRestored as initialBreathFirstFromFlow,
  initialBreathingSecondCompletedFromRestored as initialBreathSecondFromFlow,
  initialBriefIntegrateDoneFromRestored as initialBriefIntegrateDoneFromFlow,
  initialBriefPauseStepFromRestored as initialBriefPauseStepFromFlow,
  initialDecisionFromRestored as initialDecisionFromFlow,
  initialFrameDoneFromRestored as initialFrameDoneFromFlow,
  initialPhaseFromRestored as initialPhaseFromFlow,
  initialRitualEntry as initialRitualEntryFromFlow,
  initialSelectedBriefFaceFromRestored as initialSelectedBriefFaceFromFlow,
  mapPersistedStep as mapPersistedStepFromFlow,
} from '@/features/pause/application/use-cases/session/pause-session-ritual-restore-flow';

import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialDecisionFromRestored,
  initialFrameDoneFromRestored,
  initialPhaseFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  mapPersistedStep,
} from './pause-session-ritual-restore-io';

describe('pause-session-ritual-restore-io re-exports', () => {
  it('re-exports ritual restore helpers with identity bindings to domain + ritual/session leaf modules', () => {
    expect(mapPersistedStep).toBe(mapPersistedStepDirect);
    expect(initialBreathingFirstCompletedFromRestored).toBe(initialBreathFirstDirect);
    expect(initialBreathingSecondCompletedFromRestored).toBe(initialBreathSecondDirect);
    expect(initialDecisionFromRestored).toBe(initialDecisionDirect);
    expect(initialPhaseFromRestored).toBe(initialPhaseDirect);
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneDirect);
    expect(initialBriefPauseStepFromRestored).toBe(initialBriefPauseStepDirect);
    expect(initialBriefIntegrateDoneFromRestored).toBe(initialBriefIntegrateDoneDirect);
    expect(initialSelectedBriefFaceFromRestored).toBe(initialSelectedBriefFaceDirect);
    expect(initialRitualEntry).toBe(initialRitualEntryDirect);
  });

  it('presentation I/O bindings match pause-session-ritual-restore-flow CI anchor (leaf parity)', () => {
    expect(mapPersistedStep).toBe(mapPersistedStepFromFlow);
    expect(initialBreathingFirstCompletedFromRestored).toBe(initialBreathFirstFromFlow);
    expect(initialBreathingSecondCompletedFromRestored).toBe(initialBreathSecondFromFlow);
    expect(initialDecisionFromRestored).toBe(initialDecisionFromFlow);
    expect(initialPhaseFromRestored).toBe(initialPhaseFromFlow);
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneFromFlow);
    expect(initialBriefPauseStepFromRestored).toBe(initialBriefPauseStepFromFlow);
    expect(initialBriefIntegrateDoneFromRestored).toBe(initialBriefIntegrateDoneFromFlow);
    expect(initialSelectedBriefFaceFromRestored).toBe(initialSelectedBriefFaceFromFlow);
    expect(initialRitualEntry).toBe(initialRitualEntryFromFlow);
  });
});
