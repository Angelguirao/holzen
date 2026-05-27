import { useEffect, useState } from 'react';

/** Live countdown label for an active snooze end time (updates on an interval). */
export function useSnoozeTimeLabel(snoozedUntil: Date | null | undefined, active: boolean): string {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !snoozedUntil) return;
    setNowMs(Date.now());
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [active, snoozedUntil]);

  if (!active || !snoozedUntil) return '';

  const remaining = Math.max(0, snoozedUntil.getTime() - nowMs);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
