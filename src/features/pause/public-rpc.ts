/**
 * Pause RPC mutations (loads Supabase client). Import from here in hooks/tests —
 * not from `public.ts`, which stays free of infrastructure side effects.
 */
export {
  pauseAdoptPendingOffer,
  pauseCreateOrReuse,
  pauseDeclinePendingOffer,
  pauseDismissCurrent,
  pauseLogCompanion,
  pauseLogStep,
  type PauseAdoptPendingResult,
  type PauseCreateOrReuseResult,
  type PauseLogCompanionResult,
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
export { invokeHolzenReflect, type HolzenReflectResponse } from './infrastructure/edge/holzen-reflect-edge';

import { logRetrospectiveOutcome as logRetrospectiveOutcomeUseCase } from './application/use-cases/archive/log-retrospective-outcome';
import { logPauseRitualDepthUpgraded as logPauseRitualDepthUpgradedUseCase } from './application/use-cases/session/ritual-depth-upgrade';
import {
  applyBulkHoldOutcomes as applyBulkHoldOutcomesUseCase,
  type BulkHoldApplyResult,
} from './application/use-cases/apply-bulk-hold-outcomes';
import { supabasePauseRepository } from './infrastructure/supabase-pause-repository';
import { openManualPauseFromHome as openManualPauseFromHomeUseCase } from './application/use-cases/trigger/open-manual-pause-from-home';
import { persistReflectionArtifacts } from './infrastructure/reflect/reflection-artifact';
import { pauseCreateOrReuse } from './infrastructure/pause-rpc-client';
import type { OpenManualPauseFromHomeParams } from './application/use-cases/trigger/open-manual-pause-from-home';
import type { TFunction } from 'i18next';
import type { BulkHoldOutcomeChoice, BulkHoldPendingPause } from './domain/bulk-hold';
import type { PauseState } from './domain/pause-state';
import {
  runPostPauseEmotionLogIfDirty,
  type PostPauseFeelSnapshot,
} from './application/use-cases/session/post-pause-emotion-log';
import type { MoodValue } from './domain/mood-value';
import { pauseLogStep } from './infrastructure/pause-rpc-client';
import {
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
} from './application/use-cases/reflect/run-pause-reflect-metadata-log';
import { runPauseFavoriteToggle } from './application/use-cases/reflect/run-pause-favorite-toggle';
import { runPauseReflectionStepLogOnce } from './application/use-cases/ritual/reflect/run-pause-reflection-step-log';
import { reflectionStepSessionStorage } from './infrastructure/reflect/reflection-step-session-storage';
import { invalidateCompanionUiCompletionQuery } from './application/queries/companion-ui-completion-query-key';
import type { BreathSegmentLogPorts } from './application/use-cases/breathing/run-breath-segment-log';

export type { BulkHoldApplyResult };
export type { PostPauseFeelSnapshot };

/** Home manual trigger — `pause_create_or_reuse` (+ silent reflection stub). */
export function openManualPauseFromHome(params: OpenManualPauseFromHomeParams) {
  return openManualPauseFromHomeUseCase(
    { createOrReuse: pauseCreateOrReuse, persistReflectionArtifacts },
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
export function logPauseFavoriteToggle(params: { pauseInstanceId: string; isFavorite: boolean }) {
  return runPauseFavoriteToggle(params, {
    logStep: ({ instanceId, payload }) =>
      pauseLogStep({ instanceId, stepType: 'favorite_toggled', payload }),
  });
}

/** Reflect progression — `reflection_step` once per instance (sessionStorage dedupe). */
export function logPauseReflectionStepOnce(pauseInstanceId: string) {
  return runPauseReflectionStepLogOnce(
    { pauseInstanceId },
    {
      storage: reflectionStepSessionStorage,
      logStep: ({ instanceId, payload }) =>
        pauseLogStep({ instanceId, stepType: 'reflection_step', payload }),
    },
  );
}

/** Reflect post-it note — `note_updated` step. */
export function logPauseReflectNote(params: { pauseInstanceId: string; text: string }) {
  return runPauseReflectNoteUpdate(params, {
    logStep: ({ instanceId, stepType, payload }) =>
      pauseLogStep({ instanceId, stepType, payload }),
  });
}

/** Reflect tags editor — `tag_updated` step. */
export function logPauseReflectTags(params: { pauseInstanceId: string; tags: string[] }) {
  return runPauseReflectTagUpdate(params, {
    logStep: ({ instanceId, stepType, payload }) =>
      pauseLogStep({ instanceId, stepType, payload }),
  });
}

/** Feel step — `initial_emotion_logged` RPC (wired for screen hooks). */
export function logInitialEmotionStep(params: {
  instanceId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  return pauseLogStep({
    instanceId: params.instanceId,
    stepType: 'initial_emotion_logged',
    payload: params.payload,
  }).then(() => undefined);
}

/** Frame hub shift — `shift_emotion_logged` RPC (wired for screen hooks). */
export function logShiftEmotionStep(params: {
  instanceId: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  return pauseLogStep({
    instanceId: params.instanceId,
    stepType: 'shift_emotion_logged',
    payload: params.payload,
  }).then(() => undefined);
}

/** Decide step — `outcome_logged` RPC (wired for screen hooks). */
export function logPauseOutcomeStep(params: {
  instanceId: string;
  payload: Record<string, unknown>;
}) {
  return pauseLogStep({
    instanceId: params.instanceId,
    stepType: 'outcome_logged',
    payload: params.payload,
  });
}

const logBreathCompletedStep = (params: { instanceId: string; payload: Record<string, unknown> }) =>
  pauseLogStep({
    instanceId: params.instanceId,
    stepType: 'breath_completed',
    payload: params.payload,
  }).then(() => undefined);

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
      pauseLogStep({
        instanceId,
        stepType: 'post_pause_emotion_logged',
        payload,
      }).then(() => undefined),
  });
}
