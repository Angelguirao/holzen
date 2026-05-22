import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'breathIoRepository' },
}));

import { applyBreathSegmentLogOutcome as applyOutcomeDirect } from '@/features/pause/domain/ritual/breathe/apply-breath-segment-log-outcome';
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
  initialBreathingFirstCompletedFromRestored as firstCompletedDirect,
  initialBreathingSecondCompletedFromRestored as secondCompletedDirect,
} from '@/features/pause/application/use-cases/ritual/breathe/restored-breath-ritual-state';
import {
  runEnsureBreathSegment1Logged as runSegment1Direct,
  runEnsureBreathSegment2Logged as runSegment2Direct,
  runLogBreathSegment1Skipped as runSegment1SkippedDirect,
  runLogBreathSegment2Skipped as runSegment2SkippedDirect,
} from '@/features/pause/application/use-cases/ritual/breathe/run-breath-segment-log';
import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  computeBreathingPhaseAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
  initialBreathingFirstCompletedFromRestored,
  initialBreathingSecondCompletedFromRestored,
  resolveBreathingCompleted,
  resolveBreathingPhaseAdvanceOutcome,
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  shouldResetBriefIntegrateAdvanceGuard,
} from '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow';
import {
  applyBreathSegmentLogOutcome as applyOutcomeFromBreathIo,
  BRIEF_FIRST_BREATH_SEGMENT_LOG as briefFirstFromBreathIo,
  BRIEF_PAUSE_STEP_AFTER_BREATH as briefAfterBreathFromBreathIo,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE as briefAfterIntegrateFromBreathIo,
  claimBriefIntegrateAdvance as claimIntegrateFromBreathIo,
  computeBreathingPhaseAdvance as computeAdvanceFromBreathIo,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH as deepAfterFirstFromBreathIo,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH as deepAfterSecondFromBreathIo,
  initialBreathSegmentRpcLoggedFlagsFromRestored as flagsFromBreathIo,
  initialBreathingFirstCompletedFromRestored as firstCompletedFromBreathIo,
  initialBreathingSecondCompletedFromRestored as secondCompletedFromBreathIo,
  resolveBreathingCompleted as resolveCompletedFromBreathIo,
  resolveBreathingPhaseAdvanceOutcome as resolveOutcomeFromBreathIo,
  shouldResetBriefIntegrateAdvanceGuard as shouldResetIntegrateFromBreathIo,
} from '@/features/pause/presentation/session/breath/pause-session-breath-io';

describe('pause-session-breath-io parity', () => {
  it('presentation I/O breath exports match session-breath-flow CI umbrella', () => {
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedFromBreathIo);
    expect(initialBreathingSecondCompletedFromRestored).toBe(secondCompletedFromBreathIo);
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored).toBe(flagsFromBreathIo);
    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceFromBreathIo);
    expect(resolveBreathingCompleted).toBe(resolveCompletedFromBreathIo);
    expect(resolveBreathingPhaseAdvanceOutcome).toBe(resolveOutcomeFromBreathIo);
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstFromBreathIo);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondFromBreathIo);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathFromBreathIo);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateFromBreathIo);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstFromBreathIo);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateFromBreathIo);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateFromBreathIo);
    expect(applyOutcomeFromBreathIo).toBe(applyOutcomeDirect);
  });

  it('session-breath-flow CI umbrella composes the same leaf modules as presentation I/O', () => {
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedDirect);
    expect(initialBreathingSecondCompletedFromRestored).toBe(secondCompletedDirect);
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored).toBe(flagsDirect);
    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceDirect);
    expect(resolveBreathingCompleted).toBe(resolveCompletedDirect);
    expect(resolveBreathingPhaseAdvanceOutcome).toBe(resolveOutcomeDirect);
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstBreathDirect);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateDirect);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstSegmentDirect);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateGuardDirect);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateAdvanceDirect);
    expect(runEnsureBreathSegment1Logged).toBe(runSegment1Direct);
    expect(runEnsureBreathSegment2Logged).toBe(runSegment2Direct);
    expect(runLogBreathSegment1Skipped).toBe(runSegment1SkippedDirect);
    expect(runLogBreathSegment2Skipped).toBe(runSegment2SkippedDirect);
  });
});
