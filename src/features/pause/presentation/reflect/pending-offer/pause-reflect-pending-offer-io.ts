/**
 * Presentation I/O for pending pause offer RPC + display copy.
 * Imports adopt/decline and display from leaf modules directly (parity with
 * `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io` → pending-offer telemetry leaf trackers).
 * Parity pins: `pause-reflect-pending-offer-io.test.ts` (wrapper distinctness + repository delegation),
 * `pause-reflect-pending-offer-io-parity.test.ts` (flow umbrella + application layer).
 * Sibling parity: `pause-reflect-generation-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-generation-io`;
 * `pause-reflect-hub-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-hub-io`;
 * `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-flows-io`;
 * `pause-reflect-share-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-share-io`;
 * `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts` ↔ `pause-reflect-pending-offer-telemetry-io`,
 * `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts` ↔ `pause-reflect-steps-io`.
 */
import {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display';
import { runAdoptPendingPauseOffer } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
};

/** Default `PauseRepository` for pending-offer presentation hooks. */
export const reflectPauseRepository = supabasePauseRepository;

/** Default port + use case: adopt the pending pause offer. */
export function pauseAdoptPendingOffer(): ReturnType<typeof runAdoptPendingPauseOffer> {
  return runAdoptPendingPauseOffer(reflectPauseRepository);
}

/** Default port + use case: decline the pending pause offer. */
export function pauseDeclinePendingOffer(): ReturnType<typeof runDeclinePendingPauseOffer> {
  return runDeclinePendingPauseOffer(reflectPauseRepository);
}

/** Test seam: inject a custom `PauseRepository` for adopt (parity: `pause-reflect-pending-offer-io-parity.test.ts`). */
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
