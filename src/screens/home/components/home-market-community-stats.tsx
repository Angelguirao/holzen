import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getHolzenNumberQueryOptions } from '@/features/user/public-queries';
import type { HolzenNumberData } from '@/features/user/public-queries';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
import { cn } from '@/lib/utils';

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
    <p className={homeInWidget.footerSplitEnd}>
      <span className={cn(homeInWidget.metaRowEmphasis, 'tabular-nums')}>{percent}%</span>{' '}
      <span className={homeInWidget.metaRowMuted}>{label}</span>
    </p>
  );
}

/** Right column: “% of users paused today” (Figma Market footer). */
export function HomeMarketCommunityStats() {
  "use memo";
  const { t } = useTranslation();
  const { data, isPending } = useQuery(getHolzenNumberQueryOptions());

  if (isPending || !data || !hasPausedTodayStat(data)) return null;

  return (
    <CommunityStatLine
      percent={data.percent_paused_today}
      label={t('holzenNumber.pausedToday', { defaultValue: 'of users paused today' })}
    />
  );
}

export function hasVisibleHomeMarketCommunityStats(data: HolzenNumberData | null | undefined): boolean {
  if (!data) return false;
  return hasPausedTodayStat(data);
}
