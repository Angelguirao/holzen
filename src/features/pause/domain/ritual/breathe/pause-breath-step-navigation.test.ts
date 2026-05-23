import { describe, expect, it } from 'vitest';
import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from './pause-breath-step-navigation';

describe('pause-breath-step-navigation', () => {
  it('exposes deep and brief breath segment step targets', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe('reflect');
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe('decide');
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe('integrate');
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe('decide');
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toEqual({ briefRitual: true });
  });

  it('resets brief integrate advance guard when re-entering integrate', () => {
    expect(shouldResetBriefIntegrateAdvanceGuard('brief', 'integrate')).toBe(true);
    expect(shouldResetBriefIntegrateAdvanceGuard('brief', 'breath')).toBe(false);
    expect(shouldResetBriefIntegrateAdvanceGuard('deep', 'integrate')).toBe(false);
  });

  it('claims brief integrate advance only once per lock cycle', () => {
    expect(claimBriefIntegrateAdvance(false)).toEqual({ canAdvance: true, nextLocked: true });
    expect(claimBriefIntegrateAdvance(true)).toEqual({ canAdvance: false, nextLocked: true });
  });
});
