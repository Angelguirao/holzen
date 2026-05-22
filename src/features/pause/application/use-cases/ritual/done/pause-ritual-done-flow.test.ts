import { describe, expect, it } from 'vitest';

import { runPostPauseEmotionLogIfDirty as runEmotionLogDirect } from './post-pause-emotion-log';
import { runPostPauseEmotionLogIfDirty as runEmotionLogFromLeafFlow } from './pause-post-pause-emotion-log-flow';
import {
  runPostPauseEmotionLogIfDirty as runPostPauseEmotionLogFromDoneFlow,
} from './pause-ritual-done-flow';

describe('pause-ritual-done-flow', () => {
  it('re-exports post-pause emotion log from pause-post-pause-emotion-log-flow leaf', () => {
    expect(typeof runPostPauseEmotionLogFromDoneFlow).toBe('function');
    expect(runPostPauseEmotionLogFromDoneFlow).toBe(runEmotionLogFromLeafFlow);
  });

  it('umbrella bindings match post-pause-emotion-log use case leaf (domain parity)', () => {
    expect(runPostPauseEmotionLogFromDoneFlow).toBe(runEmotionLogDirect);
    expect(runEmotionLogFromLeafFlow).toBe(runEmotionLogDirect);
  });
});
