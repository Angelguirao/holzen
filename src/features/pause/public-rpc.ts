/**
 * Pause RPC mutations (loads Supabase client). Import from here in hooks/tests —
 * not from `public.ts`, which stays free of infrastructure side effects.
 */
export type {
  PauseAdoptPendingResult,
  PauseCreateOrReuseResult,
  PauseLogCompanionResult,
} from './domain/rpc-types';
export type { PauseCompanionAction, PauseState } from './domain/pause-state';
import type { PauseCompanionAction } from './domain/pause-state';
export type { OpenManualPauseFromHomeResult } from './application/use-cases/trigger/open-manual-pause-from-home';

export { ritualDepthUpgradedPayload } from './application/use-cases/ritual/brief/ritual-depth-upgrade';
export { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
export { invokeCompanionOrchestrate } from './infrastructure/edge/companion-orchestrate-edge';
export type { CompanionOrchestrator } from './ports/companion-orchestrator';
export { supabaseCompanionOrchestrator } from './infrastructure/supabase-companion-orchestrator';
export type { CompanionOrchestrateSessionContext } from './application/use-cases/ritual/frame/build-companion-orchestrate-body';
export type { LoadCompanionOrchestrateSessionInput } from './application/use-cases/ritual/frame/load-companion-orchestrate-session';
import {
  loadCompanionOrchestrateSession as loadCompanionOrchestrateSessionUseCase,
  type LoadCompanionOrchestrateSessionInput,
} from './application/use-cases/ritual/frame/load-companion-orchestrate-session';
import { loadMoodHistoryForOrchestrate } from './infrastructure/companion/mood-history';
export {
  invokeGroundingEnrich,
  type GroundingEnrichBody,
  type GroundingEnrichment,
} from './infrastructure/edge/grounding-enrich-edge';
import { dismissOpenPauseHome } from './application/use-cases/dismiss/dismiss-open-pause-home';
import { logRetrospectiveOutcome as logRetrospectiveOutcomeUseCase } from './application/use-cases/archive/log-retrospective-outcome';
import {
  runAdoptPendingPauseOffer,
  type RunAdoptPendingPauseOfferResult,
} from './application/use-cases/pending-offer/run-adopt-pending-pause-offer';
import {
  runDeclinePendingPauseOffer,
  type RunDeclinePendingPauseOfferResult,
} from './application/use-cases/pending-offer/run-decline-pending-pause-offer';
import { logPauseRitualDepthUpgraded as logPauseRitualDepthUpgradedUseCase } from './application/use-cases/ritual/brief/ritual-depth-upgrade';
import {
  applyBulkHoldOutcomes as applyBulkHoldOutcomesUseCase,
  type BulkHoldApplyResult,
} from './application/use-cases/home/bulk-hold/apply-bulk-hold-outcomes';
import { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
import { supabaseReflectGenerator } from './infrastructure/supabase-reflect-generator';
import { openManualPauseFromHome as openManualPauseFromHomeUseCase } from './application/use-cases/trigger/open-manual-pause-from-home';
import type { OpenManualPauseFromHomeParams } from './application/use-cases/trigger/open-manual-pause-from-home';
import type { TFunction } from 'i18next';
import type { BulkHoldOutcomeChoice, BulkHoldPendingPause } from './domain/bulk-hold';
import type { PauseState } from './domain/pause-state';
import {
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
} from './application/use-cases/ritual/done/post-pause-emotion-log';
import type { MoodValue } from './domain/mood-value';
import { runPauseOutcomeLog } from './application/use-cases/ritual/decide/run-pause-outcome-log';
import { invalidateCompanionUiCompletionQuery } from './application/queries/companion-ui-completion-query-key';
import { persistCompanionUiStepCompletion as persistCompanionUiStepCompletionUseCase } from './application/use-cases/ritual/frame/persist-ui-step-completion';
import type { CompanionUiCompletionStep } from './application/use-cases/ritual/frame/companion-ui-completion-types';
import {
  applyBreathSegmentLogOutcome,
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  type RunBreathSegmentLogResult,
} from './application/use-cases/ritual/breathe/run-breath-segment-log';
import { initialBreathSegmentRpcLoggedFlagsFromRestored } from './application/use-cases/session/step-map';
import { runPauseCreateOrReuse } from './application/use-cases/session/run-pause-create-or-reuse';
import { runPauseDismissCurrent } from './application/use-cases/session/run-pause-dismiss-current';
import type { LogCompanionFeedbackVoteInput } from './application/use-cases/ritual/frame/log-companion-feedback-vote';
import { runFetchCompanionFeedbackVote } from './application/use-cases/ritual/frame/run-fetch-companion-feedback-vote';
import { runLogCompanionFeedbackVote } from './application/use-cases/ritual/frame/run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened } from './application/use-cases/ritual/frame/run-log-companion-fullview-opened';
import type { LogCompanionFullviewOpenedInput } from './application/use-cases/ritual/frame/log-companion-fullview-opened';
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
import { supabasePauseAnalyticsRepository } from './infrastructure/supabase-pause-analytics-repository';

/** Lifecycle + ritual mutations — wired facades only; no generic `pauseLogStep` export. */

/** Session lifecycle — `pause_create_or_reuse` via `PauseRepository` (wired for presentation). */
export function pauseCreateOrReuse(
  params: Parameters<typeof runPauseCreateOrReuse>[1],
): Promise<PauseCreateOrReuseResult> {
  return runPauseCreateOrReuse(supabasePauseRepository, params);
}

/** Session lifecycle — `pause_dismiss_current` via `PauseRepository` (wired for presentation). */
export function pauseDismissCurrent(): Promise<PauseState | null> {
  return runPauseDismissCurrent(supabasePauseRepository);
}

/** Pending offer — adopt via `PauseRepository` (wired for presentation). */
export function adoptPendingPauseOffer(): Promise<RunAdoptPendingPauseOfferResult> {
  return runAdoptPendingPauseOffer(supabasePauseRepository);
}

/** Pending offer — decline via `PauseRepository` (wired for presentation). */
export function declinePendingPauseOffer(): Promise<RunDeclinePendingPauseOfferResult> {
  return runDeclinePendingPauseOffer(supabasePauseRepository);
}

/** Home open-pause preview dismiss — clears local preview then `dismissCurrent` on the port. */
export function dismissOpenPauseHomePreview(
  hasUser: boolean,
  clearPreview: () => void,
): Promise<void> {
  return dismissOpenPauseHome(hasUser, {
    clearPreview,
    dismissCurrent: () => pauseDismissCurrent(),
  });
}

export type { BulkHoldApplyResult };
export type { PostPauseFeelSnapshot };
export type { RunBreathSegmentLogResult };
export type { CompanionUiCompletionStep };
export type { RunAdoptPendingPauseOfferResult, RunDeclinePendingPauseOfferResult };

/** Frame companion UI step completion — wired with default `PauseRepository`. */
export async function persistCompanionUiStepCompletion(
  pauseInstanceId: string,
  step: CompanionUiCompletionStep,
  options?: { entryPoint?: string },
): Promise<void> {
  await persistCompanionUiStepCompletionUseCase(
    supabasePauseRepository,
    pauseInstanceId,
    step,
    options,
  );
  invalidateCompanionUiCompletionQuery(pauseInstanceId);
}

/** Home manual trigger — `pause_create_or_reuse` (+ silent reflection stub). */
export function openManualPauseFromHome(params: OpenManualPauseFromHomeParams) {
  return openManualPauseFromHomeUseCase(
    {
      repository: supabasePauseRepository,
      reflect: supabaseReflectGenerator,
    },
    params,
  );
}

/** Wired with default Supabase repository — screens/tests keep a stable import. */
export function logPauseRitualDepthUpgraded(instanceId: string, t: TFunction): Promise<boolean> {
  return logPauseRitualDepthUpgradedUseCase(supabasePauseRepository, instanceId, t);
}

export function applyBulkHoldOutcomes(
  rows: BulkHoldPendingPause[],
  resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice,
): Promise<BulkHoldApplyResult> {
  return applyBulkHoldOutcomesUseCase(supabasePauseRepository, rows, resolver);
}

/** Archive retrospective outcome — wired with default repository. */
export function logRetrospectiveOutcome(params: {
  instanceId: string;
  outcome: string;
}): Promise<PauseState | null> {
  return logRetrospectiveOutcomeUseCase(supabasePauseRepository, params);
}

export { showPauseStepSyncFailedToast } from './application/use-cases/ritual/step-sync-toast';
export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './application/use-cases/ritual/decide/outcome-toast';
export {
  formatReinforcementQuoteFromSession,
  resolvePauseDecideOutcomeFlow,
  type PauseDecideOutcomeFlow,
} from './application/use-cases/ritual/decide/pause-decide-outcome-flow';
export { getSessionQuote } from './application/use-cases/session/wisdom-quotes';

export type {
  CompanionFeedbackVote,
  LogCompanionFeedbackVoteInput,
} from './application/use-cases/ritual/frame/log-companion-feedback-vote';
export type {
  CompanionFullviewKind,
  LogCompanionFullviewOpenedInput,
} from './application/use-cases/ritual/frame/log-companion-fullview-opened';
export type { LogPwaInstallAnalyticsEventInput } from './application/use-cases/home/run-log-pwa-install-analytics-event';

/** Companion feedback vote read — wired `PauseAnalyticsRepository.fetchCompanionFeedbackVote`. */
export function fetchPauseCompanionFeedbackVote(
  userId: string,
  pauseInstanceId: string,
  companionType: string,
): Promise<'up' | 'down' | null> {
  return runFetchCompanionFeedbackVote(supabasePauseAnalyticsRepository, {
    userId,
    pauseInstanceId,
    companionType,
  });
}

/** Companion feedback vote write — wired `PauseAnalyticsRepository.logCompanionFeedbackVote`. */
export function logPauseCompanionFeedbackVote(
  input: LogCompanionFeedbackVoteInput,
): Promise<{ ok: boolean }> {
  return runLogCompanionFeedbackVote(supabasePauseAnalyticsRepository, input);
}

/** Companion fullview open — wired `PauseAnalyticsRepository.insertEvent` (presentation). */
export function logPauseCompanionFullviewOpened(
  input: LogCompanionFullviewOpenedInput,
): Promise<{ ok: boolean }> {
  return runLogCompanionFullviewOpened(supabasePauseAnalyticsRepository, input);
}

/** Frame slot orchestrate — ritual session payload + mood history (wired for presentation). */
export function loadPauseCompanionOrchestrateSession(input: LoadCompanionOrchestrateSessionInput) {
  return loadCompanionOrchestrateSessionUseCase(input, {
    loadMoodHistory: loadMoodHistoryForOrchestrate,
  });
}

/** Inline companion card expand — lazy-fetch on first open (Pro gate). */
export { nextExpandedWithLazyFetch } from './application/use-cases/ritual/frame/next-expanded-with-lazy-fetch';

/** Companion slot orchestrate — presentation helpers (no wired RPC facades). */
export { applyCompanionSlotOrchestrateOutcome } from './application/use-cases/ritual/frame/apply-companion-slot-orchestrate-outcome';
export { logCompanionSlotOrchestrateInvoke } from './application/use-cases/ritual/frame/companion-slot-orchestrate-telemetry';
export type { ApplyCompanionSlotOrchestrateFailureUiPorts } from './application/use-cases/ritual/frame/companion-slot-orchestrate-failure-ui';
export {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from './application/use-cases/ritual/frame/companion-slot-ui-state';
export { trackCompanionGenerationInitiated } from './application/use-cases/ritual/frame/companion-generation-telemetry';
export {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
  type RunCompanionSlotOrchestratePorts,
} from './application/use-cases/ritual/frame/run-companion-slot-orchestrate';
export {
  EMPTY_COMPANION_SLOT_RELAXATIONS,
  type CompanionSlotCacheIds,
  type CompanionSlotCommitters,
  type CompanionSlotRelaxations,
} from './application/use-cases/ritual/frame/orchestrate-slot-apply';
export { applyCompanionOrchestrateRetryReset } from './application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset';
export { resetInterventionIdempotency } from './application/use-cases/ritual/frame/intervention-idempotency';

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

/** Decide step — `outcome_logged` via repository port (wired for presentation). */
export function logPauseOutcome(params: {
  pauseInstanceId: string | null;
  decision: string;
}) {
  return runPauseOutcomeLog(supabasePauseRepository, params);
}

export { applyBreathSegmentLogOutcome, initialBreathSegmentRpcLoggedFlagsFromRestored };
export type { RunBreathSegmentLogResult };

const breathSegmentLogDeps = {
  onSegmentLogged: invalidateCompanionUiCompletionQuery,
};

/** Breath segment 1 — `breath_completed` via repository port (wired for presentation). */
export function ensureBreathSegment1Logged(
  input: Parameters<typeof runEnsureBreathSegment1Logged>[1],
) {
  return runEnsureBreathSegment1Logged(supabasePauseRepository, input, breathSegmentLogDeps);
}

/** Breath segment 2 — `breath_completed` via repository port (wired for presentation). */
export function ensureBreathSegment2Logged(
  input: Parameters<typeof runEnsureBreathSegment2Logged>[1],
) {
  return runEnsureBreathSegment2Logged(supabasePauseRepository, input, breathSegmentLogDeps);
}

/** Breath segment 1 skip — wired with default `PauseRepository`. */
export function logBreathSegment1Skipped(
  input: Parameters<typeof runLogBreathSegment1Skipped>[1],
) {
  return runLogBreathSegment1Skipped(supabasePauseRepository, input, breathSegmentLogDeps);
}

/** Breath segment 2 skip — wired with default `PauseRepository`. */
export function logBreathSegment2Skipped(
  input: Parameters<typeof runLogBreathSegment2Skipped>[1],
) {
  return runLogBreathSegment2Skipped(supabasePauseRepository, input, breathSegmentLogDeps);
}

/** Brief done save — `post_pause_emotion_logged` when check-in differs from ritual snapshot. */
/** Brief done “Save to journey” — `post_pause_emotion_logged` when feel changed. */
export function logPostPauseEmotionIfDirty(params: {
  pauseInstanceId: string | null;
  mood: MoodValue | null;
  intensity: number;
  initialSnapshot: PostPauseFeelSnapshot | null;
}) {
  return runPostPauseEmotionLogIfDirty(supabasePauseRepository, params);
}
