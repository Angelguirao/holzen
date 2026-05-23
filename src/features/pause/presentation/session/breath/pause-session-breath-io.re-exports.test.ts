import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'breathIoRepository' },
}));

import { applyBreathSegmentLogOutcome as applyOutcomeDirect } from '@/features/pause/domain/ritual/breathe/apply-breath-segment-log-outcome';
import {
  resolvePauseBreathSecondLabelVariant as resolveSecondLabelDirect,
  viteWantsPauseBreathSecondLabelShift as viteWantsShiftDirect,
} from '@/features/pause/domain/ritual/breathe/breath-second-label-variant';
import { initialBreathSegmentRpcLoggedFlagsFromRestored as flagsDirect } from '@/features/pause/domain/ritual/breathe/initial-breath-segment-rpc-flags';
import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG as briefFirstSegmentDirect,
  BRIEF_PAUSE_STEP_AFTER_BREATH as briefAfterBreathDirect,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE as briefAfterIntegrateDirect,
  claimBriefIntegrateAdvance as claimIntegrateAdvanceDirect,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH as deepAfterFirstBreathDirect,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH as deepAfterSecondBreathDirect,
  shouldResetBriefIntegrateAdvanceGuard as shouldResetIntegrateGuardDirect,
} from '@/features/pause/domain/ritual/breathe/pause-breath-step-navigation';
import {
  computeBreathingPhaseAdvance as computeAdvanceDirect,
  resolveBreathingCompleted as resolveCompletedDirect,
  resolveBreathingPhaseAdvanceOutcome as resolveOutcomeDirect,
} from '@/features/pause/application/use-cases/ritual/breathe/phase-advance';
import {
  playPauseBreathPatternCompleteCue as patternCompleteDirect,
  playPauseBreathPhaseCue as phaseCueDirect,
  resumePauseAudioContext as resumeContextDirect,
} from '@/features/pause/application/use-cases/ritual/breathe/ritual-audio';
import {
  initialBreathingFirstCompletedFromRestored as firstCompletedDirect,
  initialBreathingSecondCompletedFromRestored as secondCompletedDirect,
} from '@/features/pause/application/use-cases/ritual/breathe/restored-breath-ritual-state';

import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG as briefFirstFromStepNavIo,
  claimBriefIntegrateAdvance as claimIntegrateFromStepNavIo,
} from './pause-session-breath-step-navigation-io';

import {
  applyBreathSegmentLogOutcome,
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  computeBreathingPhaseAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
  resolvePauseBreathSecondLabelVariant,
  resumePauseAudioContext,
  shouldResetBriefIntegrateAdvanceGuard,
  viteWantsPauseBreathSecondLabelShift,
} from './pause-session-breath-io';

describe('pause-session-breath-io re-exports', () => {
  it('re-exports breath hydration, phase advance, and segment flags from ritual/breathe leaf modules', () => {
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedDirect);
    expect(initialBreathingSecondCompletedFromRestored).toBe(secondCompletedDirect);
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored).toBe(flagsDirect);
    expect(applyBreathSegmentLogOutcome).toBe(applyOutcomeDirect);
    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceDirect);
    expect(resolveBreathingCompleted).toBe(resolveCompletedDirect);
    expect(resolveBreathingPhaseAdvanceOutcome).toBe(resolveOutcomeDirect);
  });

  it('re-exports step navigation via breath-step-navigation-io sibling (not pause-session-breath-flow)', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstBreathDirect);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateDirect);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstSegmentDirect);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstFromStepNavIo);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateGuardDirect);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateAdvanceDirect);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateFromStepNavIo);
  });

  it('re-exports ritual-audio cues and second-label helpers from leaf modules (not audio-flow umbrella)', () => {
    expect(playPauseBreathPhaseCue).toBe(phaseCueDirect);
    expect(playPauseBreathPatternCompleteCue).toBe(patternCompleteDirect);
    expect(resumePauseAudioContext).toBe(resumeContextDirect);
    expect(resolvePauseBreathSecondLabelVariant).toBe(resolveSecondLabelDirect);
    expect(viteWantsPauseBreathSecondLabelShift).toBe(viteWantsShiftDirect);
  });

});
