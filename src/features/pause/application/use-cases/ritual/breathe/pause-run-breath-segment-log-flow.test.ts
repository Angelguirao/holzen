import { describe, expect, it } from 'vitest';

import {
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
} from './pause-run-breath-segment-log-flow';
import {
  runEnsureBreathSegment1Logged as runSegment1Direct,
  runEnsureBreathSegment2Logged as runSegment2Direct,
  runLogBreathSegment1Skipped as runSegment1SkippedDirect,
  runLogBreathSegment2Skipped as runSegment2SkippedDirect,
} from './run-breath-segment-log';

describe('pause-run-breath-segment-log-flow', () => {
  it('re-exports breath segment log helpers from run-breath-segment-log sibling', () => {
    expect(typeof runEnsureBreathSegment1Logged).toBe('function');
    expect(typeof runEnsureBreathSegment2Logged).toBe('function');
    expect(typeof runLogBreathSegment1Skipped).toBe('function');
    expect(typeof runLogBreathSegment2Skipped).toBe('function');

    expect(runEnsureBreathSegment1Logged).toBe(runSegment1Direct);
    expect(runEnsureBreathSegment2Logged).toBe(runSegment2Direct);
    expect(runLogBreathSegment1Skipped).toBe(runSegment1SkippedDirect);
    expect(runLogBreathSegment2Skipped).toBe(runSegment2SkippedDirect);
  });
});
