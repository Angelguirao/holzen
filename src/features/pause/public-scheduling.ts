/**
 * Pause scheduling pure helpers (cron quarter-hour math).
 * No Supabase — safe for presentation without loading pause RPC adapters.
 */
export {
  millisecondsUntilNextQuarterHour,
  PAUSE_CRON_QUARTER_INTERVAL_MS,
} from './application/use-cases/scheduling/milliseconds-until-next-quarter-hour';
