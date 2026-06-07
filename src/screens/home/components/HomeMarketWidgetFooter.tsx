import { useTranslation } from 'react-i18next';
import {
  resolveHomeMarketRangeStatus,
  type MarketVolatilityRangeStatus,
} from '@/features/market/domain/market-volatility-range-status';
import type { MarketQuote } from '@/features/market/public';
import { HomeMarketCommunityStats } from '@/screens/home/components/home-market-community-stats';

type Props = {
  marketData: MarketQuote | null;
  threshold: number;
  thresholdDown: number;
  openPauseSource?: string | null;
  openPauseState?: 'active' | 'engaged' | null;
  openPauseContextSnapshot?: Record<string, unknown> | null;
};

function RangeStatusLine({ status }: { status: MarketVolatilityRangeStatus }) {
  "use memo";
  const { t } = useTranslation();

  if (status.kind === 'within') {
    return (
      <p className="min-w-0 text-xs font-medium leading-4 tracking-wide text-foreground">
        {t('home.market.withinYourRange', { defaultValue: 'Within your range' })}
      </p>
    );
  }

  const arrow =
    status.axis === 'daily_up' ? (
      <span className="text-nox-accent-green" aria-hidden>
        ▲
      </span>
    ) : (
      <span className="text-[#dbb266]" aria-hidden>
        ▼
      </span>
    );

  return (
    <p className="min-w-0 text-xs font-medium leading-4 tracking-wide text-foreground">
      {arrow}{' '}
      <span>{t('home.market.beyondYourRange', { defaultValue: 'Beyond your range' })}</span>
    </p>
  );
}

/** Figma 559:26565 — range (left) + paused-today stat (right) under Market price. */
export function HomeMarketWidgetFooter({
  marketData,
  threshold,
  thresholdDown,
  openPauseSource,
  openPauseState,
  openPauseContextSnapshot,
}: Props) {
  "use memo";

  const rangeStatus = resolveHomeMarketRangeStatus({
    marketData,
    threshold,
    thresholdDown,
    openPauseSource,
    openPauseState,
    openPauseContextSnapshot,
  });

  if (!rangeStatus && !marketData) return null;

  return (
    <div className="flex w-full flex-col gap-1 pt-0.5 @[400px]/shell:flex-row @[400px]/shell:items-start @[400px]/shell:justify-between @[400px]/shell:gap-x-3">
      {rangeStatus ? <RangeStatusLine status={rangeStatus} /> : null}
      <HomeMarketCommunityStats />
    </div>
  );
}
