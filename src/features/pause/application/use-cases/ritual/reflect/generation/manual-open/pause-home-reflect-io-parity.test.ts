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
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-reflect-generation-manual-open-flow';
import {
  buildManualPauseCreateOrReuseParams as buildCreateOrReuseFromHomeIo,
  buildManualPauseMarketContext as buildMarketFromHomeIo,
  buildManualPauseOpenParams as buildOpenParamsFromHomeIo,
  dismissOpenPauseHome as dismissFromHomeIo,
  openManualPauseFromHome as openFromHomeIo,
  runOpenManualPauseSilentModeAfterCreate as silentAfterCreateFromHomeIo,
  runPersistSilentReflectionStub as persistStubFromHomeIo,
} from '@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io';

describe('pause-home-reflect-io parity', () => {
  it('presentation I/O manual-open exports match manual-open-flow CI umbrella', () => {
    expect(openManualPauseFromHome).toBe(openFromHomeIo);
    expect(dismissOpenPauseHome).toBe(dismissFromHomeIo);
    expect(runPersistSilentReflectionStub).toBe(persistStubFromHomeIo);
    expect(runOpenManualPauseSilentModeAfterCreate).toBe(silentAfterCreateFromHomeIo);
    expect(buildManualPauseMarketContext).toBe(buildMarketFromHomeIo);
    expect(buildManualPauseOpenParams).toBe(buildOpenParamsFromHomeIo);
    expect(buildManualPauseCreateOrReuseParams).toBe(buildCreateOrReuseFromHomeIo);
  });
});
