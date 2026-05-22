import type { PauseRepository } from '@/features/pause/ports/pause-repository';

export type RunAdoptPendingPauseOfferResult =
  | { status: 'ok'; instanceId: string }
  | { status: 'failed' };

/** Adopt the queued pending pause offer via `PauseRepository.adoptPendingOffer`. */
export async function runAdoptPendingPauseOffer(
  repository: PauseRepository,
): Promise<RunAdoptPendingPauseOfferResult> {
  const result = await repository.adoptPendingOffer();
  if (!result.ok || !result.instance_id) {
    return { status: 'failed' };
  }
  return { status: 'ok', instanceId: result.instance_id };
}
