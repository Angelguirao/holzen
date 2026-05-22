/**
 * Application-layer I/O parity for session ritual-restore cluster (parity with
 * `pause-session-breath-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-session-ritual-restore-io.ts`).
 * Imports `pause-session-ritual-restore-flow` CI umbrella for `.toBe` identity pins only —
 * production restore I/O keeps sibling subcluster leaf imports.
 * Sibling pins: `pause-session-ritual-restore-frame-io-sibling-parity.test.ts` ↔ `pause-session-frame-io-parity.test.ts`.
 */
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
} from '@/features/pause/application/use-cases/session/pause-session-ritual-restore-flow';
import {
  initialBreathingFirstCompletedFromRestored as initialBreathFirstFromRestoreIo,
  initialBreathingSecondCompletedFromRestored as initialBreathSecondFromRestoreIo,
  initialBriefIntegrateDoneFromRestored as initialBriefIntegrateDoneFromRestoreIo,
  initialBriefPauseStepFromRestored as initialBriefPauseStepFromRestoreIo,
  initialDecisionFromRestored as initialDecisionFromRestoreIo,
  initialFrameDoneFromRestored as initialFrameDoneFromRestoreIo,
  initialPhaseFromRestored as initialPhaseFromRestoreIo,
  initialRitualEntry as initialRitualEntryFromRestoreIo,
  initialSelectedBriefFaceFromRestored as initialSelectedBriefFaceFromRestoreIo,
  mapPersistedStep as mapPersistedStepFromRestoreIo,
} from '@/features/pause/presentation/session/pause-session-ritual-restore-io';

describe('pause-session-ritual-restore-io parity (application)', () => {
  it('presentation I/O ritual restore exports match session-ritual-restore-flow CI umbrella', () => {
    expect(mapPersistedStep).toBe(mapPersistedStepFromRestoreIo);
    expect(initialBreathingFirstCompletedFromRestored).toBe(initialBreathFirstFromRestoreIo);
    expect(initialBreathingSecondCompletedFromRestored).toBe(initialBreathSecondFromRestoreIo);
    expect(initialDecisionFromRestored).toBe(initialDecisionFromRestoreIo);
    expect(initialPhaseFromRestored).toBe(initialPhaseFromRestoreIo);
    expect(initialFrameDoneFromRestored).toBe(initialFrameDoneFromRestoreIo);
    expect(initialBriefPauseStepFromRestored).toBe(initialBriefPauseStepFromRestoreIo);
    expect(initialBriefIntegrateDoneFromRestored).toBe(initialBriefIntegrateDoneFromRestoreIo);
    expect(initialSelectedBriefFaceFromRestored).toBe(initialSelectedBriefFaceFromRestoreIo);
    expect(initialRitualEntry).toBe(initialRitualEntryFromRestoreIo);
  });

  it('session-ritual-restore-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
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
});
