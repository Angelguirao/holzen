import { describe, expect, it } from 'vitest';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from './pause-reflect-hub-flow';
import {
  buildFeelTilesMoodLogOptions,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '../../feel/pause-feel-flow';
import * as hubFlow from './pause-reflect-hub-flow';
import * as moodFlow from '../../feel/pause-feel-flow';

/** Flow-level sibling parity; I/O mirrors: `pause-reflect-hub-feel-io-sibling-parity.test.ts` and `mood/pause-feel-hub-io-sibling-parity.test.ts`. */
describe('pause-reflect-hub-flow ↔ pause-feel-flow sibling parity', () => {
  it('hub-flow and mood-flow are distinct sibling CI anchors', () => {
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');

    expect('runInitialEmotionSelect' in hubFlow).toBe(false);
    expect('runInitialEmotionSkip' in hubFlow).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in hubFlow).toBe(false);
    expect('runShiftEmotionFrameHubDone' in moodFlow).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in moodFlow).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in moodFlow).toBe(false);
  });

  it('hub umbrella exports stay off mood RPC and feel-tile helpers', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runInitialEmotionSelect);
    expect(runShiftEmotionFrameHubDone).not.toBe(runInitialEmotionSkip);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(buildFeelTilesMoodLogOptions);
  });

  it('mood umbrella exports stay off shift-frame hub done RPC and log bundle', () => {
    expect(runInitialEmotionSelect).not.toBe(runShiftEmotionFrameHubDone);
    expect(runInitialEmotionSkip).not.toBe(runShiftEmotionFrameHubDone);
    expect(buildFeelTilesMoodLogOptions).not.toBe(buildShiftEmotionFrameHubLogBundle);
  });
});
