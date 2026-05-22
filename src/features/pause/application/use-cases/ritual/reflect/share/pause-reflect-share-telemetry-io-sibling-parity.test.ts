import { describe, expect, it } from 'vitest';

import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import * as telemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Application sibling parity: share-io vs telemetry-io (parity with presentation
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-share-telemetry-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-share-io-parity.test.ts` ↔
 * `presentation/reflect/telemetry/pause-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-share-io ↔ pause-reflect-telemetry-io sibling parity (application)', () => {
  it('share-io and telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');

    expect('trackPauseReflectPostItOpen' in shareIo).toBe(false);
    expect('trackPauseReflectShareTap' in shareIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in shareIo).toBe(false);
    expect('PauseReflectTelemetrySurface' in shareIo).toBe(false);

    expect('buildReflectionShareText' in telemetryIo).toBe(false);
    expect('pauseReflectionShareImage' in telemetryIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in telemetryIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in telemetryIo).toBe(false);
    expect('buildReflectionShareWhatsAppUrl' in telemetryIo).toBe(false);
  });

  it('share-io exports stay off session reflect UI PostHog trackers', () => {
    expect(pauseReflectionShareImage).not.toBe(trackPauseReflectPostItOpen);
    expect(buildReflectionShareText).not.toBe(trackPauseReflectShareTap);
    expect(buildReflectionShareTelegramUrl).not.toBe(trackPauseReflectWallpaperTap);
    expect(buildReflectionShareTweetUrl).not.toBe(trackPauseReflectPostItOpen);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectionShareImage).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('telemetry-io exports stay off reflection share builders and PNG orchestration', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectShareTap).not.toBe(buildReflectionShareText);
    expect(trackPauseReflectWallpaperTap).not.toBe(buildReflectionShareTelegramUrl);
    expect(trackPauseReflectPostItOpen).not.toBe(buildReflectionShareTweetUrl);
    expect(trackPauseReflectShareTap).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectionShareImage);
  });
});
