/**
 * Application-layer I/O parity for Home manual-open reflect cluster (parity with
 * `pause-home-reflect-telemetry-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-home-reflect-io.ts`).
 * Imports `pause-reflect-generation-manual-open-flow` CI umbrella for `.toBe` identity pins only —
 * production home reflect I/O keeps manual-open leaf imports.
 * Presentation mirror: `presentation/reflect/generation/manual-open/pause-home-reflect-io-parity.test.ts`.
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
import { applyManualPauseOpenResult as applyOpenResultDirect } from '@/features/pause/presentation/reflect/generation/manual-open/apply-manual-pause-open-result';
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
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate as silentAfterCreateFromHomeIo,
  runPersistSilentReflectionStub as persistStubFromHomeIo,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';
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

describe('pause-home-reflect-io parity (application)', () => {
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

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts`.
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
    // Reciprocal inline pins: `presentation/reflect/generation/pause-reflect-generation-io-parity.test.ts`.
  });
});
