/**
 * Archived 7-day cumulative volatility helpers (pause-first strip, Jun 2026).
 * Active cron/UI uses daily thresholds only — see `../volatility-thresholds.ts`.
 * Mirror: `src/legacy/cumulative-threshold/`.
 */

/** Default 7-day cumulative % when profile value is unset (matches profiles default). */
export const DEFAULT_CUMULATIVE_THRESHOLD = 15;

/**
 * Effective cumulative threshold for gating. Null means cumulative auto-pause is off (0 or invalid).
 * Unset/null/undefined uses DEFAULT_CUMULATIVE_THRESHOLD.
 */
export function effectiveCumulativeThreshold(raw: unknown): number | null {
  if (raw == null || raw === "") return DEFAULT_CUMULATIVE_THRESHOLD;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_CUMULATIVE_THRESHOLD;
  if (n <= 0) return null;
  return n;
}

/** True when 7d cumulative move should count as “breached” for auto-pause / UI. */
export function isCumulativeMoveTriggered(
  cumulativeChangePercent: number | undefined,
  rawThreshold: unknown,
): boolean {
  const t = effectiveCumulativeThreshold(rawThreshold);
  if (t == null) return false;
  if (cumulativeChangePercent === undefined || !Number.isFinite(cumulativeChangePercent)) return false;
  return Math.abs(cumulativeChangePercent) >= t;
}

export type VolatilityThresholdProfileWithCumulative = {
  threshold?: number | null;
  threshold_down?: number | null;
  cumulative_threshold?: number | null;
};

export type VolatilityMoveMetricsWithCumulative = {
  changePercent: number;
  cumulativeChangePercent: number;
  direction: string;
};

/** True when daily or cumulative move exceeds the user's configured thresholds. */
export function isVolatilityThresholdBreachedWithCumulative(
  profile: VolatilityThresholdProfileWithCumulative,
  metrics: VolatilityMoveMetricsWithCumulative,
): boolean {
  const absChange = Math.abs(metrics.changePercent);
  const effectiveThreshold = metrics.direction === "down"
    ? (profile.threshold_down ?? profile.threshold ?? 5)
    : (profile.threshold ?? 5);
  const dailyTriggered = absChange >= effectiveThreshold;
  const cumulativeTriggered = isCumulativeMoveTriggered(
    metrics.cumulativeChangePercent,
    profile.cumulative_threshold,
  );
  return dailyTriggered || cumulativeTriggered;
}
