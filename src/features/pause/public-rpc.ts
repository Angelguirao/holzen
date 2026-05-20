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
import { runPauseReflectionStepLogOnce } from './application/use-cases/reflect/run-pause-reflection-step-log';
import { reflectionStepSessionStorage } from './infrastructure/reflect/reflection-step-session-storage';

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
