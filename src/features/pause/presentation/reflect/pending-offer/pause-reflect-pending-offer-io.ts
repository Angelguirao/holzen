/**
 * Presentation I/O for pending pause offer RPC + display copy.
 * Imports adopt/decline use cases and display helpers via `pause-reflect-pending-offer-flow`
 * CI anchor (`presentation/reflect/pending-offer/` cluster).
 */
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
};

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
