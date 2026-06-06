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

/** Latest moment the user can start another Home manual pause (auto + manual gates). */
export function computeIdleCooldownReadyAtMs(input: {
  profileLastTriggerAt: string | null;
  cooldownHours: number;
  manualCooldownRemainingMs: number;
  nowMs?: number;
}): number | null {
  const nowMs = input.nowMs ?? Date.now();
  const autoReadyAtMs = computeAutoCooldownReadyAtMs(
    input.profileLastTriggerAt,
    input.cooldownHours,
  );
  const manualReadyAtMs =
    input.manualCooldownRemainingMs > 0 ? nowMs + input.manualCooldownRemainingMs : null;

  const candidates = [autoReadyAtMs, manualReadyAtMs].filter(
    (readyAtMs): readyAtMs is number => readyAtMs != null && readyAtMs > nowMs,
  );
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}
