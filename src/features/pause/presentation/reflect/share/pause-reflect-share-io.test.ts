import { describe, expect, it, vi } from 'vitest';

import {
  buildReflectionShareTelegramUrl as buildTelegramDirect,
  buildReflectionShareTweetUrl as buildTweetDirect,
  buildReflectionShareWhatsAppUrl as buildWhatsAppDirect,
} from '@/features/pause/domain/reflect/share/reflection-share-channel-urls';
import { buildReflectionShareText as buildTextDirect } from '@/features/pause/domain/reflect/share/reflection-share-text';

import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';

const runReflectionShareImageMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/share/run-reflection-share-image')
    >();
    return {
      ...actual,
      runReflectionShareImage: runReflectionShareImageMock,
    };
  },
);

describe('pause-reflect-share-io', () => {
  it('re-exports share builders with identity bindings to domain leaf modules', () => {
    expect(buildReflectionShareText).toBe(buildTextDirect);
    expect(buildReflectionShareTweetUrl).toBe(buildTweetDirect);
    expect(buildReflectionShareTelegramUrl).toBe(buildTelegramDirect);
    expect(buildReflectionShareWhatsAppUrl).toBe(buildWhatsAppDirect);
  });

  it('re-exports share text and channel URL builders from domain', () => {
    const text = buildReflectionShareText('Stay calm.');
    expect(text).toContain('Stay calm.');
    expect(buildReflectionShareTweetUrl(text)).toContain('https://x.com/intent/tweet?text=');
  });

  it('delegates to runReflectionShareImage', async () => {
    runReflectionShareImageMock.mockResolvedValue('downloaded');

    await pauseReflectionShareImage('Stay calm.', 'ctx', 'haiku line');

    expect(runReflectionShareImageMock).toHaveBeenCalledWith(
      'Stay calm.',
      'ctx',
      'haiku line',
      undefined,
    );
  });
});
