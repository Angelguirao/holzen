import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type RunDeclinePendingPauseOfferResult = { status: 'ok' } | { status: 'failed' };

/** Decline the queued pending pause offer via `PauseRepository.declinePendingOffer`. */
export async function runDeclinePendingPauseOffer(
  repository: PauseRepository,
): Promise<RunDeclinePendingPauseOfferResult> {
  try {
    await repository.declinePendingOffer();
    return { status: 'ok' };
  } catch {
    return { status: 'failed' };
  }
}
