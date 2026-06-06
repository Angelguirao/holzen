/** Milliseconds until the next top-of-hour boundary (:00). Matches `check-volatility` pg_cron. */
export function millisecondsUntilNextVolatilityCheck(now: Date = new Date()): number {
  const msIntoHour =
    (now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
  const hourMs = 60 * 60 * 1000;
  return hourMs - msIntoHour;
}

/** Matches {@link millisecondsUntilNextVolatilityCheck} cadence (Home pause scheduling UI). */
export const PAUSE_CRON_CHECK_VOLATILITY_INTERVAL_MS = 60 * 60 * 1000;
