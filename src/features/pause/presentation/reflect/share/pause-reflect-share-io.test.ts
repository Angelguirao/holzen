import { describe, expect, it, vi } from 'vitest';
import {
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';

const runReflectionShareImageMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflect-share-flow',
  () => ({
    runReflectionShareImage: runReflectionShareImageMock,
    buildReflectionShareText: (message: string) => message,
    buildReflectionShareTweetUrl: (text: string) => `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
    buildReflectionShareTelegramUrl: () => 'https://t.me/share/url',
    buildReflectionShareWhatsAppUrl: () => 'https://wa.me/',
  }),
);

describe('pause-reflect-share-io', () => {
  it('re-exports share text and channel URL builders from pause-reflect-share-flow', () => {
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
