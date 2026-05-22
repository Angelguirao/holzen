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
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate as silentAfterCreateFromHomeIo,
  runPersistSilentReflectionStub as persistStubFromHomeIo,
} from './pause-home-reflect-io';

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
});
