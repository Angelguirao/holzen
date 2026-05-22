/**
 * Presentation I/O for pending pause offer RPC + display copy.
 * Imports adopt/decline via `pause-reflect-pending-offer-rpc-flow` and display via
 * `pause-pending-offer-display-flow` (parity with hub/steps I/O subcluster peels).
 */
import {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow';
import {
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-rpc-flow';
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
