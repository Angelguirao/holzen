import { useTranslation } from 'react-i18next';
import {
  resolveHomeMarketRangeStatus,
  type MarketVolatilityRangeStatus,
} from '@/features/market/domain/market-volatility-range-status';
import type { MarketQuote } from '@/features/market/public';
import { homeInWidget } from '@/screens/home/components/home-widget-styles';
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
      <p className={homeInWidget.footerSplitStart}>
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
    <p className={homeInWidget.footerSplitStart}>
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
    <div className={homeInWidget.footerSplitRow}>
      {rangeStatus ? <RangeStatusLine status={rangeStatus} /> : <span className="min-w-0 flex-1" aria-hidden />}
      <HomeMarketCommunityStats />
    </div>
  );
}
