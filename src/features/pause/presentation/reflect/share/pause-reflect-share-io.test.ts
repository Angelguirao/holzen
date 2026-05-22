import { describe, expect, it, vi } from 'vitest';

import { pauseReflectionShareImage } from './pause-reflect-share-io';

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
