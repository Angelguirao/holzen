/**
 * Pause RPC mutations (loads Supabase client). Import from here in hooks/tests —
 * not from `public.ts`, which stays free of infrastructure side effects.
 */
export type {
  PauseAdoptPendingResult,
  PauseCreateOrReuseResult,
  PauseLogCompanionResult,
} from './infrastructure/pause-rpc-client';
export type { OpenManualPauseFromHomeResult } from './application/use-cases/trigger/open-manual-pause-from-home';

export { ritualDepthUpgradedPayload } from './application/use-cases/ritual/brief/ritual-depth-upgrade';
export { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
export {
  createCompanionSlotOrchestratePorts,
  invokeCompanionIntervention,
  invokeCompanionOrchestrate,
} from './infrastructure/edge/companion-orchestrate-edge';
export {
  invokeGroundingEnrich,
  type GroundingEnrichBody,
  type GroundingEnrichment,
} from './infrastructure/edge/grounding-enrich-edge';
export { invokeHolzenReflect, type HolzenReflectResponse } from './infrastructure/edge/reflect/holzen-reflect-edge';

import { logRetrospectiveOutcome as logRetrospectiveOutcomeUseCase } from './application/use-cases/archive/log-retrospective-outcome';
import { logPauseRitualDepthUpgraded as logPauseRitualDepthUpgradedUseCase } from './application/use-cases/ritual/brief/ritual-depth-upgrade';
import {
  applyBulkHoldOutcomes as applyBulkHoldOutcomesUseCase,
  type BulkHoldApplyResult,
} from './application/use-cases/apply-bulk-hold-outcomes';
import { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
import { openManualPauseFromHome as openManualPauseFromHomeUseCase } from './application/use-cases/trigger/open-manual-pause-from-home';
import { persistReflectionArtifacts } from './infrastructure/edge/reflect/reflection-artifact';
import type { OpenManualPauseFromHomeParams } from './application/use-cases/trigger/open-manual-pause-from-home';
import type { TFunction } from 'i18next';
import type { BulkHoldOutcomeChoice, BulkHoldPendingPause } from './domain/bulk-hold';
import type { PauseCompanionAction, PauseState, PauseStepType } from './domain/pause-state';
import {
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
} from './application/use-cases/ritual/done/post-pause-emotion-log';
import type { MoodValue } from './domain/mood-value';
import {
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
} from './application/use-cases/ritual/reflect/run-pause-reflect-metadata-log';
import { runPauseFavoriteToggle } from './application/use-cases/ritual/reflect/run-pause-favorite-toggle';
import { runPauseReflectionStepLogOnce } from './application/use-cases/ritual/reflect/run-pause-reflection-step-log';
import { runPauseOutcomeLog } from './application/use-cases/ritual/decide/run-pause-outcome-log';
import { reflectionStepSessionStorage } from './infrastructure/edge/reflect/reflection-step-session-storage';
import { invalidateCompanionUiCompletionQuery } from './application/queries/companion-ui-completion-query-key';
import {
  runEnsureBreathSegment1Logged,
  runEnsureBreathSegment2Logged,
  runLogBreathSegment1Skipped,
  runLogBreathSegment2Skipped,
  type RunBreathSegmentLogResult,
} from './application/use-cases/breathing/run-breath-segment-log';
import {
  runInitialEmotionSelect as runInitialEmotionSelectUseCase,
  runInitialEmotionSkip as runInitialEmotionSkipUseCase,
  type InitialEmotionUiState,
  type RunInitialEmotionSelectResult,
  type RunInitialEmotionSkipResult,
} from './application/use-cases/ritual/feel/run-initial-emotion-log';
import {
  runShiftEmotionFrameHubDone as runShiftEmotionFrameHubDoneUseCase,
  type RunShiftEmotionFrameHubDoneResult,
} from './application/use-cases/ritual/feel/shift-emotion-log';
import type { InitialEmotionLogOpts } from './application/use-cases/ritual/feel/initial-emotion-log';

/** Lifecycle + step mutations — default port is `PauseRepository`, not raw RPC client. */

export function pauseCreateOrReuse(
  params: Parameters<typeof supabasePauseRepository.createOrReuse>[0],
) {
  return supabasePauseRepository.createOrReuse(params);
}

export function pauseAdoptPendingOffer() {
  return supabasePauseRepository.adoptPendingOffer();
}

export function pauseDeclinePendingOffer() {
  return supabasePauseRepository.declinePendingOffer();
}

export function pauseDismissCurrent() {
  return supabasePauseRepository.dismissCurrent();
}

export function pauseLogStep(
  params: Parameters<typeof supabasePauseRepository.logStep>[0],
) {
  return supabasePauseRepository.logStep(params);
}

export function pauseLogCompanion(params: {
  instanceId: string | null;
  companionType: string;
  action: PauseCompanionAction;
  entryPoint: string;
}) {
  return supabasePauseRepository.logCompanion(params);
}

function repositoryLogStep(
  instanceId: string,
  stepType: PauseStepType,
  payload?: Record<string, unknown>,
) {
  return supabasePauseRepository.logStep({ instanceId, stepType, payload });
}

export type { BulkHoldApplyResult };
export type { PostPauseFeelSnapshot };
export type {
  InitialEmotionUiState,
  RunInitialEmotionSelectResult,
  RunInitialEmotionSkipResult,
  RunShiftEmotionFrameHubDoneResult,
};
export type { InitialEmotionLogOpts };
export type { RunBreathSegmentLogResult };

/** Home manual trigger — `pause_create_or_reuse` (+ silent reflection stub). */
export function openManualPauseFromHome(params: OpenManualPauseFromHomeParams) {
  return openManualPauseFromHomeUseCase(
    { createOrReuse: supabasePauseRepository.createOrReuse, persistReflectionArtifacts },
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

/** Reflect heart — `favorite_toggled` step. */
export function logPauseFavoriteToggle(params: {
  pauseInstanceId: string | null;
  isFavorite: boolean;
}) {
  return runPauseFavoriteToggle(supabasePauseRepository, params);
}

/** Reflect progression — `reflection_step` once per instance (sessionStorage dedupe). */
export function logPauseReflectionStepOnce(pauseInstanceId: string) {
  return runPauseReflectionStepLogOnce(
    supabasePauseRepository,
    { pauseInstanceId },
    { storage: reflectionStepSessionStorage },
  );
}

/** Reflect post-it note — `note_updated` step. */
export function logPauseReflectNote(params: { pauseInstanceId: string; text: string }) {
  return runPauseReflectNoteUpdate(supabasePauseRepository, params);
}

/** Reflect tags editor — `tag_updated` step. */
export function logPauseReflectTags(params: { pauseInstanceId: string; tags: string[] }) {
  return runPauseReflectTagUpdate(supabasePauseRepository, params);
}

/** Feel step mood select — wired with default `PauseRepository`. */
export function runInitialEmotionSelect(
  input: Parameters<typeof runInitialEmotionSelectUseCase>[1],
): Promise<RunInitialEmotionSelectResult> {
  return runInitialEmotionSelectUseCase(supabasePauseRepository, input);
}

/** Feel step skip — wired with default `PauseRepository`. */
export function runInitialEmotionSkip(
  input: Parameters<typeof runInitialEmotionSkipUseCase>[1],
): Promise<RunInitialEmotionSkipResult> {
  return runInitialEmotionSkipUseCase(supabasePauseRepository, input);
}

/** Frame hub “I'm done” shift emotion — wired with default `PauseRepository`. */
export function runShiftEmotionFrameHubDone(
  input: Parameters<typeof runShiftEmotionFrameHubDoneUseCase>[1],
): Promise<RunShiftEmotionFrameHubDoneResult> {
  return runShiftEmotionFrameHubDoneUseCase(supabasePauseRepository, input);
}

/** Decide step — `outcome_logged` via repository port (wired for presentation). */
export function logPauseOutcome(params: {
  pauseInstanceId: string | null;
  decision: string;
}) {
  return runPauseOutcomeLog(supabasePauseRepository, params);
}

/** Low-level `outcome_logged` step — prefer `logPauseOutcome` for decide flow. */
export function logPauseOutcomeStep(params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) {
  return repositoryLogStep(params.instanceId, 'outcome_logged', params.payload);
}

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
