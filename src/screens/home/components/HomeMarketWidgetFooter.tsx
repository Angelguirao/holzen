import { useTranslation } from 'react-i18next';
import {
  resolveMarketVolatilityRangeStatus,
  type MarketVolatilityRangeStatus,
} from '@/features/market/domain/market-volatility-range-status';
import type { MarketQuote } from '@/features/market/public';
import { HomeMarketCommunityStats } from '@/screens/home/components/home-market-community-stats';

type Props = {
  marketData: MarketQuote | null;
  threshold: number;
  thresholdDown: number;
};

function RangeStatusLine({ status }: { status: MarketVolatilityRangeStatus }) {
  "use memo";
  const { t } = useTranslation();

  if (status.kind === 'within') {
    return (
      <p className="min-w-0 flex-1 text-xs font-medium leading-4 tracking-wide text-foreground">
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
    <p className="min-w-0 flex-1 text-xs font-medium leading-4 tracking-wide text-foreground">
      {arrow}{' '}
      <span>{t('home.market.beyondYourRange', { defaultValue: 'Beyond your range' })}</span>
    </p>
  );
}

/** Figma 559:26565 — range (left) + paused-today stat (right) under Market price. */
export function HomeMarketWidgetFooter({ marketData, threshold, thresholdDown }: Props) {
  "use memo";

  const rangeStatus =
    marketData != null
      ? resolveMarketVolatilityRangeStatus(
          { threshold, threshold_down: thresholdDown },
          {
            changePercent: marketData.changePercent,
            direction: marketData.direction,
          },
        )
      : null;

  if (!rangeStatus && !marketData) return null;

  return (
    <div className="flex items-start gap-1 pt-0.5">
      {rangeStatus ? <RangeStatusLine status={rangeStatus} /> : <span className="flex-1" />}
      <HomeMarketCommunityStats />
    </div>
  );
}
