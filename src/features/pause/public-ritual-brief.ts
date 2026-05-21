/**
 * Brief ritual pure helpers (integrate timer constants and ring math).
 * No Supabase — safe for presentation and screens without loading pause RPC adapters.
 */
export {
  BRIEF_INTEGRATE_RING_CIRC,
  BRIEF_INTEGRATE_RING_R,
  BRIEF_INTEGRATE_SECONDS,
  briefIntegrateRemainingProgress,
  briefIntegrateRingDashOffset,
} from './application/use-cases/ritual/brief/brief-integrate-timer';
