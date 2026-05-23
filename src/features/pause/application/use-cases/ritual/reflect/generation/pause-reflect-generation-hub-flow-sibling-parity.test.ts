import { describe, expect, it } from 'vitest';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from '../hub/pause-reflect-hub-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  runReflectGeneration,
} from './pause-reflect-generation-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as hubFlow from '../hub/pause-reflect-hub-flow';

describe('pause-reflect-generation-flow ↔ pause-reflect-hub-flow sibling parity', () => {
  it('generation-flow and hub-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');

    expect('runShiftEmotionFrameHubDone' in generationFlow).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in generationFlow).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in generationFlow).toBe(false);
    expect('runReflectGeneration' in hubFlow).toBe(false);
    expect('openManualPauseFromHome' in hubFlow).toBe(false);
    expect('dismissOpenPauseHome' in hubFlow).toBe(false);
    expect('reflectGenerationPrerequisite' in hubFlow).toBe(false);
  });

  it('generation umbrella exports stay off shift-frame hub done RPC and log bundle', () => {
    expect(runReflectGeneration).not.toBe(runShiftEmotionFrameHubDone);
    expect(openManualPauseFromHome).not.toBe(runShiftEmotionFrameHubDone);
    expect(dismissOpenPauseHome).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(reflectGenerationPrerequisite).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(runReflectGeneration).not.toBe(buildShiftEmotionFrameHubLogBundle);
  });

  it('hub umbrella exports stay off holzen-reflect generation and manual-open', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runReflectGeneration);
    expect(runShiftEmotionFrameHubDone).not.toBe(openManualPauseFromHome);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(dismissOpenPauseHome);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(reflectGenerationPrerequisite);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(runReflectGeneration);
  });
});
