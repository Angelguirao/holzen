import { describe, expect, it } from 'vitest';

import {
  computeBreathingPhaseAdvance,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
  initialBreathingFirstCompletedFromRestored,
  runEnsureBreathSegment1Logged,
} from './pause-session-breath-flow';
import { initialBreathSegmentRpcLoggedFlagsFromRestored as flagsDirect } from '@/features/pause/domain/ritual/breathe/initial-breath-segment-rpc-flags';
import { initialBreathingFirstCompletedFromRestored as firstCompletedDirect } from './restored-breath-ritual-state';
import { computeBreathingPhaseAdvance as computeAdvanceDirect } from './phase-advance';
import { runEnsureBreathSegment1Logged as runSegment1Direct } from './run-breath-segment-log';

describe('pause-session-breath-flow', () => {
  it('re-exports restored breath hydration helpers', () => {
    expect(initialBreathingFirstCompletedFromRestored(null)).toBe(false);
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedDirect);
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored(null)).toEqual({
      segment1Logged: false,
      segment2Logged: false,
    });
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored).toBe(flagsDirect);
  });

  it('re-exports phase advance and segment log helpers from ritual/breathe siblings', () => {
    expect(typeof computeBreathingPhaseAdvance).toBe('function');
    expect(typeof runEnsureBreathSegment1Logged).toBe('function');
    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceDirect);
    expect(runEnsureBreathSegment1Logged).toBe(runSegment1Direct);
  });
});
