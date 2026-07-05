import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getHolzenNumberQueryOptions } from '@/features/user/public-queries';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';
import { hasPausingNowStat } from '@/legacy/holzen-pausing-now/has-pausing-now-stat';

function CommunityStatLine({ percent, label }: { percent: number; label: string }) {
  return (
    <p className={cn(homeInWidget.meta, 'text-right leading-4 tracking-wide')}>
      <span className="font-medium tabular-nums text-foreground">{percent}%</span> {label}
    </p>
  );
}

/**
 * Archived Home market footer lines for live “pausing now” (Figma 3.4.4.2 mid-pause copy included).
 * Active surface: {@link HomeMarketCommunityStats} — paused-today only.
 */
export function HomeMarketPausingNowStats({ pauseInProgress = false }: { pauseInProgress?: boolean }) {
  "use memo";
  const { t } = useTranslation();
  const { data, isPending } = useQuery(getHolzenNumberQueryOptions());

  if (isPending || !data || !hasPausingNowStat(data)) return null;

  if (pauseInProgress) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5">
        <CommunityStatLine
          percent={data.percent_pausing_now}
          label={t('holzenNumber.pausingNowToo', { defaultValue: 'are pausing now, too' })}
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5">
      <CommunityStatLine
        percent={data.percent_pausing_now}
        label={t('holzenNumber.pausingNow', { defaultValue: 'of users pausing now' })}
      />
    </div>
  );
}
