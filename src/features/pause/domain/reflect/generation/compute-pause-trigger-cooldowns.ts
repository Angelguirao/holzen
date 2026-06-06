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

/** Remaining ms before cron/auto pause can fire again (profile `cooldown_hours`). */
export function computeAutoCooldownRemainingMs(
  lastTriggerAt: string | null,
  cooldownHours: number,
  nowMs: number = Date.now(),
): number {
  if (!lastTriggerAt) return 0;
  const readyAtMs = computeAutoCooldownReadyAtMs(lastTriggerAt, cooldownHours);
  if (readyAtMs == null) return 0;
  return Math.max(0, readyAtMs - nowMs);
}

/** Wall-clock moment when profile auto cooldown ends (for Home D copy). */
export function computeAutoCooldownReadyAtMs(
  lastTriggerAt: string | null,
  cooldownHours: number,
): number | null {
  if (!lastTriggerAt) return null;
  return new Date(lastTriggerAt).getTime() + cooldownHours * 60 * 60 * 1000;
}

/** Wall-clock moment when the manual “Let’s pause” cooldown ends. */
export function computeManualCooldownReadyAtMs(
  manualCooldownRemainingMs: number,
  nowMs: number = Date.now(),
): number | null {
  if (manualCooldownRemainingMs <= 0) return null;
  return nowMs + manualCooldownRemainingMs;
}
