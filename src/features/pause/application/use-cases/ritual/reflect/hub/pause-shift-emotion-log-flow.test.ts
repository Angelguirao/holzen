import { describe, expect, it } from 'vitest';

import { buildShiftEmotionFrameHubLogBundle } from './pause-shift-emotion-log-flow';

describe('pause-shift-emotion-log-flow', () => {
  it('re-exports shift_emotion log bundle from domain shift-emotion-log', () => {
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
  });

  it('builds a stable shift_emotion log bundle', () => {
    const first = buildShiftEmotionFrameHubLogBundle();
    const second = buildShiftEmotionFrameHubLogBundle();
    expect(first.logKey).toBe(second.logKey);
    expect(first.payload).toEqual(second.payload);
  });
});
