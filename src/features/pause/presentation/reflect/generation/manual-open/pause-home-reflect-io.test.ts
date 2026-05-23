import { describe, expect, it, vi } from 'vitest';

const dismissOpenPauseHomeMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'pauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home',
  () => ({
    dismissOpenPauseHome: dismissOpenPauseHomeMock,
  }),
);

import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  openManualPauseFromHome,
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
        coinId: 'bitcoin',
        currentPrice: 100000,
        price24hAgo: 98000,
        direction: 'up',
        currency: 'USD',
        changePercent: 2,
        cumulativeChangePercent: 3,
        fearGreed: { value: 25, label: 'Fear' },
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
        coinId: 'bitcoin',
        currentPrice: 100000,
        price24hAgo: 99000,
        direction: 'up',
        currency: 'USD',
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
    const repository = { dismiss: vi.fn() } as unknown as import('@/features/pause/ports/pause-repository').PauseRepository;
    await pauseDismissOpenPauseHomePreviewWithRepository(repository, {
      hasUser: false,
      clearPreview,
    });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(false, {
      clearPreview,
      repository,
    });
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io.test.ts` (manual-open vs holzen-reflect).
   * Dedicated sibling file: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io holzen-reflect exports stay distinct from home-reflect-io', () => {
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(openManualPauseFromHome).not.toBe(pauseReflectGeneration);
    expect(dismissOpenPauseHome).not.toBe(runReflectGeneration);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(pauseReflectGeneration);
    expect(pauseHomeManualOpenPorts).not.toBe(reflectGenerator);
    expect(runPersistSilentReflectionStub).not.toBe(runReflectGeneration);
    expect(runOpenManualPauseSilentModeAfterCreate).not.toBe(reflectGenerationPrerequisite);
    expect(openManualPauseFromHome).not.toBe(reflectGenerationPrerequisite);
    expect(dismissOpenPauseHome).not.toBe(shouldCommitReflectGeneration);
    expect(openManualPauseFromHome).not.toBe(reflectGenerator);
    expect(dismissOpenPauseHome).not.toBe(resolveReflectGenerationPrefetch);
    expect(pauseHomeManualOpenPorts.reflect).toBe(reflectGenerator);
    expect(pauseHomeManualOpenPorts.reflect).not.toBe(pauseReflectGeneration);
    expect(buildManualPauseOpenParams).not.toBe(shouldCommitReflectGeneration);
    expect(buildManualPauseMarketContext).not.toBe(messageFromReflectGenerationResult);
    expect(buildManualPauseCreateOrReuseParams).not.toBe(resolveReflectGenerationPrefetch);
    // Reciprocal inline pins: `pause-reflect-generation-io.test.ts`.
  });
});
