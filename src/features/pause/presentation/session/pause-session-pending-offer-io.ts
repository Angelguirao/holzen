/**
 * Presentation I/O for pending pause offer adopt/decline RPC.
 * Imports pending-offer use cases directly instead of `pause-session-pending-offer-flow` CI anchor.
 */
import { runAdoptPendingPauseOffer } from '@/features/pause/application/use-cases/session/pending-offer/run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer } from '@/features/pause/application/use-cases/session/pending-offer/run-decline-pending-pause-offer';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/** Default port + use case: adopt the pending pause offer. */
export function pauseAdoptPendingOffer(): ReturnType<typeof runAdoptPendingPauseOffer> {
  return runAdoptPendingPauseOffer(supabasePauseRepository);
}

/** Default port + use case: decline the pending pause offer. */
export function pauseDeclinePendingOffer(): ReturnType<typeof runDeclinePendingPauseOffer> {
  return runDeclinePendingPauseOffer(supabasePauseRepository);
}

/** Test seam: inject a custom `PauseRepository` for adopt. */
export function pauseAdoptPendingOfferWithRepository(
  repository: PauseRepository,
): ReturnType<typeof runAdoptPendingPauseOffer> {
  return runAdoptPendingPauseOffer(repository);
}

/** Test seam: inject a custom `PauseRepository` for decline. */
export function pauseDeclinePendingOfferWithRepository(
  repository: PauseRepository,
): ReturnType<typeof runDeclinePendingPauseOffer> {
  return runDeclinePendingPauseOffer(repository);
}
