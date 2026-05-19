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

export type { BulkHoldApplyResult };

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
