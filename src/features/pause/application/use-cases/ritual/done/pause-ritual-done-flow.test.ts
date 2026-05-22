import { describe, expect, it } from 'vitest';

import { runPostPauseEmotionLogIfDirty as runEmotionLogFromLeafFlow } from './pause-post-pause-emotion-log-flow';

import {
  runPostPauseEmotionLogIfDirty as runPostPauseEmotionLogFromDoneFlow,
} from './pause-ritual-done-flow';

describe('pause-ritual-done-flow', () => {
  it('re-exports post-pause emotion log from pause-post-pause-emotion-log-flow leaf', () => {
    expect(typeof runPostPauseEmotionLogFromDoneFlow).toBe('function');
    expect(runPostPauseEmotionLogFromDoneFlow).toBe(runEmotionLogFromLeafFlow);
  });
});
