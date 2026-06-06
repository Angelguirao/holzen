/**
 * Archived 7-day cumulative volatility helpers — not imported by active pause-first code.
 * @see README.md
 */

export {
  DEFAULT_CUMULATIVE_THRESHOLD,
  effectiveCumulativeThreshold,
  isCumulativeMoveTriggered,
  isVolatilityThresholdBreachedWithCumulative as isVolatilityThresholdBreached,
  type VolatilityMoveMetricsWithCumulative as VolatilityMoveMetrics,
  type VolatilityThresholdProfileWithCumulative as VolatilityThresholdProfile,
} from '../../../../supabase/functions/_shared/legacy/volatility-thresholds-cumulative-legacy.ts';
