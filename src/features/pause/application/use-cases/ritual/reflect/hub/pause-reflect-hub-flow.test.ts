import { describe, expect, it } from 'vitest';

import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
import { resolveShiftFrameHubDonePresentation } from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';

import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromFlow,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromFlow,
  runShiftEmotionFrameHubDone,
} from './pause-reflect-hub-flow';
import { buildShiftEmotionFrameHubLogBundle as buildLogBundleFromLogFlow } from './pause-shift-emotion-log-flow';
import { runShiftEmotionFrameHubDone as runShiftHubDoneFromDoneFlow } from './pause-shift-emotion-frame-hub-done-flow';
import { resolveShiftFrameHubDonePresentation as resolvePresentationFromPresentationFlow } from './pause-shift-frame-hub-presentation-flow';
import { runShiftEmotionFrameHubDone as runShiftHubDoneDirect } from './run-shift-emotion-frame-hub-done';
import {
  buildFeelTilesMoodLogOptions as buildFeelTilesFromMoodFlow,
  runInitialEmotionSelect as runInitialEmotionSelectFromMoodFlow,
  runInitialEmotionSkip as runInitialEmotionSkipFromMoodFlow,
} from '../mood/pause-reflect-mood-flow';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from '../steps/pause-reflect-steps-flow';
import {
  dismissOpenPauseHome as dismissFromGenerationFlow,
  openManualPauseFromHome as openManualFromGenerationFlow,
  reflectGenerationPrerequisite as prerequisiteFromGenerationFlow,
  runReflectGeneration as runReflectGenerationFromGenerationFlow,
} from '../generation/pause-reflect-generation-flow';

describe('pause-reflect-hub-flow', () => {
  it('re-exports hub helpers from domain + leaf RPC use case', () => {
    expect(typeof buildLogBundleFromFlow).toBe('function');
    expect(typeof resolvePresentationFromFlow).toBe('function');
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');

    expect(buildLogBundleFromFlow).toBe(buildShiftEmotionFrameHubLogBundle);
    expect(resolvePresentationFromFlow).toBe(resolveShiftFrameHubDonePresentation);
    expect(runShiftEmotionFrameHubDone).toBe(runShiftHubDoneDirect);
  });

  it('umbrella bindings match hub subcluster CI anchors (domain leaf parity)', () => {
    expect(buildLogBundleFromFlow).toBe(buildLogBundleFromLogFlow);
    expect(resolvePresentationFromFlow).toBe(resolvePresentationFromPresentationFlow);
    expect(runShiftEmotionFrameHubDone).toBe(runShiftHubDoneFromDoneFlow);
  });

  it('builds a stable shift_emotion log bundle', () => {
    const first = buildShiftEmotionFrameHubLogBundle();
    const second = buildShiftEmotionFrameHubLogBundle();
    expect(first.logKey).toBe(second.logKey);
    expect(first.payload).toEqual(second.payload);
  });

  it('sibling cluster: mood-flow exports stay distinct from hub umbrella exports', () => {
    expect(buildLogBundleFromFlow).not.toBe(buildFeelTilesFromMoodFlow);
    expect(buildLogBundleFromFlow).not.toBe(runInitialEmotionSelectFromMoodFlow);
    expect(buildLogBundleFromFlow).not.toBe(runInitialEmotionSkipFromMoodFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(runInitialEmotionSelectFromMoodFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(runInitialEmotionSkipFromMoodFlow);
    expect(resolvePresentationFromFlow).not.toBe(buildFeelTilesFromMoodFlow);
  });

  it('sibling cluster: steps-flow exports stay distinct from hub umbrella exports', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runFavoriteFromStepsFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(runNoteFromStepsFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(runTagFromStepsFlow);
    expect(buildLogBundleFromFlow).not.toBe(runReflectionStepFromStepsFlow);
    expect(buildLogBundleFromFlow).not.toBe(shouldShowFavoriteFromStepsFlow);
    expect(resolvePresentationFromFlow).not.toBe(shouldLogFromStepsFlow);
  });

  it('sibling cluster: generation-flow exports stay distinct from hub umbrella exports', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(openManualFromGenerationFlow);
    expect(buildLogBundleFromFlow).not.toBe(dismissFromGenerationFlow);
    expect(buildLogBundleFromFlow).not.toBe(prerequisiteFromGenerationFlow);
    expect(resolvePresentationFromFlow).not.toBe(runReflectGenerationFromGenerationFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(prerequisiteFromGenerationFlow);
  });
});
