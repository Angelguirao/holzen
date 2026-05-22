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
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '../telemetry/pause-reflect-telemetry-flow';
import * as shareFlow from './pause-reflect-share-flow';
import * as telemetryFlow from '../telemetry/pause-reflect-telemetry-flow';

describe('pause-reflect-share-flow ↔ pause-reflect-telemetry-flow sibling parity', () => {
  it('share-flow and telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('trackPauseReflectPostItOpen' in shareFlow).toBe(true);
    expect('trackPauseReflectShareTap' in shareFlow).toBe(true);
    expect('trackPauseReflectWallpaperTap' in shareFlow).toBe(true);
    expect('runReflectionShareImage' in telemetryFlow).toBe(false);
    expect('buildReflectionShareText' in telemetryFlow).toBe(false);
    expect('buildReflectionShareTelegramUrl' in telemetryFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in telemetryFlow).toBe(true);
    expect('runReflectionShareImage' in shareFlow).toBe(true);
    expect('buildReflectionShareText' in shareFlow).toBe(true);
  });

  it('share orchestration exports stay off telemetry-only umbrella re-exports', () => {
    expect(runReflectionShareImage).not.toBe(trackPostItFromTelemetryFlow);
    expect(runReflectionShareImage).not.toBe(trackShareTapFromTelemetryFlow);
    expect(runReflectionShareImage).not.toBe(trackWallpaperFromTelemetryFlow);
    expect(buildReflectionShareText).not.toBe(trackPostItFromTelemetryFlow);
    expect(buildReflectionShareTelegramUrl).not.toBe(trackShareTapFromTelemetryFlow);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(trackWallpaperFromTelemetryFlow);
  });

  it('telemetry-flow session UI trackers stay off share image and channel builders', () => {
    expect(trackPostItFromTelemetryFlow).not.toBe(runReflectionShareImage);
    expect(trackShareTapFromTelemetryFlow).not.toBe(runReflectionShareImage);
    expect(trackWallpaperFromTelemetryFlow).not.toBe(buildReflectionShareText);
    expect(trackPostItFromTelemetryFlow).not.toBe(buildReflectionShareTelegramUrl);
    expect(trackShareTapFromTelemetryFlow).not.toBe(buildReflectionShareTweetUrl);
  });
});
