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
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const elapsed = nowMs - new Date(lastTriggerAt).getTime();
  return Math.max(0, cooldownMs - elapsed);
}
