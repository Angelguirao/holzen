import { getManualReflectionCooldownMs } from '@/features/market/public';

/** Remaining ms before another Home manual “Need a moment” is allowed. */
export function computeManualCooldownRemainingMs(
  lastManualAt: number | null,
  nowMs: number = Date.now(),
): number {
  if (!lastManualAt) return 0;
  const elapsed = nowMs - lastManualAt;
  return Math.max(0, getManualReflectionCooldownMs() - elapsed);
}

/** Wall-clock moment when the manual “Let’s pause” cooldown ends. */
export function computeManualCooldownReadyAtMs(
  manualCooldownRemainingMs: number,
  nowMs: number = Date.now(),
): number | null {
  if (manualCooldownRemainingMs <= 0) return null;
  return nowMs + manualCooldownRemainingMs;
}
