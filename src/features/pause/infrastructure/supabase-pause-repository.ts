import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { toggleCompanionSlotFavoriteOnInstance } from '@/features/pause/infrastructure/pause-instance-metadata-client';
import {
  pauseAdoptPendingOffer,
  pauseApplyCronCalmSweepForSelf,
  pauseCreateOrReuse,
  pauseDeclinePendingOffer,
  pauseDismissCurrent,
  pauseEvaluateTransitions,
  pauseLogCompanion,
  pauseLogStep,
} from '@/features/pause/infrastructure/pause-rpc-client';

/** Default `PauseRepository` — Supabase RPC adapters in `pause-rpc-client.ts`. */
export const supabasePauseRepository: PauseRepository = {
  createOrReuse: pauseCreateOrReuse,
  adoptPendingOffer: pauseAdoptPendingOffer,
  declinePendingOffer: pauseDeclinePendingOffer,
  logStep: pauseLogStep,
  logCompanion: pauseLogCompanion,
  dismissCurrent: pauseDismissCurrent,
  applyCronCalmSweepForSelf: pauseApplyCronCalmSweepForSelf,
  evaluateTransitions: pauseEvaluateTransitions,
  toggleCompanionSlotFavorite: toggleCompanionSlotFavoriteOnInstance,
};
