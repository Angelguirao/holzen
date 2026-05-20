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

export { ritualDepthUpgradedPayload } from './application/use-cases/session/ritual-depth-upgrade';
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
import { logPauseRitualDepthUpgraded as logPauseRitualDepthUpgradedUseCase } from './application/use-cases/session/ritual-depth-upgrade';
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
} from './application/use-cases/session/post-pause-emotion-log';
import type { MoodValue } from './domain/mood-value';
import {
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
} from './application/use-cases/ritual/reflect/run-pause-reflect-metadata-log';
import { runPauseFavoriteToggle } from './application/use-cases/ritual/reflect/run-pause-favorite-toggle';
import { runPauseReflectionStepLogOnce } from './application/use-cases/ritual/reflect/run-pause-reflection-step-log';
import { reflectionStepSessionStorage } from './infrastructure/edge/reflect/reflection-step-session-storage';
import { invalidateCompanionUiCompletionQuery } from './application/queries/companion-ui-completion-query-key';
import type { BreathSegmentLogPorts } from './application/use-cases/breathing/run-breath-segment-log';

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
    { pauseInstanceId },
    {
      storage: reflectionStepSessionStorage,
      logStep: ({ instanceId, payload }) =>
        repositoryLogStep(instanceId, 'reflection_step', payload),
    },
  );
}

/** Reflect post-it note — `note_updated` step. */
export function logPauseReflectNote(params: { pauseInstanceId: string; text: string }) {
  return runPauseReflectNoteUpdate(params, {
    logStep: ({ instanceId, stepType, payload }) =>
      repositoryLogStep(instanceId, stepType, payload),
  });
}

/** Reflect tags editor — `tag_updated` step. */
export function logPauseReflectTags(params: { pauseInstanceId: string; tags: string[] }) {
  return runPauseReflectTagUpdate(params, {
    logStep: ({ instanceId, stepType, payload }) =>
      repositoryLogStep(instanceId, stepType, payload),
  });
}

/** Feel step — `initial_emotion_logged` RPC (wired for screen hooks). */
export function logInitialEmotionStep(params: {
  instanceId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  return repositoryLogStep(
    params.instanceId,
    'initial_emotion_logged',
    params.payload,
  ).then(() => undefined);
}

/** Frame hub shift — `shift_emotion_logged` RPC (wired for screen hooks). */
export function logShiftEmotionStep(params: {
  instanceId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  return repositoryLogStep(
    params.instanceId,
    'shift_emotion_logged',
    params.payload,
  ).then(() => undefined);
}

/** Decide step — `outcome_logged` RPC (wired for screen hooks). */
export function logPauseOutcomeStep(params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) {
  return repositoryLogStep(params.instanceId, 'outcome_logged', params.payload);
}

const logBreathCompletedStep = (params: { instanceId: string; payload: Record<string, unknown> }) =>
  repositoryLogStep(params.instanceId, 'breath_completed', params.payload).then(() => undefined);

/** Breath segment log ports — use with `runEnsureBreathSegment*Logged` from `public`. */
export const pauseBreathSegmentLogPorts: BreathSegmentLogPorts = {
  logStep: logBreathCompletedStep,
  invalidateCompanionCompletion: invalidateCompanionUiCompletionQuery,
};

/** Brief done save — `post_pause_emotion_logged` when check-in differs from ritual snapshot. */
export function logPostPauseEmotionIfDirty(params: {
  pauseInstanceId: string | null;
  mood: MoodValue | null;
  intensity: number;
  initialSnapshot: PostPauseFeelSnapshot | null;
}) {
  return runPostPauseEmotionLogIfDirty(params, {
    logStep: ({ instanceId, payload }) =>
      repositoryLogStep(instanceId, 'post_pause_emotion_logged', payload).then(() => undefined),
  });
}
