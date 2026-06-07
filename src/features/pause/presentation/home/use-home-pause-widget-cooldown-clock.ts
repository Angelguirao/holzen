import { useEffect, useMemo, useState } from 'react';

/** 1s tick so manual cooldown labels update without polling TanStack Query. */
export function useHomePauseWidgetCooldownClock(
  manualCooldownRemaining: () => number,
): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(
    () => manualCooldownRemaining(),
    [manualCooldownRemaining, nowMs],
  );
}
