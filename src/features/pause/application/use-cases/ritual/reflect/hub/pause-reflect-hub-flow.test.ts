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
} from '../mood/pause-reflect-mood-flow';

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
    expect(buildLogBundleFromFlow).not.toBe(runInitialEmotionSelectFromMoodFlow);
    expect(buildLogBundleFromFlow).not.toBe(buildFeelTilesFromMoodFlow);
    expect(runShiftEmotionFrameHubDone).not.toBe(runInitialEmotionSelectFromMoodFlow);
    expect(resolvePresentationFromFlow).not.toBe(buildFeelTilesFromMoodFlow);
  });
});
