/**
 * Companion orchestration presentation I/O (session load, UI completion, favorites, expansion).
 * Imports ritual/frame use cases via orchestration subcluster flow anchors
 * (parity with `pause-reflect-steps-io` / `pause-reflect-flows-io` peels).
 */
import {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-orchestrate-session-flow';
import { runToggleCompanionLibraryFavorite } from '@/features/pause/application/use-cases/ritual/frame/pause-companion-library-favorite-flow';
import { nextExpandedWithLazyFetch } from '@/features/pause/application/use-cases/ritual/frame/pause-companion-section-expansion-flow';
import {
  invalidateCompanionUiCompletionQuery,
  persistCompanionUiStepCompletion,
  type CompanionUiCompletionStep,
} from '@/features/pause/application/use-cases/ritual/frame/pause-companion-ui-completion-flow';
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
