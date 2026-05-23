import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-flow';
import * as ambienceFlow from './pause-reflect-ambience-flow';
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
import * as shareFlow from '../share/pause-reflect-share-flow';

/** Ambience-anchored sibling parity; share-anchored mirror: `share/pause-reflect-share-ambience-flow-sibling-parity.test.ts`. */
describe('pause-reflect-ambience-flow ↔ pause-reflect-share-flow sibling parity', () => {
  it('ambience-flow and share-flow are distinct sibling CI anchors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('runReflectionShareImage' in ambienceFlow).toBe(false);
    expect('buildReflectionShareText' in ambienceFlow).toBe(false);
    expect('buildReflectionShareTelegramUrl' in ambienceFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in ambienceFlow).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in shareFlow).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in shareFlow).toBe(false);
  });

  it('frame-focus ambience exports stay off share image, channel builders, and session UI telemetry', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectionShareImage);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareText);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(buildReflectionShareTelegramUrl);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectPostItOpen);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectShareTap);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectWallpaperTap);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('share-flow exports stay off Web Audio frame-focus bed start/stop', () => {
    expect(runReflectionShareImage).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareText).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTweetUrl).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectPostItOpen).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(runReflectionShareImage).not.toBe(buildReflectionShareText);
  });
});
