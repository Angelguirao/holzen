import { applyBulkHoldOutcomes } from '@/features/pause/application/use-cases/home/bulk-hold/apply-bulk-hold-outcomes';
import type { BulkHoldOutcomeChoice, BulkHoldPendingPause } from '@/features/pause/domain/bulk-hold';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/** Default port + use case: Home bulk-hold retrospective `outcome_logged` logs. */
export function pauseApplyBulkHoldOutcomes(
  rows: BulkHoldPendingPause[],
  resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice,
): ReturnType<typeof applyBulkHoldOutcomes> {
  return applyBulkHoldOutcomes(supabasePauseRepository, rows, resolver);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseApplyBulkHoldOutcomesWithRepository(
  repository: PauseRepository,
  rows: BulkHoldPendingPause[],
  resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice,
): ReturnType<typeof applyBulkHoldOutcomes> {
  return applyBulkHoldOutcomes(repository, rows, resolver);
}
