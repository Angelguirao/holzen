import { PAUSE_OPEN_MAX_AGE_MS } from '@/features/pause/domain/pause-open-max-age';

export { PAUSE_OPEN_MAX_AGE_MS };

export function pauseOpenMaxDeadlineMs(anchorIso: string): number {
  return new Date(anchorIso).getTime() + PAUSE_OPEN_MAX_AGE_MS;
}

/** Compact remaining string for UI (no i18n — wrap with t() at call site if needed). */
export function formatPauseOpenMaxRemaining(deadlineMs: number, nowMs: number): string {
  const ms = Math.max(0, deadlineMs - nowMs);
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (totalMin > 0) return `${totalMin}m`;
  const s = Math.floor(ms / 1000);
  return `${s}s`;
}
