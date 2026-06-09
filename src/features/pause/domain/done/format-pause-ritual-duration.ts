/** Formats elapsed ritual time for Done summary (e.g. "10 min 23 sec"). */
export function formatPauseRitualDurationMs(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return `${sec} sec`;
  if (sec <= 0) return `${min} min`;
  return `${min} min ${sec} sec`;
}
