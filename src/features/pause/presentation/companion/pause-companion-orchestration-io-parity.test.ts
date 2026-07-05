/**
 * Presentation I/O parity (colocated beside `pause-companion-orchestration-io.ts`).
 * Application mirror: `application/.../ritual/frame/pause-companion-orchestration-io-parity.test.ts`.
 * Imports `pause-companion-orchestration-flow` CI umbrella for `.toBe` identity pins only —
 * production orchestration I/O keeps ritual/frame leaf imports.
 * Orchestrate-io sibling: reciprocal inline pins ↔ `pause-companion-orchestrate-io-parity.test.ts`;
 * dedicated `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts`.
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
  applyCompanionSlotOrchestrateOutcome,
  logCompanionSlotOrchestrateInvoke,
  runCompanionSlotOrchestrate,
  setCompanionSlotLoading,
  trackCompanionGenerationInitiated,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-flow';
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
  pauseCompanionUiStepCompletionWithRepository,
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
  pauseToggleCompanionLibraryFavoriteWithRepository,
} from './pause-companion-orchestration-io';
import {
  supabaseCompanionOrchestrator,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';

describe('pause-companion-orchestration-io parity', () => {
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
    expect(pauseCompanionUiStepCompletion).not.toBe(pauseToggleCompanionLibraryFavorite);
    expect(pauseCompanionUiStepCompletionWithRepository).not.toBe(persistDirect);
    expect(pauseToggleCompanionLibraryFavoriteWithRepository).not.toBe(toggleFavoriteDirect);
    expect(pauseCompanionUiStepCompletionWithRepository).not.toBe(pauseCompanionUiStepCompletion);
    expect(pauseToggleCompanionLibraryFavoriteWithRepository).not.toBe(pauseToggleCompanionLibraryFavorite);
    // Reciprocal inline pins: `pause-companion-orchestrate-io-parity.test.ts`.
  });

  it('pauseCompanionUiStepCompletion delegates to persist-ui-step-completion with default repository', async () => {
    await pauseCompanionUiStepCompletion('pi-parity', 'breathing');

    expect(persistDirect).toHaveBeenCalledWith(
      companionPauseRepository,
      'pi-parity',
      'breathing',
    );
  });

  it('pauseToggleCompanionLibraryFavorite delegates to run-toggle-companion-library-favorite with default repository', async () => {
    const onBucketComputed = vi.fn();

    await pauseToggleCompanionLibraryFavorite({
      pauseInstanceId: 'pi-parity',
      sourceType: 'article',
      nextBucket: { article: true },
      onBucketComputed,
    });

    expect(toggleFavoriteDirect).toHaveBeenCalledWith(companionPauseRepository, {
      pauseInstanceId: 'pi-parity',
      sourceType: 'article',
      nextBucket: { article: true },
      onBucketComputed,
    });
  });

  it('pauseCompanionUiStepCompletionWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected-persist' } as unknown as typeof companionPauseRepository;

    await pauseCompanionUiStepCompletionWithRepository(customRepo, 'pi-injected', 'breathing');

    expect(persistDirect).toHaveBeenCalledWith(customRepo, 'pi-injected', 'breathing');
  });

  it('pauseToggleCompanionLibraryFavoriteWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected-favorite' } as unknown as typeof companionPauseRepository;

    await pauseToggleCompanionLibraryFavoriteWithRepository(customRepo, {
      pauseInstanceId: 'pi-injected',
      sourceType: 'podcast',
      nextBucket: { podcast: true },
    });

    expect(toggleFavoriteDirect).toHaveBeenCalledWith(customRepo, {
      pauseInstanceId: 'pi-injected',
      sourceType: 'podcast',
      nextBucket: { podcast: true },
    });
  });

  it('orchestration-io port-bound wrappers stay distinct from orchestration-flow leaf exports', () => {
    expect(pauseCompanionUiStepCompletion).not.toBe(persistCompanionUiStepCompletion);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(runToggleCompanionLibraryFavorite);
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(loadCompanionOrchestrateSession);
    // Reciprocal inline pins: `pause-companion-orchestration-io.test.ts`,
    // `pause-companion-orchestrate-io-parity.test.ts` (application + presentation).
    // dedicated siblings: `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts`,
    // `pause-companion-analytics-orchestration-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-companion-orchestrate-io-parity.test.ts` (application + presentation).
   * Persist/favorite leaf pins: orchestrate-io parity `sibling cluster: orchestration-io persist/favorite wrappers…`.
   */
  it('sibling cluster: orchestrate-io slot exports stay distinct from orchestration-io', () => {
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(runCompanionSlotOrchestrate);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(runCompanionSlotOrchestrate);
    expect(pauseCompanionUiStepCompletion).not.toBe(applyCompanionSlotOrchestrateOutcome);
    expect(loadCompanionOrchestrateSession).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(nextExpandedWithLazyFetch).not.toBe(trackCompanionGenerationInitiated);
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(setCompanionSlotLoading);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(logCompanionSlotOrchestrateInvoke);
    expect(companionOrchestrator).not.toBe(runCompanionSlotOrchestrate);
  });
});
