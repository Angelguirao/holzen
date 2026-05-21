/**
 * Pause RPC mutations and default port adapters (loads Supabase client).
 * Import from here in hooks/tests — not from `public.ts`, which stays free of
 * infrastructure side effects. Query factories stay on `public-queries.ts`.
 */
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
export {
  supabasePauseRepository,
  supabaseCompanionOrchestrator,
  supabasePauseAnalyticsRepository,
  supabaseReflectGenerator,
};
export {
  invokeGroundingEnrich,
  type GroundingEnrichBody,
  type GroundingEnrichment,
} from './infrastructure/edge/grounding-enrich-edge';
import type { RunReflectGenerationInput } from './application/use-cases/ritual/reflect/generation/run-reflect-generation';
import type { ReflectGenerationResult } from './domain/reflect/generation/reflect-generation-result';
import { showPauseStepSyncFailedToast } from './presentation/ritual/pause-step-sync-toast';

export type { RunReflectGenerationInput, ReflectGenerationResult };

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
