/** Milliseconds until the next quarter-hour boundary (:00, :15, :30, :45). */
export function millisecondsUntilNextQuarterHour(now: Date = new Date()): number {
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const msIntoQuarter = ((mins % 15) * 60 + secs) * 1000 + now.getMilliseconds();
  const quarterMs = 15 * 60 * 1000;
  return quarterMs - msIntoQuarter;
}

/** Matches {@link millisecondsUntilNextQuarterHour} cadence (Home pause scheduling UI). */
export const PAUSE_CRON_QUARTER_INTERVAL_MS = 15 * 60 * 1000;
