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
import type { PauseCompanionAction } from './domain/pause-state';
export type { ReflectGenerator } from './ports/reflect-generator';
export type { PauseAnalyticsRepository } from './ports/pause-analytics-repository';

export { ritualDepthUpgradedPayload } from './application/use-cases/ritual/brief/ritual-depth-upgrade';
export type { CompanionOrchestrator } from './ports/companion-orchestrator';
import { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
import { supabaseCompanionOrchestrator } from './infrastructure/supabase-companion-orchestrator';
import { supabasePauseAnalyticsRepository } from './infrastructure/supabase-pause-analytics-repository';
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
import { logPauseCompanion as logPauseCompanionUseCase } from './application/use-cases/ritual/log/log-pause-companion';
import {
  runLogPwaInstallAnalyticsEvent,
  type LogPwaInstallAnalyticsEventInput,
} from './application/use-cases/home/run-log-pwa-install-analytics-event';
import {
  runLogDevModeSetting,
  type LogDevModeSettingInput,
} from './application/use-cases/admin/run-log-dev-mode-setting';
import { runFetchDevModeSetting } from './application/use-cases/admin/run-fetch-dev-mode-setting';
import type { RunReflectGenerationInput } from './application/use-cases/ritual/reflect/generation/run-reflect-generation';
import type { ReflectGenerationResult } from './domain/reflect/generation/reflect-generation-result';
import { showPauseStepSyncFailedToast } from './presentation/ritual/pause-step-sync-toast';

export type { RunReflectGenerationInput, ReflectGenerationResult };

/** Lifecycle + ritual mutations — wired facades only; no generic `pauseLogStep` export. */

export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './application/use-cases/ritual/decide/outcome-toast';

export type {
  CompanionFeedbackVote,
  LogCompanionFeedbackVoteInput,
} from './application/use-cases/ritual/frame/log-companion-feedback-vote';
export type { LogPwaInstallAnalyticsEventInput } from './application/use-cases/home/run-log-pwa-install-analytics-event';

/** Frame / companion UI — `pause_log_companion` via `PauseRepository` (wired for presentation). */
export function logPauseCompanion(params: {
  instanceId: string | null;
  companionType: string;
  action: PauseCompanionAction;
  entryPoint: string;
}): Promise<PauseLogCompanionResult> {
  return logPauseCompanionUseCase(supabasePauseRepository, params);
}

/** PWA install funnel — wired `PauseAnalyticsRepository.insertEvent` (Home / settings). */
export function logPausePwaInstallAnalyticsEvent(
  input: LogPwaInstallAnalyticsEventInput,
): Promise<{ ok: boolean }> {
  return runLogPwaInstallAnalyticsEvent(supabasePauseAnalyticsRepository, input);
}

/** Fire-and-forget PWA install funnel events — screens import via `public-hooks` / `public-rpc`. */
export function logPwaInstallAnalyticsEvent(
  userId: string | undefined,
  event: string,
  metadata?: Record<string, unknown>,
): void {
  if (!userId) return;
  void logPausePwaInstallAnalyticsEvent({
    userId,
    event,
    metadata: metadata ?? {},
  });
}

/** Admin rapid-testing toggle write — wired `PauseAnalyticsRepository.insertEvent`. */
export function logPauseDevModeSetting(
  input: LogDevModeSettingInput,
): Promise<{ ok: boolean }> {
  return runLogDevModeSetting(supabasePauseAnalyticsRepository, input);
}

/** Admin rapid-testing toggle read — wired `PauseAnalyticsRepository.fetchDevModeSetting`. */
export function fetchPauseDevModeSetting(userId: string): Promise<boolean | null> {
  return runFetchDevModeSetting(supabasePauseAnalyticsRepository, userId);
}

/** Admin rapid-testing toggle write — screen helper (delegates to `logPauseDevModeSetting`). */
export async function logDevModeSetting(userId: string, enabled: boolean): Promise<void> {
  await logPauseDevModeSetting({ userId, enabled });
}

export { showPauseStepSyncFailedToast };
