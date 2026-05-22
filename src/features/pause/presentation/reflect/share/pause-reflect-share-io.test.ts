import { describe, expect, it, vi } from 'vitest';
import {
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  pauseReflectionShareImage,
} from './pause-reflect-share-io';

const runReflectionShareImageMock = vi.hoisted(() => vi.fn());

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/share/pause-reflection-share-image-flow')
    >();
    return {
      ...actual,
      runReflectionShareImage: runReflectionShareImageMock,
    };
  },
);

describe('pause-reflect-share-io', () => {
  it('re-exports share text and channel URL builders from share subcluster flows', () => {
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
