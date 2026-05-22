import { describe, expect, it } from 'vitest';

import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from './pause-reflect-hub-flow';
import {
  buildReflectionShareText,
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '../share/pause-reflect-share-flow';
import * as hubFlow from './pause-reflect-hub-flow';
import * as shareFlow from '../share/pause-reflect-share-flow';

/**
 * Application sibling parity: hub-flow vs share-flow (hub-anchored; complements
 * `share/pause-reflect-share-hub-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-hub-flow ↔ pause-reflect-share-flow sibling parity', () => {
  it('hub-flow and share-flow are distinct sibling CI anchors', () => {
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');

    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('runShiftEmotionFrameHubDone' in shareFlow).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in shareFlow).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in shareFlow).toBe(false);

    expect('runReflectionShareImage' in hubFlow).toBe(false);
    expect('buildReflectionShareText' in hubFlow).toBe(false);
    expect('trackPauseReflectShareTap' in hubFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in hubFlow).toBe(false);
  });

  it('hub umbrella exports stay off share image, channel builders, and session UI telemetry', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runReflectionShareImage);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(buildReflectionShareText);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(buildReflectionShareTelegramUrl);
    expect(runShiftEmotionFrameHubDone).not.toBe(trackPauseReflectPostItOpen);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(trackPauseReflectShareTap);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(trackPauseReflectWallpaperTap);
    expect(runShiftEmotionFrameHubDone).not.toBe(buildReflectionShareTweetUrl);
  });

  it('share umbrella exports stay off shift-frame hub done RPC and presentation mapping', () => {
    expect(runReflectionShareImage).not.toBe(runShiftEmotionFrameHubDone);
    expect(buildReflectionShareText).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(buildReflectionShareTelegramUrl).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(trackPauseReflectPostItOpen).not.toBe(runShiftEmotionFrameHubDone);
    expect(trackPauseReflectShareTap).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(runReflectionShareImage).not.toBe(buildShiftEmotionFrameHubLogBundle);
  });
});
