import { describe, expect, it } from 'vitest';

import { buildReflectionShareText } from '@/features/pause/domain/reflect/share/reflection-share-text';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';

import {
  buildReflectionShareText as buildTextFromFlow,
  buildReflectionShareTelegramUrl as buildTelegramFromFlow,
  buildReflectionShareTweetUrl as buildTweetFromFlow,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromFlow,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-share-flow';
import { runReflectionShareImage as runShareImageDirect } from './run-reflection-share-image';
import {
  trackPauseReflectPostItOpen as trackPostItDirect,
  trackPauseReflectShareTap as trackShareTapDirect,
  trackPauseReflectWallpaperTap as trackWallpaperDirect,
} from '../telemetry/pause-reflect-session-ui-telemetry';
import {
  trackPauseReflectPostItOpen as trackPostItFromTelemetryFlow,
  trackPauseReflectShareTap as trackShareTapFromTelemetryFlow,
  trackPauseReflectWallpaperTap as trackWallpaperFromTelemetryFlow,
} from '../telemetry/pause-reflect-telemetry-flow';

describe('pause-reflect-share-flow', () => {
  it('re-exports share orchestration + domain builders + session UI telemetry from leaf modules', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildTextFromFlow).toBe('function');
    expect(typeof buildTelegramFromFlow).toBe('function');
    expect(typeof buildTweetFromFlow).toBe('function');
    expect(typeof buildWhatsAppFromFlow).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(runReflectionShareImage).toBe(runShareImageDirect);
    expect(buildTextFromFlow).toBe(buildReflectionShareText);
    expect(buildTelegramFromFlow).toBe(buildReflectionShareTelegramUrl);
    expect(buildTweetFromFlow).toBe(buildReflectionShareTweetUrl);
    expect(buildWhatsAppFromFlow).toBe(buildReflectionShareWhatsAppUrl);
    expect(trackPauseReflectPostItOpen).toBe(trackPostItDirect);
    expect(trackPauseReflectShareTap).toBe(trackShareTapDirect);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperDirect);
    expect(trackPauseReflectPostItOpen).toBe(trackPostItFromTelemetryFlow);
    expect(trackPauseReflectShareTap).toBe(trackShareTapFromTelemetryFlow);
    expect(trackPauseReflectWallpaperTap).toBe(trackWallpaperFromTelemetryFlow);
  });
});
