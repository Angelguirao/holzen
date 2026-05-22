import { describe, expect, it } from 'vitest';

import { runPostPauseEmotionLogIfDirty as runEmotionLogDirect } from './post-pause-emotion-log';

import { runPostPauseEmotionLogIfDirty } from './pause-post-pause-emotion-log-flow';

describe('pause-post-pause-emotion-log-flow', () => {
  it('re-exports post-pause emotion log use case from post-pause-emotion-log leaf', () => {
    expect(typeof runPostPauseEmotionLogIfDirty).toBe('function');
    expect(runPostPauseEmotionLogIfDirty).toBe(runEmotionLogDirect);
  });
});
