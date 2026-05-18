/**
 * Pause RPC mutations (loads Supabase client). Import from here in hooks/tests —
 * not from `public.ts`, which stays free of infrastructure side effects.
 */
export {
  pauseAdoptPendingOffer,
  pauseCreateOrReuse,
  pauseDeclinePendingOffer,
  pauseDismissCurrent,
  pauseLogCompanion,
  pauseLogStep,
  type PauseAdoptPendingResult,
  type PauseCreateOrReuseResult,
  type PauseLogCompanionResult,
} from './infrastructure/pause-rpc-client';
