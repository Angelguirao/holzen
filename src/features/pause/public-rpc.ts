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
export type { OpenManualPauseFromHomeResult } from './application/use-cases/trigger/open-manual-pause-from-home';
export type { ReflectGenerator } from './ports/reflect-generator';
export type { PauseAnalyticsRepository } from './ports/pause-analytics-repository';

export { ritualDepthUpgradedPayload } from './application/use-cases/ritual/brief/ritual-depth-upgrade';
export { invokeCompanionOrchestrate } from './infrastructure/edge/companion-orchestrate-edge';
export type { CompanionOrchestrator } from './ports/companion-orchestrator';
export { createCompanionSlotOrchestratePorts } from './infrastructure/supabase-companion-orchestrator';
import { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
import { supabaseCompanionOrchestrator } from './infrastructure/supabase-companion-orchestrator';
import { supabasePauseAnalyticsRepository } from './infrastructure/supabase-pause-analytics-repository';
import { supabaseReflectGenerator } from './infrastructure/supabase-reflect-generator';
import { reflectionStepSessionStorage } from './infrastructure/edge/reflect/reflection-step-session-storage';

export {
  supabasePauseRepository,
  supabaseCompanionOrchestrator,
  supabasePauseAnalyticsRepository,
  supabaseReflectGenerator,
  reflectionStepSessionStorage,
};
export type { CompanionOrchestrateSessionContext } from './application/use-cases/ritual/frame/build-companion-orchestrate-body';
export type {
  CompanionSlotAutosaveParams,
  CompanionSlotCacheIds,
  CompanionSlotCommitters,
  CompanionSlotRelaxations,
} from './application/use-cases/ritual/frame/orchestrate-slot-apply';
export { EMPTY_COMPANION_SLOT_RELAXATIONS } from './application/use-cases/ritual/frame/orchestrate-slot-apply';
export { applyCompanionOrchestrateRetryReset } from './application/use-cases/ritual/frame/apply-companion-orchestrate-retry-reset';
export { resetInterventionIdempotency } from './application/use-cases/ritual/frame/intervention-idempotency';
export {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  companionPrefsForFullViewSlot,
  isCompanionFullViewSlotSettled,
  pauseSeverityToOrchestrateNumber,
} from './application/use-cases/ritual/frame/full-view-page-helpers';
export {
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from './application/use-cases/ritual/frame/section-visibility';
export type { CompanionSectionVisibility } from './application/use-cases/ritual/frame/section-visibility';
export { nextExpandedWithLazyFetch } from './application/use-cases/ritual/frame/next-expanded-with-lazy-fetch';
export { applyCompanionSlotOrchestrateOutcome } from './application/use-cases/ritual/frame/apply-companion-slot-orchestrate-outcome';
export type { ApplyCompanionSlotOrchestrateFailureUiPorts } from './application/use-cases/ritual/frame/companion-slot-orchestrate-failure-ui';
export { logCompanionSlotOrchestrateInvoke } from './application/use-cases/ritual/frame/companion-slot-orchestrate-telemetry';
export { trackCompanionGenerationInitiated } from './application/use-cases/ritual/frame/companion-generation-telemetry';
export {
  setCompanionSlotError,
  setCompanionSlotLoading,
  type CompanionSlotErrorSetters,
  type CompanionSlotLoadingSetters,
} from './application/use-cases/ritual/frame/companion-slot-ui-state';
export type { LoadCompanionOrchestrateSessionInput } from './application/use-cases/ritual/frame/load-companion-orchestrate-session';
import {
  runCompanionInterventionBootstrap as runCompanionInterventionBootstrapUseCase,
  type RunCompanionInterventionBootstrapInput,
  type RunCompanionInterventionBootstrapResult,
} from './application/use-cases/ritual/frame/run-companion-intervention-bootstrap';
import {
  runCompanionSlotOrchestrate,
  type CompanionSlotOrchestrateMode,
  type RunCompanionSlotOrchestrateResult,
} from './application/use-cases/ritual/frame/run-companion-slot-orchestrate';
import { fetchParsedPauseArtifactCache } from './infrastructure/queries/artifact-cache-query';
import type { RegenerateCompanionSlot } from './domain/companion-orchestrate';
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
import { dismissOpenPauseHome } from './application/use-cases/home/dismiss-open-pause-home';
import { logRetrospectiveOutcome as logRetrospectiveOutcomeUseCase } from './application/use-cases/archive/log-retrospective-outcome';
import {
  runAdoptPendingPauseOffer,
  type RunAdoptPendingPauseOfferResult,
} from './application/use-cases/pending-offer/run-adopt-pending-pause-offer';
import {
  runDeclinePendingPauseOffer,
  type RunDeclinePendingPauseOfferResult,
} from './application/use-cases/pending-offer/run-decline-pending-pause-offer';
import {
  applyBulkHoldOutcomes as applyBulkHoldOutcomesUseCase,
  type BulkHoldApplyResult,
} from './application/use-cases/home/bulk-hold/apply-bulk-hold-outcomes';
import { openManualPauseFromHome as openManualPauseFromHomeUseCase } from './application/use-cases/trigger/open-manual-pause-from-home';
import type { OpenManualPauseFromHomeParams } from './application/use-cases/trigger/open-manual-pause-from-home';
import type { BulkHoldOutcomeChoice, BulkHoldPendingPause } from './domain/bulk-hold';
import type { PauseState } from './domain/pause-state';
import type { PostPauseFeelSnapshot } from './domain/ritual/done/post-pause-emotion-log';
import type { RunPauseFavoriteToggleResult } from './application/use-cases/ritual/reflect/steps/run-pause-favorite-toggle';
import type { RunPauseReflectTagUpdateResult } from './application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update';
import { invalidateCompanionUiCompletionQuery } from './application/queries/companion-ui-completion-query-key';
import { persistCompanionUiStepCompletion as persistCompanionUiStepCompletionUseCase } from './application/use-cases/ritual/frame/persist-ui-step-completion';
import type { CompanionUiCompletionStep } from './application/use-cases/ritual/frame/companion-ui-completion-types';
import { runPauseCreateOrReuse } from './application/use-cases/session/run-pause-create-or-reuse';
import { runPauseDismissCurrent } from './application/use-cases/session/run-pause-dismiss-current';
import type { LogCompanionFeedbackVoteInput } from './application/use-cases/ritual/frame/log-companion-feedback-vote';
import { runLogCompanionFeedbackVote } from './application/use-cases/ritual/frame/run-log-companion-feedback-vote';
import { runLogCompanionFullviewOpened } from './application/use-cases/ritual/frame/run-log-companion-fullview-opened';
import { logPauseCompanion as logPauseCompanionUseCase } from './application/use-cases/ritual/log/log-pause-companion';
import { runToggleCompanionLibraryFavorite } from './application/use-cases/ritual/frame/run-toggle-companion-library-favorite';
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
export {
  trackPauseOutcomeRetrospective,
  type PauseOutcomeRetrospectiveSurface,
} from './application/use-cases/archive/archive-retrospective-telemetry';
export { trackPauseSessionAbandoned } from './application/use-cases/session/pause-session-telemetry';
export {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from './application/use-cases/trigger/pending-pause-offer-telemetry';
export {
  trackHomePendingPauseBannerPauseOpened,
  trackPauseOpenDismissed,
  type OpenPauseStateForAnalytics,
  type PauseDismissAnalyticsSurface,
} from './application/use-cases/trigger/home-pause-actions-telemetry';
export {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseManualStarted,
  type PauseManualStartedSurface,
  type TrackManualPauseInstanceCreatedPayload,
  type TrackPauseManualCompletedPayload,
} from './application/use-cases/trigger/manual-pause-trigger-telemetry';
export {
  applyManualPauseOpenResult,
  type ApplyManualPauseOpenResultInput,
  type ManualPauseHomePreviewPorts,
} from './application/use-cases/trigger/apply-manual-pause-open-result';
export { buildManualPauseOpenParams } from './application/use-cases/trigger/build-manual-pause-open-params';

export type { RunReflectGenerationInput, ReflectGenerationResult };

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
    repository: supabasePauseRepository,
  });
}

