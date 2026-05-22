import { describe, expect, it } from 'vitest';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from './pause-reflect-hub-flow';

describe('pause-reflect-hub-flow', () => {
  it('re-exports hub helpers from domain + leaf RPC use case', () => {
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
  });

  it('builds a stable shift_emotion log bundle', () => {
    const first = buildShiftEmotionFrameHubLogBundle();
    const second = buildShiftEmotionFrameHubLogBundle();
    expect(first.logKey).toBe(second.logKey);
    expect(first.payload).toEqual(second.payload);
  });
});
