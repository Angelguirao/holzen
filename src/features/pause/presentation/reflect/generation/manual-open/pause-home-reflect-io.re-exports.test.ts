import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'pauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

import { dismissOpenPauseHome as dismissDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/dismiss-open-pause-home';
import { openManualPauseFromHome as openDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/open-manual-pause-from-home';
import { runOpenManualPauseSilentModeAfterCreate as silentAfterCreateDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-open-manual-pause-silent-mode-after-create';
import { runPersistSilentReflectionStub as persistStubDirect } from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/run-persist-silent-reflection-stub';
import { buildManualPauseCreateOrReuseParams as buildCreateOrReuseDirect } from '@/features/pause/domain/reflect/generation/build-manual-pause-create-or-reuse-params';
import { buildManualPauseMarketContext as buildMarketDirect } from '@/features/pause/domain/reflect/generation/build-manual-pause-market-context';
import { buildManualPauseOpenParams as buildOpenParamsDirect } from '@/features/pause/domain/reflect/generation/build-manual-pause-open-params';
import { supabasePauseRepository, supabaseReflectGenerator } from '@/features/pause/public-rpc';

import {
  buildManualPauseCreateOrReuseParams,
  buildManualPauseMarketContext,
  buildManualPauseOpenParams,
  dismissOpenPauseHome,
  openManualPauseFromHome,
  pauseHomeManualOpenPorts,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from './pause-home-reflect-io';

describe('pause-home-reflect-io re-exports', () => {
  it('re-exports manual-open use cases from generation/manual-open leaf modules', () => {
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');

    expect(openManualPauseFromHome).toBe(openDirect);
    expect(dismissOpenPauseHome).toBe(dismissDirect);
    expect(runPersistSilentReflectionStub).toBe(persistStubDirect);
    expect(runOpenManualPauseSilentModeAfterCreate).toBe(silentAfterCreateDirect);
  });

  it('re-exports manual-open domain builders from reflect/generation leaf modules', () => {
    expect(typeof buildManualPauseMarketContext).toBe('function');
    expect(typeof buildManualPauseOpenParams).toBe('function');
    expect(typeof buildManualPauseCreateOrReuseParams).toBe('function');

    expect(buildManualPauseMarketContext).toBe(buildMarketDirect);
    expect(buildManualPauseOpenParams).toBe(buildOpenParamsDirect);
    expect(buildManualPauseCreateOrReuseParams).toBe(buildCreateOrReuseDirect);
  });

  it('binds default pauseHomeManualOpenPorts to public-rpc adapters', () => {
    expect(pauseHomeManualOpenPorts.repository).toBe(supabasePauseRepository);
    expect(pauseHomeManualOpenPorts.reflect).toBe(supabaseReflectGenerator);
  });
});
