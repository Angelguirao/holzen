import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image',
  () => ({
    runReflectionShareImage: vi.fn(() => Promise.resolve('downloaded' as const)),
  }),
);

/**
 * Application sibling parity: share-flow CI umbrella vs presentation share-io wrappers.
 * Presentation mirror: `presentation/reflect/share/pause-reflect-share-flow-io-wrapper-sibling-parity.test.ts`.
 */
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  runReflectionShareImage,
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-share-flow';
import * as shareFlow from './pause-reflect-share-flow';
import {
  buildReflectionShareTelegramUrl as buildTelegramFromShareIo,
  buildReflectionShareText as buildTextFromShareIo,
  buildReflectionShareTweetUrl as buildTweetFromShareIo,
  buildReflectionShareWhatsAppUrl as buildWhatsAppFromShareIo,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

describe('pause-reflect-share-flow ↔ pause-reflect-share-io wrapper sibling parity', () => {
  it('share-flow CI umbrella and presentation share-io are distinct anchors', () => {
    expect(typeof runReflectionShareImage).toBe('function');
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect('pauseReflectionShareImage' in shareFlow).toBe(false);
    expect('runReflectionShareImage' in shareIo).toBe(false);
    expect('trackPauseReflectPostItOpen' in shareIo).toBe(false);
    expect('trackPauseReflectShareTap' in shareIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in shareIo).toBe(false);
  });

  it('share-flow and share-io share domain builder re-exports', () => {
    expect(buildReflectionShareText).toBe(buildTextFromShareIo);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramFromShareIo);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetFromShareIo);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppFromShareIo);
  });

  it('share-flow leaf exports stay off presentation port-bound wrappers', () => {
    expect(runReflectionShareImage).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectionShareImage);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectionShareImage);
    expect(buildReflectionShareText).not.toBe(pauseReflectionShareImage);
  });

  it('presentation share-io wrappers stay off share-flow leaf re-exports', () => {
    expect(pauseReflectionShareImage).not.toBe(runReflectionShareImage);
    expect(pauseReflectionShareImage).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectionShareImage).not.toBe(trackPauseReflectWallpaperTap);
    expect(buildTextFromShareIo).not.toBe(runReflectionShareImage);
  });
});
