import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
} from '@/features/pause/public-session';

type Props = {
  anchorIso: string;
  /** Re-tick interval in ms (default 30s). */
  tickMs?: number;
  className?: string;
  countdownTranslationKey?: string;
  countdownTranslationDefault?: string;
};

/**
 * Shows time remaining until `open_max_age` (12h after the open-max anchor).
 * Only mount when the pause is **engaged** and an anchor is known.
 */
export function PauseEngagedOpenMaxCountdown({
  anchorIso,
  tickMs = 30_000,
  className,
  countdownTranslationKey = 'pause.openMaxCountdown',
  countdownTranslationDefault = '{{remaining}} left in this ritual window',
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  const deadline = pauseOpenMaxDeadlineMs(anchorIso);
  const remaining = formatPauseOpenMaxRemaining(deadline, now);

  return (
    <p className={className ?? 'text-center text-[11px] font-mono tabular-nums text-muted-foreground'}>
      {t(countdownTranslationKey, {
        defaultValue: countdownTranslationDefault,
        remaining,
      })}
    </p>
  );
}
