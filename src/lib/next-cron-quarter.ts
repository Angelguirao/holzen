/** Milliseconds until the next quarter-hour boundary (:00, :15, :30, :45). */
export function millisecondsUntilNextQuarterHour(): number {
  const now = new Date();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const msIntoQuarter = ((mins % 15) * 60 + secs) * 1000 + now.getMilliseconds();
  const quarterMs = 15 * 60 * 1000;
  return quarterMs - msIntoQuarter;
}
