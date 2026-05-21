/**
 * Pause RPC mutations and default port adapters (loads Supabase client).
 * Import from here in hooks/tests — not from `public.ts`, which stays free of
 * infrastructure side effects. Query factories stay on `public-queries.ts`.
 */
import type { PauseCreateOrReuseResult } from './domain/rpc-types';
export type {
  PauseAdoptPendingResult,
  PauseCreateOrReuseResult,
  PauseLogCompanionResult,
} from './domain/rpc-types';
export type { PauseCompanionAction, PauseState } from './domain/pause-state';
export type { ReflectGenerator } from './ports/reflect-generator';
export type { PauseAnalyticsRepository } from './ports/pause-analytics-repository';

export { ritualDepthUpgradedPayload } from './application/use-cases/ritual/brief/ritual-depth-upgrade';
export type { CompanionOrchestrator } from './ports/companion-orchestrator';
import { supabasePauseAnalyticsRepository } from './infrastructure/supabase-pause-analytics-repository';
import { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
import { supabaseCompanionOrchestrator } from './infrastructure/supabase-companion-orchestrator';
import { supabaseReflectGenerator } from './infrastructure/supabase-reflect-generator';
import { reflectionStepSessionStorage } from './infrastructure/edge/reflect/reflection-step-session-storage';
import { persistedTabSessionStorage } from './infrastructure/persisted-tab-session-storage-adapter';
export {
  supabasePauseRepository,
  supabaseCompanionOrchestrator,
  supabasePauseAnalyticsRepository,
  supabaseReflectGenerator,
  reflectionStepSessionStorage,
  persistedTabSessionStorage,
};
export {
  invokeGroundingEnrich,
  type GroundingEnrichBody,
  type GroundingEnrichment,
} from './infrastructure/edge/grounding-enrich-edge';
import { runPauseCreateOrReuse } from './application/use-cases/session/run-pause-create-or-reuse';
import { runPauseDismissCurrent } from './application/use-cases/session/run-pause-dismiss-current';
import type { RunReflectGenerationInput } from './application/use-cases/ritual/reflect/generation/holzen-reflect/run-reflect-generation';
import type { ReflectGenerationResult } from './domain/reflect/generation/reflect-generation-result';
import type { PauseRepository } from './ports/pause-repository';
import { showPauseStepSyncFailedToast } from './presentation/ritual/pause-step-sync-toast';

export type { RunReflectGenerationInput, ReflectGenerationResult };

/** Lifecycle: `pause_create_or_reuse` / `pause_dismiss_current` via wired `PauseRepository`. */
export async function pauseCreateOrReuse(
  params: Parameters<PauseRepository['createOrReuse']>[0],
): Promise<PauseCreateOrReuseResult> {
  return runPauseCreateOrReuse(supabasePauseRepository, params);
}

export async function pauseDismissCurrent(): Promise<PauseState | null> {
  return runPauseDismissCurrent(supabasePauseRepository);
}

/** Lifecycle + ritual mutations — wired port adapters; no generic `pauseLogStep` export. */

export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './application/use-cases/ritual/decide/outcome-toast';

export type {
  CompanionFeedbackVote,
  LogCompanionFeedbackVoteInput,
} from './application/use-cases/ritual/frame/log-companion-feedback-vote';

export { showPauseStepSyncFailedToast };
