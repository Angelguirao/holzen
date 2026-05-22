import { describe, expect, it } from 'vitest';

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
  BRIEF_FIRST_BREATH_SEGMENT_LOG as briefFirstFromBreathFlow,
  BRIEF_PAUSE_STEP_AFTER_BREATH as briefAfterBreathFromBreathFlow,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE as briefAfterIntegrateFromBreathFlow,
  claimBriefIntegrateAdvance as claimIntegrateFromBreathFlow,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH as deepAfterFirstFromBreathFlow,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH as deepAfterSecondFromBreathFlow,
  shouldResetBriefIntegrateAdvanceGuard as shouldResetIntegrateFromBreathFlow,
} from '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow';

import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from './pause-session-breath-step-navigation-io';

describe('pause-session-breath-step-navigation-io re-exports', () => {
  it('re-exports breath step navigation from domain pause-breath-step-navigation leaf', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstBreathDirect);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathDirect);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateDirect);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstSegmentDirect);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateGuardDirect);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateAdvanceDirect);
  });

  it('presentation I/O bindings match session-breath-flow navigation subset (leaf parity)', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstFromBreathFlow);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondFromBreathFlow);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathFromBreathFlow);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateFromBreathFlow);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstFromBreathFlow);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateFromBreathFlow);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateFromBreathFlow);
  });
});
