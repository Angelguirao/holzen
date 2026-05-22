/**
 * Companion orchestration presentation I/O (session load, UI completion, favorites, expansion).
 * Imports ritual/frame leaf modules directly (parity with `pause-companion-orchestrate-io` peel).
 * Parity pins: `pause-companion-orchestration-io.test.ts`, `pause-companion-orchestration-io-parity.test.ts`,
 * `pause-companion-orchestrate-orchestration-io-sibling-parity.test.ts` ↔ `pause-companion-orchestrate-io`,
 * `pause-companion-frame-ui-orchestration-io-sibling-parity.test.ts` ↔ `pause-companion-frame-ui-io`,
 * `pause-companion-analytics-orchestration-io-sibling-parity.test.ts` ↔ `pause-companion-analytics-io`;
 * reciprocal inline pins: `pause-companion-orchestration-io.test.ts` ↔ `pause-companion-frame-ui-io.test.ts`,
 * `pause-companion-orchestration-io.test.ts` ↔ `pause-companion-analytics-io.test.ts`.
 */
import { invalidateCompanionUiCompletionQuery } from '@/features/pause/infrastructure/queries/companion/companion-ui-completion-query-key';
import {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from '@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session';
import type { CompanionUiCompletionStep } from '@/features/pause/application/use-cases/ritual/frame/companion-ui-completion-types';
import { nextExpandedWithLazyFetch } from '@/features/pause/application/use-cases/ritual/frame/next-expanded-with-lazy-fetch';
import { persistCompanionUiStepCompletion } from '@/features/pause/application/use-cases/ritual/frame/persist-ui-step-completion';
import { runToggleCompanionLibraryFavorite } from '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite';
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
