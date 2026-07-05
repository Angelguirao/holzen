export type VolatilityThresholdProfile = {
  threshold?: number | null;
  threshold_down?: number | null;
};

export type VolatilityMoveMetrics = {
  changePercent: number;
  direction: string;
};

/** True when daily move exceeds the user's configured up/down thresholds. */
export function isVolatilityThresholdBreached(
  profile: VolatilityThresholdProfile,
  metrics: VolatilityMoveMetrics,
): boolean {
  const absChange = Math.abs(metrics.changePercent);
  const effectiveThreshold = metrics.direction === "down"
    ? (profile.threshold_down ?? profile.threshold ?? 5)
    : (profile.threshold ?? 5);
  return absChange >= effectiveThreshold;
}
