import { describe, expect, it } from 'vitest';

import {
  buildReflectionShareText,
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-share-flow';
import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone,
} from '../hub/pause-reflect-hub-flow';
import * as shareFlow from './pause-reflect-share-flow';
import * as hubFlow from '../hub/pause-reflect-hub-flow';

describe('pause-reflect-share-flow ↔ pause-reflect-hub-flow sibling parity', () => {
  it('share-flow and hub-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    expect(typeof runShiftEmotionFrameHubDone).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');

    expect('runReflectionShareImage' in hubFlow).toBe(false);
    expect('buildReflectionShareText' in hubFlow).toBe(false);
    expect('buildReflectionShareTelegramUrl' in hubFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in hubFlow).toBe(false);
    expect('runShiftEmotionFrameHubDone' in shareFlow).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in shareFlow).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in shareFlow).toBe(false);
  });

  it('share orchestration exports stay off shift-frame hub done RPC and log bundle', () => {
    expect(runReflectionShareImage).not.toBe(runShiftEmotionFrameHubDone);
    expect(runReflectionShareImage).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(buildReflectionShareText).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(buildReflectionShareTelegramUrl).not.toBe(runShiftEmotionFrameHubDone);
    expect(trackPauseReflectPostItOpen).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(trackPauseReflectShareTap).not.toBe(runShiftEmotionFrameHubDone);
    expect(trackPauseReflectWallpaperTap).not.toBe(resolveShiftFrameHubDonePresentation);
  });

  it('hub umbrella exports stay off share image, channel builders, and session UI telemetry', () => {
    expect(runShiftEmotionFrameHubDone).not.toBe(runReflectionShareImage);
    expect(runShiftEmotionFrameHubDone).not.toBe(trackPauseReflectPostItOpen);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(buildReflectionShareText);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(trackPauseReflectShareTap);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(buildReflectionShareTelegramUrl);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(trackPauseReflectWallpaperTap);
    expect(runShiftEmotionFrameHubDone).not.toBe(buildReflectionShareTweetUrl);
  });
});
