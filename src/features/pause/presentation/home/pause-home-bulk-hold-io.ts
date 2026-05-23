/**
 * Home bulk-hold sheet RPC I/O — binds `apply-bulk-hold-outcomes` (ritual/decide) to `PauseRepository`.
 * Parity pins (colocated): `pause-home-bulk-hold-io-parity.test.ts`; application mirror:
 * `application/use-cases/ritual/decide/pause-home-bulk-hold-io-parity.test.ts`.
 */
import { applyBulkHoldOutcomes } from '@/features/pause/application/use-cases/ritual/decide/apply-bulk-hold-outcomes';
import type { BulkHoldOutcomeChoice, BulkHoldPendingPause } from '@/features/pause/domain/bulk-hold';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/** Default `PauseRepository` for Home bulk-hold presentation hooks. */
export const homeBulkHoldPauseRepository = supabasePauseRepository;

/** Default port + use case: Home bulk-hold retrospective `outcome_logged` logs. */
export function pauseApplyBulkHoldOutcomes(
  rows: BulkHoldPendingPause[],
  resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice,
): ReturnType<typeof applyBulkHoldOutcomes> {
  return applyBulkHoldOutcomes(homeBulkHoldPauseRepository, rows, resolver);
}

/** Test seam: inject a custom `PauseRepository`. */
export function pauseApplyBulkHoldOutcomesWithRepository(
  repository: PauseRepository,
  rows: BulkHoldPendingPause[],
  resolver: (p: BulkHoldPendingPause) => BulkHoldOutcomeChoice,
): ReturnType<typeof applyBulkHoldOutcomes> {
  return applyBulkHoldOutcomes(repository, rows, resolver);
}
