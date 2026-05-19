import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import {
  pauseAdoptPendingOffer,
  pauseCreateOrReuse,
  pauseDeclinePendingOffer,
  pauseDismissCurrent,
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
};
