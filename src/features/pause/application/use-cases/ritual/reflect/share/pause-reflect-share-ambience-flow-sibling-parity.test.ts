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
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '../ambience/pause-reflect-ambience-flow';
import * as ambienceFlow from '../ambience/pause-reflect-ambience-flow';

/** Share-anchored sibling parity; ambience-anchored mirror: `ambience/pause-reflect-ambience-share-flow-sibling-parity.test.ts`. */
describe('pause-reflect-share-flow ↔ pause-reflect-ambience-flow sibling parity', () => {
  it('share-flow and ambience-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect('startPauseReflectFrameFocusAmbience' in shareFlow).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in shareFlow).toBe(false);

    expect('runReflectionShareImage' in ambienceFlow).toBe(false);
    expect('buildReflectionShareText' in ambienceFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in ambienceFlow).toBe(false);
  });

  it('share orchestration exports stay off frame-focus ambience bed start/stop', () => {
    expect(runReflectionShareImage).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareText).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTelegramUrl).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectPostItOpen).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTweetUrl).not.toBe(buildReflectionShareWhatsAppUrl);
  });

  it('ambience-flow exports stay off share image, channel builders, and session UI telemetry', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectionShareImage);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareText);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareTweetUrl);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectShareTap);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectWallpaperTap);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareTelegramUrl);
  });
});
