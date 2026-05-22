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
} from '../share/pause-reflect-share-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
} from './pause-reflect-generation-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as shareFlow from '../share/pause-reflect-share-flow';

describe('pause-reflect-generation-flow ↔ pause-reflect-share-flow sibling parity', () => {
  it('generation-flow and share-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');

    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');

    expect('runReflectionShareImage' in generationFlow).toBe(false);
    expect('buildReflectionShareText' in generationFlow).toBe(false);
    expect('trackPauseReflectShareTap' in generationFlow).toBe(false);
    expect('runReflectGeneration' in shareFlow).toBe(false);
    expect('openManualPauseFromHome' in shareFlow).toBe(false);
    expect('dismissOpenPauseHome' in shareFlow).toBe(false);
    expect('resolveReflectGenerationPrefetch' in shareFlow).toBe(false);
  });

  it('generation umbrella exports stay off reflection share image/text/channel helpers', () => {
    expect(runReflectGeneration).not.toBe(runReflectionShareImage);
    expect(resolveReflectGenerationPrefetch).not.toBe(buildReflectionShareText);
    expect(openManualPauseFromHome).not.toBe(buildReflectionShareTelegramUrl);
    expect(dismissOpenPauseHome).not.toBe(buildReflectionShareTweetUrl);
    expect(runReflectGeneration).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(openManualPauseFromHome).not.toBe(trackPauseReflectShareTap);
    expect(dismissOpenPauseHome).not.toBe(trackPauseReflectWallpaperTap);
    expect(resolveReflectGenerationPrefetch).not.toBe(trackPauseReflectPostItOpen);
  });

  it('share umbrella exports stay off holzen-reflect generation and manual-open leaf use cases', () => {
    expect(runReflectionShareImage).not.toBe(runReflectGeneration);
    expect(buildReflectionShareText).not.toBe(runReflectGeneration);
    expect(buildReflectionShareTelegramUrl).not.toBe(openManualPauseFromHome);
    expect(buildReflectionShareTweetUrl).not.toBe(dismissOpenPauseHome);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(resolveReflectGenerationPrefetch);
    expect(trackPauseReflectShareTap).not.toBe(runReflectGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(openManualPauseFromHome);
    expect(trackPauseReflectPostItOpen).not.toBe(dismissOpenPauseHome);
  });
});
