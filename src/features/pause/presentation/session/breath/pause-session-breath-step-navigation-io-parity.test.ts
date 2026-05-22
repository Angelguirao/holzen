/**
 * Presentation I/O parity (colocated beside `pause-session-breath-step-navigation-io.ts`).
 * Imports `pause-session-breath-flow` CI umbrella for `.toBe` identity pins only — production step-navigation I/O keeps domain leaf import.
 * Reciprocal inline pins ↔ `pause-session-breath-io-parity.test.ts` (step targets vs segment RPC / phase advance).
 */
import { describe, expect, it } from 'vitest';

import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from '@/features/pause/application/use-cases/ritual/breathe/pause-session-breath-flow';
import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG as briefFirstFromDomain,
  BRIEF_PAUSE_STEP_AFTER_BREATH as briefAfterBreathFromDomain,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE as briefAfterIntegrateFromDomain,
  claimBriefIntegrateAdvance as claimIntegrateFromDomain,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH as deepAfterFirstFromDomain,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH as deepAfterSecondFromDomain,
  shouldResetBriefIntegrateAdvanceGuard as shouldResetIntegrateFromDomain,
} from '@/features/pause/domain/ritual/breathe/pause-breath-step-navigation';
import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG as briefFirstFromStepNavIo,
  BRIEF_PAUSE_STEP_AFTER_BREATH as briefAfterBreathFromStepNavIo,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE as briefAfterIntegrateFromStepNavIo,
  claimBriefIntegrateAdvance as claimIntegrateFromStepNavIo,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH as deepAfterFirstFromStepNavIo,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH as deepAfterSecondFromStepNavIo,
  shouldResetBriefIntegrateAdvanceGuard as shouldResetIntegrateFromStepNavIo,
} from './pause-session-breath-step-navigation-io';

describe('pause-session-breath-step-navigation-io parity', () => {
  it('presentation I/O step-navigation exports match pause-session-breath-flow CI umbrella', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstFromStepNavIo);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondFromStepNavIo);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathFromStepNavIo);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateFromStepNavIo);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstFromStepNavIo);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateFromStepNavIo);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateFromStepNavIo);
  });

  it('session-breath-flow CI umbrella composes the same domain leaf as presentation step-navigation I/O', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe(deepAfterFirstFromDomain);
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe(deepAfterSecondFromDomain);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe(briefAfterBreathFromDomain);
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe(briefAfterIntegrateFromDomain);
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toBe(briefFirstFromDomain);
    expect(shouldResetBriefIntegrateAdvanceGuard).toBe(shouldResetIntegrateFromDomain);
    expect(claimBriefIntegrateAdvance).toBe(claimIntegrateFromDomain);
  });

  it('sibling cluster: step-navigation-io exports stay distinct from breath-io segment RPC / phase advance', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).not.toBe(briefFirstFromStepNavIo);
    expect(claimBriefIntegrateAdvance).not.toBe(shouldResetIntegrateFromStepNavIo);
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).not.toBe(BRIEF_FIRST_BREATH_SEGMENT_LOG);
    // Reciprocal inline pins: `pause-session-breath-io-parity.test.ts`.
  });
});
