import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
  supabasePauseRepository: { port: 'companionPauseRepository' },
}));

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
} from '@/features/pause/presentation/companion/pause-companion-orchestration-io';
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
});
