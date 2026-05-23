import { describe, expect, it } from 'vitest';
import {
  BRIEF_FIRST_BREATH_SEGMENT_LOG,
  BRIEF_PAUSE_STEP_AFTER_BREATH,
  BRIEF_PAUSE_STEP_AFTER_INTEGRATE,
  claimBriefIntegrateAdvance,
  DEEP_PAUSE_STEP_AFTER_FIRST_BREATH,
  DEEP_PAUSE_STEP_AFTER_SECOND_BREATH,
  shouldResetBriefIntegrateAdvanceGuard,
} from './pause-session-breath-step-navigation-io';

describe('pause-session-breath-step-navigation-io', () => {
  it('re-exports deep breath segment step targets from pause-breath-step-navigation', () => {
    expect(DEEP_PAUSE_STEP_AFTER_FIRST_BREATH).toBe('reflect');
    expect(DEEP_PAUSE_STEP_AFTER_SECOND_BREATH).toBe('decide');
  });

  it('re-exports brief breath segment step targets from pause-breath-step-navigation', () => {
    expect(BRIEF_FIRST_BREATH_SEGMENT_LOG).toEqual({ briefRitual: true });
    expect(BRIEF_PAUSE_STEP_AFTER_BREATH).toBe('integrate');
    expect(BRIEF_PAUSE_STEP_AFTER_INTEGRATE).toBe('decide');
  });

  it('re-exports brief integrate advance guard helpers', () => {
    expect(claimBriefIntegrateAdvance(false)).toEqual({ canAdvance: true, nextLocked: true });
    expect(claimBriefIntegrateAdvance(true)).toEqual({ canAdvance: false, nextLocked: true });
    expect(shouldResetBriefIntegrateAdvanceGuard('brief', 'integrate')).toBe(true);
    expect(shouldResetBriefIntegrateAdvanceGuard('brief', 'breathe')).toBe(false);
  });
});
