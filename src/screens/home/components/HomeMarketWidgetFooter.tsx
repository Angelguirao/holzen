import { useTranslation } from 'react-i18next';
import {
  resolveMarketVolatilityRangeStatus,
  type MarketVolatilityRangeStatus,
} from '@/features/market/domain/market-volatility-range-status';
import type { BtcPriceData } from '@/features/market/public';
import { HomeMarketCommunityStats } from '@/screens/home/components/home-market-community-stats';

type Props = {
  btcData: BtcPriceData | null;
  threshold: number;
  thresholdDown: number;
  cumulativeThreshold: number;
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
    ) : status.axis === 'daily_down' ? (
      <span className="text-[#dbb266]" aria-hidden>
        ▼
      </span>
    ) : (
      <span className="text-muted-foreground" aria-hidden>
        ◆
      </span>
    );

  const label =
    status.axis === 'cumulative'
      ? t('home.market.beyondRangeCumulative', {
          defaultValue: '7-day move beyond your range',
        })
      : t('home.market.beyondYourRange', { defaultValue: 'Beyond your range' });

  return (
    <p className="min-w-0 flex-1 text-xs font-medium leading-4 tracking-wide text-foreground">
      {arrow}{' '}
      <span>{label}</span>
    </p>
  );
}

/** Figma 559:26565 — range (left) + community stats stacked (right) under Market price. */
export function HomeMarketWidgetFooter({ btcData, threshold, thresholdDown, cumulativeThreshold }: Props) {
  "use memo";

  const rangeStatus =
    btcData != null
      ? resolveMarketVolatilityRangeStatus(
          { threshold, threshold_down: thresholdDown, cumulative_threshold: cumulativeThreshold },
          {
            changePercent: btcData.changePercent,
            direction: btcData.direction,
            cumulativeChangePercent: btcData.cumulativeChangePercent,
          },
        )
      : null;

  if (!rangeStatus && !btcData) return null;

  return (
    <div className="flex items-start gap-1 pt-0.5">
      {rangeStatus ? <RangeStatusLine status={rangeStatus} /> : <span className="flex-1" />}
      <HomeMarketCommunityStats />
    </div>
  );
}
