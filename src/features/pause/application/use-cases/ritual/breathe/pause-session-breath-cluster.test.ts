import { describe, expect, it } from 'vitest';

import {
  playPauseBreathPatternCompleteCue,
  playPauseBreathPhaseCue,
  resumePauseAudioContext,
} from './pause-ritual-audio-breathe-flow';
import {
  computeBreathingPhaseAdvance,
  initialBreathSegmentRpcLoggedFlagsFromRestored,
  initialBreathingFirstCompletedFromRestored,
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
} from './pause-session-breath-flow';
import {
  playPauseBreathPatternCompleteCue as patternCompleteDirect,
  playPauseBreathPhaseCue as phaseCueDirect,
  resumePauseAudioContext as resumeContextDirect,
} from './ritual-audio';
import { initialBreathSegmentRpcLoggedFlagsFromRestored as flagsDirect } from '@/features/pause/domain/ritual/breathe/initial-breath-segment-rpc-flags';
import {
  initialBreathingFirstCompletedFromRestored as firstCompletedDirect,
} from './restored-breath-ritual-state';
import { computeBreathingPhaseAdvance as computeAdvanceDirect } from './phase-advance';
import {
  runEnsureBreathSegment1Logged as runSegment1Direct,
  runEnsureBreathSegment2Logged as runSegment2Direct,
} from './run-breath-segment-log';

import * as cluster from './pause-session-breath-cluster';

describe('pause-session-breath-cluster', () => {
  it('exports no runtime bindings (application ritual/breathe session breath CI cluster marker)', () => {
    expect(Object.keys(cluster)).toEqual([]);
  });

  it('consolidated subcluster CI anchors re-export ritual/breathe leaf modules (leaf parity)', () => {
    expect(initialBreathingFirstCompletedFromRestored).toBe(firstCompletedDirect);
    expect(initialBreathSegmentRpcLoggedFlagsFromRestored).toBe(flagsDirect);
    expect(computeBreathingPhaseAdvance).toBe(computeAdvanceDirect);
    expect(runEnsureBreathSegment1Logged).toBe(runSegment1Direct);
    expect(runEnsureBreathSegment2Logged).toBe(runSegment2Direct);

    expect(playPauseBreathPhaseCue).toBe(phaseCueDirect);
    expect(playPauseBreathPatternCompleteCue).toBe(patternCompleteDirect);
    expect(resumePauseAudioContext).toBe(resumeContextDirect);
  });
});
