import { describe, expect, it, vi } from 'vitest';

const dismissOpenPauseHomeMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'pauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/pause-reflect-generation-manual-open-flow',
  () => ({
    dismissOpenPauseHome: dismissOpenPauseHomeMock,
  }),
);

import {
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
} from './pause-home-reflect-io';

describe('pause-home-reflect-io', () => {
  it('binds default manual-open ports from public-rpc adapters', () => {
    expect(pauseHomeManualOpenPorts.repository).toEqual({ port: 'pauseRepository' });
    expect(pauseHomeManualOpenPorts.reflect).toEqual({ port: 'reflectGenerator' });
  });

  it('routes preview dismiss through dismissOpenPauseHome with default repository', async () => {
    const clearPreview = vi.fn();
    await pauseDismissOpenPauseHomePreview({ hasUser: true, clearPreview });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(true, {
      clearPreview,
      repository: { port: 'pauseRepository' },
    });
  });

  it('routes preview dismiss test seam through dismissOpenPauseHome', async () => {
    const clearPreview = vi.fn();
    const repository = { dismiss: vi.fn() };
    await pauseDismissOpenPauseHomePreviewWithRepository(repository, {
      hasUser: false,
      clearPreview,
    });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(false, {
      clearPreview,
      repository,
    });
  });
});
