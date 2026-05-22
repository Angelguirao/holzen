import { describe, expect, it } from 'vitest';

import { runShiftEmotionFrameHubDone } from './pause-shift-emotion-frame-hub-done-flow';

describe('pause-shift-emotion-frame-hub-done-flow', () => {
  it('re-exports shift-frame hub done RPC from run-shift-emotion-frame-hub-done', () => {
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
  });
});
