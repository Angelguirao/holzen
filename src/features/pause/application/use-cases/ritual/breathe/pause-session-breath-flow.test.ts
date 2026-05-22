import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'breathFlowTestRepository' },
}));

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
} from '@/features/pause/domain/ritual/breathe/phase-advance';
import {
  initialBreathingFirstCompletedFromRestored as firstCompletedDirect,
  initialBreathingSecondCompletedFromRestored as secondCompletedDirect,
} from '@/features/pause/domain/ritual/breathe/restored-breath-ritual-state';

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
} from './pause-session-breath-flow';
import { computeBreathingPhaseAdvance as computeAdvanceFromPhaseAdvance } from './phase-advance';
import {
  initialBreathingFirstCompletedFromRestored as firstCompletedFromRestoredModule,
  initialBreathingSecondCompletedFromRestored as secondCompletedFromRestoredModule,
} from './restored-breath-ritual-state';
import {
  runEnsureBreathSegment1Logged as runSegment1Direct,
  runEnsureBreathSegment2Logged as runSegment2Direct,
  runLogBreathSegment1Skipped as runSegment1SkippedDirect,
  runLogBreathSegment2Skipped as runSegment2SkippedDirect,
} from './run-breath-segment-log';
import {
  computeBreathingPhaseAdvance as computeAdvanceFromIo,
  initialBreathSegmentRpcLoggedFlagsFromRestored as flagsFromIo,
  initialBreathingFirstCompletedFromRestored as firstCompletedFromIo,
  initialBreathingSecondCompletedFromRestored as secondCompletedFromIo,
  resolveBreathingCompleted as resolveCompletedFromIo,
  resolveBreathingPhaseAdvanceOutcome as resolveOutcomeFromIo,
} from '@/features/pause/presentation/session/breath/pause-session-breath-io';

describe('pause-session-breath-flow', () => {
  it('re-exports restored breath hydration helpers', () => {
    expect(initialBreathingFirstCompletedFromRestored(null)).toBe(false);
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedDirect);
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedFromRestoredModule);
    expect(initialBreathingSecondCompletedFromRestored).toBe(secondCompletedDirect);
    expect(initialBreathingSecondCompletedFromRestored).toBe(secondCompletedFromRestoredModule);
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(null)).toEqual({
      segment1Logged: false,
      segment2Logged: false,
    });
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored).toBe(flagsDirect);
  });

  it('re-exports phase advance helpers from ritual/breathe siblings', () => {
    expect(typeof computeBreathingPhaseAdvance).toBe('function');
    expect(typeof resolveBreathingCompleted).toBe('function');
    expect(typeof resolveBreathingPhaseAdvanceOutcome).toBe('function');

    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceDirect);
    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceFromPhaseAdvance);
    expect(resolveBreathingCompleted).toBe(resolveCompletedDirect);
    expect(resolveBreathingPhaseAdvanceOutcome).toBe(resolveOutcomeDirect);
  });

  it('re-exports breath step navigation constants and guards from domain', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstBreathDirect);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateDirect);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstSegmentDirect);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateGuardDirect);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateAdvanceDirect);
  });

  it('re-exports segment log helpers from run-breath-segment-log sibling', () => {
    expect(typeof runEnsureBreathSegment1Logged).toBe('function');
    expect(typeof runEnsureBreathSegment2Logged).toBe('function');
    expect(typeof runLogBreathSegment1Skipped).toBe('function');
    expect(typeof runLogBreathSegment2Skipped).toBe('function');

    expect(runEnsureBreathSegment1Logged).toBe(runSegment1Direct);
    expect(runEnsureBreathSegment2Logged).toBe(runSegment2Direct);
    expect(runLogBreathSegment1Skipped).toBe(runSegment1SkippedDirect);
    expect(runLogBreathSegment2Skipped).toBe(runSegment2SkippedDirect);
  });

  it('umbrella bindings match ritual/breathe subcluster CI anchors (leaf parity)', () => {
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedFromRestoredModule);
    expect(initialBreathingSecondCompletedFromRestored).toBe(secondCompletedFromRestoredModule);
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored).toBe(flagsDirect);
    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceFromPhaseAdvance);
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

  it('presentation breath I/O overlaps match breath-flow umbrella (leaf parity)', () => {
    expect(firstCompletedFromIo).toBe(initialBreathingFirstCompletedFromRestored);
    expect(secondCompletedFromIo).toBe(initialBreathingSecondCompletedFromRestored);
    expect(flagsFromIo).toBe(initialBreathSegmentRpcLoggedFlagsFromRestored);
    expect(computeAdvanceFromIo).toBe(computeBreathingPhaseAdvance);
    expect(resolveCompletedFromIo).toBe(resolveBreathingCompleted);
    expect(resolveOutcomeFromIo).toBe(resolveBreathingPhaseAdvanceOutcome);
  });
});
