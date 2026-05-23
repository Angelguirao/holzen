import { describe, expect, it } from 'vitest';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from '../hub/pause-reflect-hub-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as hubFlow from '../hub/pause-reflect-hub-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

describe('pause-reflect-steps-flow ↔ pause-reflect-hub-flow sibling parity', () => {
  it('steps-flow and hub-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');

    expect('runShiftEmotionFrameHubDone' in stepsFlow).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in stepsFlow).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in hubFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in hubFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in hubFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in hubFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in hubFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in hubFlow).toBe(false);
  });

  it('steps umbrella exports stay off shift-frame hub RPC and log bundle', () => {
    expect(runPauseFavoriteToggle).not.toBe(runShiftEmotionFrameHubDone);
    expect(runPauseReflectNoteUpdate).not.toBe(runShiftEmotionFrameHubDone);
    expect(runPauseReflectTagUpdate).not.toBe(runShiftEmotionFrameHubDone);
    expect(runPauseReflectionStepLogOnce).not.toBe(runShiftEmotionFrameHubDone);
    expect(shouldShowFavoriteProHint).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(shouldLogPauseReflectionStep).not.toBe(resolveShiftFrameHubDonePresentation);
  });

  it('hub umbrella exports stay off step mutations and domain step gates', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runPauseFavoriteToggle);
    expect(runShiftEmotionFrameHubDone).not.toBe(runPauseReflectNoteUpdate);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(runPauseReflectTagUpdate);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(shouldShowFavoriteProHint);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(shouldLogPauseReflectionStep);
  });
});
