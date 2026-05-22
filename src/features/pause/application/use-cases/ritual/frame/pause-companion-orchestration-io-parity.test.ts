/**
 * Application-layer I/O parity for companion orchestration presentation I/O (parity with
 * `pause-reflect-pending-offer-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-companion-orchestration-io.ts`).
 * Imports `pause-companion-orchestration-flow` CI umbrella for `.toBe` identity pins only —
 * production orchestration I/O keeps ritual/frame leaf imports.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/persist-ui-step-completion',
  () => ({
    persistCompanionUiStepCompletion: vi.fn(() => Promise.resolve()),
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite',
  () => ({
    runToggleCompanionLibraryFavorite: vi.fn(() => Promise.resolve(true)),
  }),
);

import { persistCompanionUiStepCompletion as persistDirect } from '@/features/pause/application/use-cases/ritual/frame/persist-ui-step-completion';
import { runToggleCompanionLibraryFavorite as toggleFavoriteDirect } from '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite';
import {
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  persistCompanionUiStepCompletion,
  runToggleCompanionLibraryFavorite,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestration-flow';
import {
  companionOrchestrator,
  companionPauseRepository,
  loadCompanionOrchestrateSession as loadSessionFromOrchestrationIo,
  nextExpandedWithLazyFetch as nextExpandedFromOrchestrationIo,
  pauseCompanionUiStepCompletion,
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
} from '@/features/pause/presentation/companion/pause-companion-orchestration-io';
import {
  supabaseCompanionOrchestrator,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';

/**
 * Application mirror: `presentation/companion/pause-companion-orchestration-io-parity.test.ts`.
 */
describe('pause-companion-orchestration-io parity (application)', () => {
  it('presentation I/O orchestration exports match pause-companion-orchestration-flow CI umbrella', () => {
    expect(loadCompanionOrchestrateSession).toBe(loadSessionFromOrchestrationIo);
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedFromOrchestrationIo);
  });

  it('orchestration-flow composes persist + favorite leaf modules (presentation I/O uses wrappers)', () => {
    expect(persistCompanionUiStepCompletion).toBe(persistDirect);
    expect(runToggleCompanionLibraryFavorite).toBe(toggleFavoriteDirect);
  });

  it('presentation I/O binds companion ports to public-rpc adapters', () => {
    expect(companionOrchestrator).toBe(supabaseCompanionOrchestrator);
    expect(companionPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O exports port-bound wrappers distinct from ritual/frame leaf use cases', () => {
    expect(typeof pauseCompanionUiStepCompletion).toBe('function');
    expect(typeof pauseToggleCompanionLibraryFavorite).toBe('function');
    expect(typeof pauseLoadCompanionOrchestrateSession).toBe('function');
    expect(pauseCompanionUiStepCompletion).not.toBe(persistDirect);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(toggleFavoriteDirect);
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(loadSessionFromOrchestrationIo);
  });

  it('pauseCompanionUiStepCompletion delegates to persist-ui-step-completion with default repository', async () => {
    await pauseCompanionUiStepCompletion('pi-app-parity', 'signal');

    expect(persistDirect).toHaveBeenCalledWith(
      companionPauseRepository,
      'pi-app-parity',
      'signal',
    );
  });

  it('pauseToggleCompanionLibraryFavorite delegates to run-toggle-companion-library-favorite with default repository', async () => {
    await pauseToggleCompanionLibraryFavorite({
      pauseInstanceId: 'pi-app-parity',
      sourceType: 'podcast',
    });

    expect(toggleFavoriteDirect).toHaveBeenCalledWith(companionPauseRepository, {
      pauseInstanceId: 'pi-app-parity',
      sourceType: 'podcast',
    });
  });

  it('presentation orchestration-io wrappers stay distinct from orchestration-flow leaf exports', () => {
    expect(pauseCompanionUiStepCompletion).not.toBe(persistCompanionUiStepCompletion);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(runToggleCompanionLibraryFavorite);
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(loadCompanionOrchestrateSession);
    // Reciprocal inline pins: `presentation/companion/pause-companion-orchestration-io-parity.test.ts`.
  });
});
