import { describe, expect, it } from 'vitest';

import { initialFrameDoneFromRestored as initialFrameDoneFromFrameIo } from '@/features/pause/presentation/session/pause-session-frame-io';
import * as frameIo from '@/features/pause/presentation/session/pause-session-frame-io';
import {
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBriefIntegrateDoneFromRestored,
  initialBriefPauseStepFromRestored,
  initialDecisionFromRestored,
  initialFrameDoneFromRestored as initialFrameDoneFromRestoreIo,
  initialPhaseFromRestored,
  initialRitualEntry,
  initialSelectedBriefFaceFromRestored,
  mapPersistedStep,
} from '@/features/pause/presentation/session/pause-session-ritual-restore-io';
import * as restoreIo from '@/features/pause/presentation/session/pause-session-ritual-restore-io';

/**
 * Application sibling parity: ritual-restore-io vs frame-io peel (parity with presentation
 * `pause-session-ritual-restore-frame-io-sibling-parity.test.ts` and shell↔scaffold sibling pins).
 * Reciprocal pins: `pause-session-frame-io-parity.test.ts` ↔ `pause-session-ritual-restore-io-parity.test.ts`.
 */
describe('pause-session-ritual-restore-io ↔ pause-session-frame-io sibling parity (application)', () => {
  it('frame-io shares initialFrameDoneFromRestored binding with ritual-restore-io', () => {
    expect(initialFrameDoneFromFrameIo).toBe(initialFrameDoneFromRestoreIo);
  });

  it('frame-io is a single-export peel; ritual-restore-io is the multi-beat cluster', () => {
    expect(typeof initialFrameDoneFromFrameIo).toBe('function');
    expect(typeof mapPersistedStep).toBe('function');
    expect(typeof initialBreathingFirstCompletedFromRestored).toBe('function');
    expect(typeof initialRitualEntry).toBe('function');

    expect('mapPersistedStep' in frameIo).toBe(false);
    expect('initialBreathingFirstCompletedFromRestored' in frameIo).toBe(false);
    expect('initialBreathingSecondCompletedFromRestored' in frameIo).toBe(false);
    expect('initialDecisionFromRestored' in frameIo).toBe(false);
    expect('initialPhaseFromRestored' in frameIo).toBe(false);
    expect('initialBriefPauseStepFromRestored' in frameIo).toBe(false);
    expect('initialBriefIntegrateDoneFromRestored' in frameIo).toBe(false);
    expect('initialSelectedBriefFaceFromRestored' in frameIo).toBe(false);
    expect('initialRitualEntry' in frameIo).toBe(false);

    expect('initialFrameDoneFromRestored' in restoreIo).toBe(true);
    expect('mapPersistedStep' in restoreIo).toBe(true);
  });

  it('ritual-restore-io exports stay distinct from the shared frame hydration helper', () => {
    expect(mapPersistedStep).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialBreathingFirstCompletedFromRestored).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialBreathingSecondCompletedFromRestored).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialDecisionFromRestored).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialPhaseFromRestored).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialBriefPauseStepFromRestored).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialBriefIntegrateDoneFromRestored).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialSelectedBriefFaceFromRestored).not.toBe(initialFrameDoneFromRestoreIo);
    expect(initialRitualEntry).not.toBe(initialFrameDoneFromRestoreIo);
  });
});