export type { BulkHoldApplyResult };
export type { PostPauseFeelSnapshot };
export type { CompanionUiCompletionStep };
export type { RunAdoptPendingPauseOfferResult, RunDeclinePendingPauseOfferResult };
export type { RunPauseFavoriteToggleResult, RunPauseReflectTagUpdateResult };

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

export {
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from './application/use-cases/ritual/decide/outcome-toast';

export type {
  CompanionFeedbackVote,
  LogCompanionFeedbackVoteInput,
} from './application/use-cases/ritual/frame/log-companion-feedback-vote';
export type {
  CompanionFullviewKind,
  LogCompanionFullviewOpenedInput,
} from './application/use-cases/ritual/frame/log-companion-fullview-opened';
export type { LogPwaInstallAnalyticsEventInput } from './application/use-cases/home/run-log-pwa-install-analytics-event';

/** Companion feedback vote write — wired `PauseAnalyticsRepository.logCompanionFeedbackVote`. */
export function logPauseCompanionFeedbackVote(
  input: LogCompanionFeedbackVoteInput,
): Promise<{ ok: boolean }> {
  return runLogCompanionFeedbackVote(supabasePauseAnalyticsRepository, input);
}

/** Companion fullview open — wired `PauseAnalyticsRepository.insertEvent` (observation only). */
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

export type {
  CompanionSlotOrchestrateMode,
  RunCompanionSlotOrchestrateResult,
  RunCompanionInterventionBootstrapInput,
  RunCompanionInterventionBootstrapResult,
};

/** Lazy-fetch / regenerate `companion-orchestrate` — wired `CompanionOrchestrator` (presentation). */
export function invokeCompanionSlotOrchestrate(
  mode: CompanionSlotOrchestrateMode,
  slot: RegenerateCompanionSlot,
  session: CompanionOrchestrateSessionContext,
): Promise<RunCompanionSlotOrchestrateResult> {
  return runCompanionSlotOrchestrate(mode, slot, session, supabaseCompanionOrchestrator);
}

/** Frame intervention bootstrap — cache hydrate + idempotent `companion-orchestrate` invoke. */
export function runPauseCompanionInterventionBootstrap(
  input: RunCompanionInterventionBootstrapInput,
  loadOrchestrateSession: () => Promise<CompanionOrchestrateSessionContext | null>,
): Promise<RunCompanionInterventionBootstrapResult> {
  return runCompanionInterventionBootstrapUseCase(input, {
    fetchArtifactCache: fetchParsedPauseArtifactCache,
    loadOrchestrateSession,
    invokeIntervention: (session) => supabaseCompanionOrchestrator.invokeIntervention(session),
  });
}
/** Frame / companion UI — `pause_log_companion` via `PauseRepository` (wired for presentation). */
export function logPauseCompanion(params: {
  instanceId: string | null;
  companionType: string;
  action: PauseCompanionAction;
  entryPoint: string;
}): Promise<PauseLogCompanionResult> {
  return logPauseCompanionUseCase(supabasePauseRepository, params);
}

/** Companion slot heart — `pause_instances.metadata` via `PauseRepository` (wired for presentation). */
export function toggleCompanionLibraryFavorite(
  pauseInstanceId: string,
  sourceType: string,
  options?: {
    onBucketComputed?: (bucket: Record<string, boolean>) => void;
  },
): Promise<boolean> {
  return runToggleCompanionLibraryFavorite(supabasePauseRepository, {
    pauseInstanceId,
    sourceType,
    onBucketComputed: options?.onBucketComputed,
  });
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
