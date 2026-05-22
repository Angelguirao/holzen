import { describe, expect, it, vi } from 'vitest';

const dismissOpenPauseHomeMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'pauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow')
    >();
    return {
      ...actual,
      dismissOpenPauseHome: dismissOpenPauseHomeMock,
    };
  },
);

import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from './pause-home-reflect-io';

describe('pause-home-reflect-io', () => {
  it('re-exports manual-open market context for Home presentation conductors', () => {
    const market = buildManualPauseMarketContext(
      {
        changePercent: 2,
        cumulativeChangePercent: 3,
        fearGreed: { label: 'Fear' },
        onChain: null,
      },
      5,
      'bitcoin',
    );
    expect(market.assetId).toBe('bitcoin');
    expect(market.ctx.length).toBeGreaterThan(0);
    expect(market.silentMsg.length).toBeGreaterThan(0);
  });

  it('re-exports manual-open create-or-reuse builder for Home test seams', () => {
    expect(typeof buildManualPauseCreateOrReuseParams).toBe('function');
    expect(MANUAL_PAUSE_VOLATILITY_TEMPLATE).toBe('volatility_v1');
  });

  it('re-exports buildManualPauseOpenParams and default manual-open ports', () => {
    const params = buildManualPauseOpenParams({
      userId: 'u1',
      silentMode: false,
      data: {
        changePercent: 1,
        cumulativeChangePercent: 2,
        fearGreed: null,
        onChain: null,
      },
      cumulativeThreshold: 5,
      profileTrackedAssetId: 'bitcoin',
    });
    expect(params.userId).toBe('u1');
    expect(params.trackedAssetId).toBe('bitcoin');
    expect(pauseHomeManualOpenPorts.repository).toBeDefined();
    expect(pauseHomeManualOpenPorts.reflect).toBeDefined();
  });

  it('re-exports silent-mode reflect use cases for Home test seams', () => {
    expect(typeof runPersistSilentReflectionStub).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
  });

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
