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
import * as shareFlow from './pause-reflect-share-flow';
import {
  buildFeelTilesMoodLogOptions,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
  applyBriefDepthPickerRitualEntry,
  applyDeepDepthPickerRitualEntry,
} from '../mood/pause-reflect-mood-flow';
import * as moodFlow from '../mood/pause-reflect-mood-flow';

/** Share-anchored sibling parity; closes share-flow ↔ mood-flow application gap. */
describe('pause-reflect-share-flow ↔ pause-reflect-mood-flow sibling parity', () => {
  it('share-flow and mood-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof applyBriefDepthPickerRitualEntry).toBe('function');
    expect(typeof applyDeepDepthPickerRitualEntry).toBe('function');

    expect('runInitialEmotionSelect' in shareFlow).toBe(false);
    expect('runInitialEmotionSkip' in shareFlow).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in shareFlow).toBe(false);
    expect('applyBriefDepthPickerRitualEntry' in shareFlow).toBe(false);

    expect('runReflectionShareImage' in moodFlow).toBe(false);
    expect('buildReflectionShareText' in moodFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in moodFlow).toBe(false);
  });

  it('share orchestration exports stay off initial-emotion log and mood domain helpers', () => {
    expect(runReflectionShareImage).not.toBe(runInitialEmotionSelect);
    expect(runReflectionShareImage).not.toBe(runInitialEmotionSkip);
    expect(buildReflectionShareText).not.toBe(buildFeelTilesMoodLogOptions);
    expect(buildReflectionShareTelegramUrl).not.toBe(applyBriefDepthPickerRitualEntry);
    expect(buildReflectionShareTweetUrl).not.toBe(applyDeepDepthPickerRitualEntry);
    expect(trackPauseReflectPostItOpen).not.toBe(runInitialEmotionSelect);
    expect(trackPauseReflectShareTap).not.toBe(runInitialEmotionSkip);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildFeelTilesMoodLogOptions);
  });

  it('mood-flow exports stay off share image, channel builders, and session UI telemetry', () => {
    expect(runInitialEmotionSelect).not.toBe(runReflectionShareImage);
    expect(runInitialEmotionSkip).not.toBe(buildReflectionShareText);
    expect(buildFeelTilesMoodLogOptions).not.toBe(buildReflectionShareTelegramUrl);
    expect(applyBriefDepthPickerRitualEntry).not.toBe(trackPauseReflectPostItOpen);
    expect(applyDeepDepthPickerRitualEntry).not.toBe(trackPauseReflectShareTap);
    expect(runInitialEmotionSelect).not.toBe(trackPauseReflectWallpaperTap);
    expect(runInitialEmotionSkip).not.toBe(buildReflectionShareWhatsAppUrl);
  });
});
