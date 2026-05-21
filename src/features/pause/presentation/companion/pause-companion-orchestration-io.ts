import { invalidateCompanionUiCompletionQuery } from '@/features/pause/application/queries/companion-ui-completion-query-key';
import {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from '@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session';
import { nextExpandedWithLazyFetch } from '@/features/pause/application/use-cases/ritual/frame/next-expanded-with-lazy-fetch';
import { runToggleCompanionLibraryFavorite } from '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite';
import { persistCompanionUiStepCompletion } from '@/features/pause/application/use-cases/ritual/frame/persist-ui-step-completion';
import type { CompanionUiCompletionStep } from '@/features/pause/application/use-cases/ritual/frame/companion-ui-completion-types';
import { loadMoodHistoryForOrchestrate } from '@/features/pause/public-queries';
import {
  supabaseCompanionOrchestrator,
  supabasePauseRepository,
} from '@/features/pause/public-rpc';

export type { LoadCompanionOrchestrateSessionInput, LoadCompanionOrchestrateSessionPorts };

export { loadCompanionOrchestrateSession };

/** Default companion-orchestrate edge port for presentation hooks. */
export const companionOrchestrator = supabaseCompanionOrchestrator;

/** Default pause RPC port for companion presentation (favorites, UI completion). */
export const companionPauseRepository = supabasePauseRepository;

/** Default port + use case: reflect-strip companion UI step completion persist. */
export function pauseCompanionUiStepCompletion(
  pauseInstanceId: string,
  step: CompanionUiCompletionStep,
): ReturnType<typeof persistCompanionUiStepCompletion> {
  return persistCompanionUiStepCompletion(companionPauseRepository, pauseInstanceId, step);
}

export { invalidateCompanionUiCompletionQuery, nextExpandedWithLazyFetch };

/** Default port + use case: per-slot companion card favorites on pause instance metadata. */
export function pauseToggleCompanionLibraryFavorite(
  input: Parameters<typeof runToggleCompanionLibraryFavorite>[1],
): ReturnType<typeof runToggleCompanionLibraryFavorite> {
  return runToggleCompanionLibraryFavorite(companionPauseRepository, input);
}

/** Default mood-history query + session builder for slot orchestrate invokes. */
export function pauseLoadCompanionOrchestrateSession(
  input: LoadCompanionOrchestrateSessionInput,
  ports: LoadCompanionOrchestrateSessionPorts = {
    loadMoodHistory: loadMoodHistoryForOrchestrate,
  },
): ReturnType<typeof loadCompanionOrchestrateSession> {
  return loadCompanionOrchestrateSession(input, ports);
}
