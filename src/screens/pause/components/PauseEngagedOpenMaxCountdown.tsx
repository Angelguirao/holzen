import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatPauseOpenMaxRemaining,
  pauseOpenMaxDeadlineMs,
} from '@/features/pause/public-hooks';

type Props = {
  engagedAtIso: string;
  /** Re-tick interval in ms (default 30s). */
  tickMs?: number;
  className?: string;
};

/**
 * Shows time remaining until `open_max_age` (12h after `engaged_at`).
 * Only mount when the pause is **engaged** and `engaged_at` is known.
 */
export function PauseEngagedOpenMaxCountdown({ engagedAtIso, tickMs = 30_000, className }: Props) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  const deadline = pauseOpenMaxDeadlineMs(engagedAtIso);
  const remaining = formatPauseOpenMaxRemaining(deadline, now);

  return (
    <p className={className ?? 'text-center text-[11px] font-mono tabular-nums text-muted-foreground'}>
      {t('pause.openMaxCountdown', {
        defaultValue: '{{remaining}} left in this ritual window',
        remaining,
      })}
    </p>
  );
}
