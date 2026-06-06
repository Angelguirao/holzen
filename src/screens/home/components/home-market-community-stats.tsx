import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getHolzenNumberQueryOptions } from '@/features/user/public-queries';
import type { HolzenNumberData } from '@/features/user/infrastructure/edge/holzen-number-edge';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

function hasPausingNowStat(data: HolzenNumberData): boolean {
  return data.users_pausing_now > 0 || data.percent_pausing_now > 0;
}

function hasPausedTodayStat(data: HolzenNumberData): boolean {
  return data.users_paused_today > 0 || data.percent_paused_today > 0;
}

function CommunityStatLine({
  percent,
  label,
}: {
  percent: number;
  label: string;
}) {
  return (
    <p className={cn(homeInWidget.meta, 'text-right leading-4 tracking-wide')}>
      <span className="font-medium tabular-nums text-foreground">{percent}%</span> {label}
    </p>
  );
}

/** Right column: live + today community pause stats (Figma Market footer). */
export function HomeMarketCommunityStats({ pauseInProgress = false }: { pauseInProgress?: boolean }) {
  "use memo";
  const { t } = useTranslation();
  const { data, isPending } = useQuery(getHolzenNumberQueryOptions());

  if (isPending || !data) return null;

  const showNow = hasPausingNowStat(data);
  const showToday = hasPausedTodayStat(data);

  if (pauseInProgress && showNow) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5">
        <CommunityStatLine
          percent={data.percent_pausing_now}
          label={t('holzenNumber.pausingNowToo', { defaultValue: 'are pausing now, too' })}
        />
      </div>
    );
  }

  if (!showNow && !showToday) return null;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-end gap-0.5">
      {showNow ? (
        <CommunityStatLine
          percent={data.percent_pausing_now}
          label={t('holzenNumber.pausingNow', { defaultValue: 'of users pausing now' })}
        />
      ) : null}
      {showToday ? (
        <CommunityStatLine
          percent={data.percent_paused_today}
          label={t('holzenNumber.pausedToday', { defaultValue: 'of users paused today' })}
        />
      ) : null}
    </div>
  );
}

export function hasVisibleHomeMarketCommunityStats(data: HolzenNumberData | null | undefined): boolean {
  if (!data) return false;
  return hasPausingNowStat(data) || hasPausedTodayStat(data);
}
