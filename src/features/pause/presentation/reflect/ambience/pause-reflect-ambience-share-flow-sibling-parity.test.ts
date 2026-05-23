import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import * as ambienceFlow from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import {
  buildReflectionShareText,
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';
import * as shareFlow from '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow';

/**
 * Presentation mirror of application flow sibling parity (CI anchors only — production I/O
 * uses `pause-reflect-ambience-io` / `pause-reflect-share-io` leaf bindings).
 * Application source: `application/.../ambience/pause-reflect-ambience-share-flow-sibling-parity.test.ts`.
 * Share-anchored mirror: `application/.../share/pause-reflect-share-ambience-flow-sibling-parity.test.ts`.
 * Mood sibling: `pause-reflect-ambience-feel-flow-sibling-parity.test.ts` (application + presentation).
 * I/O sibling: `pause-reflect-ambience-share-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-ambience-flow ↔ pause-reflect-share-flow sibling parity (presentation)', () => {
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
  });

  it('share-flow exports stay off Web Audio frame-focus bed start/stop', () => {
    expect(runReflectionShareImage).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareText).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareTweetUrl).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectPostItOpen).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
