import { describe, expect, it } from 'vitest';
import {
  PAUSE_STEP_AFTER_FRAME_HUB_DONE,
  resolveShiftFrameHubDonePresentation,
} from './pause-shift-frame-hub-flow';

describe('pause-shift-frame-hub-flow', () => {
  it('exposes breath2 as the post-frame hub step', () => {
    expect(PAUSE_STEP_AFTER_FRAME_HUB_DONE).toBe('breath2');
  });

  it('resolves advance or sync_failed from shift frame hub outcome', () => {
    expect(resolveShiftFrameHubDonePresentation({ status: 'sync_failed' })).toEqual({
      kind: 'abort_sync_failed',
    });
    expect(
      resolveShiftFrameHubDonePresentation({
        status: 'advance',
        logKey: '{"from_frame_hub":true}',
      }),
    ).toEqual({
      kind: 'advance',
      logKey: '{"from_frame_hub":true}',
      nextStep: 'breath2',
    });
  });
});
