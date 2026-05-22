import { describe, expect, it } from 'vitest';

import { buildShiftEmotionFrameHubLogBundle } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
import { resolveShiftFrameHubDonePresentation } from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';

import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromFlow,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromFlow,
  runShiftEmotionFrameHubDone,
} from './pause-reflect-hub-flow';
import { runShiftEmotionFrameHubDone as runShiftHubDoneDirect } from './run-shift-emotion-frame-hub-done';

describe('pause-reflect-hub-flow', () => {
  it('re-exports hub helpers from domain + leaf RPC use case', () => {
    expect(typeof buildLogBundleFromFlow).toBe('function');
    expect(typeof resolvePresentationFromFlow).toBe('function');
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');

    expect(buildLogBundleFromFlow).toBe(buildShiftEmotionFrameHubLogBundle);
    expect(resolvePresentationFromFlow).toBe(resolveShiftFrameHubDonePresentation);
    expect(runShiftEmotionFrameHubDone).toBe(runShiftHubDoneDirect);
  });

  it('builds a stable shift_emotion log bundle', () => {
    const first = buildShiftEmotionFrameHubLogBundle();
    const second = buildShiftEmotionFrameHubLogBundle();
    expect(first.logKey).toBe(second.logKey);
    expect(first.payload).toEqual(second.payload);
  });
});
