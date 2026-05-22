/**
 * Presentation I/O parity for Home manual-open reflect cluster (colocated beside
 * `pause-home-reflect-io.ts`; application `pause-reflect-generation-manual-open-flow` stays CI umbrella).
 * Application mirror: `application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
 * Sibling parity: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'pauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home',
  () => ({
    dismissOpenPauseHome: vi.fn(() => Promise.resolve()),
  }),
);

import { dismissOpenPauseHome as dismissDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home';
import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityFromManualOpenFlow,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow';
import { applyManualPauseOpenResult as applyOpenResultDirect } from './apply-manual-pause-open-result';
import {
  applyManualPauseOpenResult,
  applyManualPauseOpenResult as applyOpenResultFromHomeIo,
  buildManualPauseCreateOrReuseParams as buildCreateOrReuseFromHomeIo,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE,
  buildManualPauseMarketContext as buildMarketFromHomeIo,
  buildManualPauseOpenParams as buildOpenParamsFromHomeIo,
  dismissOpenPauseHome as dismissFromHomeIo,
  MANUAL_PAUSE_VOLATILITY_TEMPLATE as volatilityFromHomeIo,
  openManualPauseFromHome as openFromHomeIo,
  pauseDismissOpenPauseHomePreview,
  pauseDismissOpenPauseHomePreviewWithRepository,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate as silentAfterCreateFromHomeIo,
  runPersistSilentReflectionStub as persistStubFromHomeIo,
} from './pause-home-reflect-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

import { supabasePauseRepository, supabaseReflectGenerator } from '@/features/pause/public-rpc';

describe('pause-home-reflect-io parity', () => {
  it('presentation I/O manual-open exports match manual-open-flow CI umbrella', () => {
    expect(openManualPauseFromHome).toBe(openFromHomeIo);
    expect(dismissOpenPauseHome).toBe(dismissFromHomeIo);
    expect(runPersistSilentReflectionStub).toBe(persistStubFromHomeIo);
    expect(runOpenManualPauseSilentModeAfterCreate).toBe(silentAfterCreateFromHomeIo);
    expect(buildManualPauseMarketContext).toBe(buildMarketFromHomeIo);
    expect(buildManualPauseOpenParams).toBe(buildOpenParamsFromHomeIo);
    expect(buildManualPauseCreateOrReuseParams).toBe(buildCreateOrReuseFromHomeIo);
    expect(MANUAL_PAUSE_VOLATILITY_TEMPLATE).toBe(volatilityFromHomeIo);
    expect(MANUAL_PAUSE_VOLATILITY_TEMPLATE).toBe(volatilityFromManualOpenFlow);
    expect(applyManualPauseOpenResult).toBe(applyOpenResultFromHomeIo);
    expect(applyManualPauseOpenResult).toBe(applyOpenResultDirect);
  });

  it('presentation I/O binds pauseHomeManualOpenPorts to public-rpc adapters', () => {
    expect(pauseHomeManualOpenPorts.repository).toBe(supabasePauseRepository);
    expect(pauseHomeManualOpenPorts.reflect).toBe(supabaseReflectGenerator);
  });

  it('presentation I/O exports dismiss preview wrappers distinct from manual-open leaf', () => {
    expect(typeof pauseDismissOpenPauseHomePreview).toBe('function');
    expect(typeof pauseDismissOpenPauseHomePreviewWithRepository).toBe('function');
    expect(pauseDismissOpenPauseHomePreview).not.toBe(dismissDirect);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(dismissFromHomeIo);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(dismissDirect);
    expect(pauseDismissOpenPauseHomePreview).not.toBe(pauseDismissOpenPauseHomePreviewWithRepository);
  });

  it('pauseDismissOpenPauseHomePreview delegates to dismiss-open-pause-home with default repository', async () => {
    const clearPreview = vi.fn();

    await pauseDismissOpenPauseHomePreview({ hasUser: true, clearPreview });

    expect(dismissDirect).toHaveBeenCalledWith(true, {
      clearPreview,
      repository: pauseHomeManualOpenPorts.repository,
    });
  });

  it('pauseDismissOpenPauseHomePreviewWithRepository forwards injected PauseRepository', async () => {
    const clearPreview = vi.fn();
    const customRepo = { port: 'injected' } as unknown as typeof supabasePauseRepository;

    await pauseDismissOpenPauseHomePreviewWithRepository(customRepo, {
      hasUser: false,
      clearPreview,
    });

    expect(dismissDirect).toHaveBeenCalledWith(false, {
      clearPreview,
      repository: customRepo,
    });
  });

  it('home-reflect-io port-bound dismiss wrappers stay distinct from manual-open-flow leaf exports', () => {
    expect(pauseDismissOpenPauseHomePreview).not.toBe(dismissOpenPauseHome);
    expect(pauseDismissOpenPauseHomePreviewWithRepository).not.toBe(dismissOpenPauseHome);
    // Reciprocal inline pins: `pause-home-reflect-io.test.ts`;
    // sibling: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `application/.../manual-open/pause-home-reflect-io-parity.test.ts`.
   * Dedicated sibling file: `pause-reflect-generation-home-reflect-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: generation-io exports stay distinct from home-reflect-io', () => {
    expect(openFromHomeIo).not.toBe(runReflectGeneration);
    expect(dismissFromHomeIo).not.toBe(pauseReflectGeneration);
    expect(buildMarketFromHomeIo).not.toBe(reflectGenerationPrerequisite);
    expect(buildOpenParamsFromHomeIo).not.toBe(resolveReflectGenerationPrefetch);
    expect(buildCreateOrReuseFromHomeIo).not.toBe(messageFromReflectGenerationResult);
    expect(pauseHomeManualOpenPorts).not.toBe(reflectGenerator);
    expect(persistStubFromHomeIo).not.toBe(shouldCommitReflectGeneration);
  });
});
