import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  getFearGreedDisplayQueryOptions,
  getHolzenMarketDisplayQueryOptions,
  parsePauseContextForHomePreview,
  formatCompactMarketSentimentFromContextText,
  type MarketQuote,
} from '@/features/market/public';
import { useProfile } from '@/features/user/public-hooks';
import { formatPauseDepthPickerMarketLines, shouldShowPauseRitualMarketContext } from '@/features/pause/public-ritual-feel';
import { usePendingPauseOffer } from '@/features/pause/public-home';

type Props = {
  marketData: MarketQuote | null;
  trackedAssetId: string;
  /** Pause instance context — sentiment fallback after manual trigger. */
  contextText?: string | null;
  /** Depth picker shows “Within your range”; Feel step shows market line only (Figma 330:19905). */
  showRangeLine?: boolean;
};

/** Market move + “Within your range” block (Figma Wireframes 589:19181). */
export function PauseDepthPickerMarketContext({
  marketData,
  trackedAssetId,
  contextText = null,
  showRangeLine = true,
}: Props) {
  "use memo";
  const { t } = useTranslation();
  const { currency, profileLoaded, threshold, thresholdDown } = useProfile();
  const { pending } = usePendingPauseOffer();

  const marketQuery = useQuery(
    getHolzenMarketDisplayQueryOptions({
      coinIdRaw: trackedAssetId,
      currency,
      enabled: profileLoaded && Boolean(trackedAssetId),
    }),
  );

  const resolvedMarket = marketData ?? marketQuery.data ?? null;
  const contextSentiment = formatCompactMarketSentimentFromContextText(
    parsePauseContextForHomePreview(contextText ?? null).marketSentiment,
  );
  const needsFearGreed =
    profileLoaded && resolvedMarket != null && !resolvedMarket.fearGreed && !contextSentiment;

  const fearGreedQuery = useQuery(getFearGreedDisplayQueryOptions(needsFearGreed));

  const marketWithSentiment =
    resolvedMarket && fearGreedQuery.data && !resolvedMarket.fearGreed
      ? { ...resolvedMarket, fearGreed: fearGreedQuery.data }
      : resolvedMarket;

  const lines = formatPauseDepthPickerMarketLines(
    marketWithSentiment,
    trackedAssetId,
    contextText,
  );

  const showMarketContext = useMemo(
    () =>
      shouldShowPauseRitualMarketContext({
        hasPendingOffer: pending != null,
        marketData: marketWithSentiment,
        threshold,
        thresholdDown,
        profileLoaded,
      }),
    [pending, marketWithSentiment, threshold, thresholdDown, profileLoaded],
  );

  if (!showMarketContext) return null;

  if (!lines && !showRangeLine) return null;

  return (
    <div className="flex flex-col gap-2">
      {lines ? (
        <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 text-center text-sm leading-5 tracking-[0.005em] text-foreground">
          <span className="tabular-nums">{lines.sym} </span>
          <span
            className={cn(
              'tabular-nums',
              lines.direction === 'up' ? 'text-[#50adff]' : 'text-destructive',
            )}
            aria-hidden
          >
            {lines.arrow}
          </span>
          <span className="tabular-nums">
            {' '}
            {lines.pct}% · 24h
          </span>
          {lines.sentimentLine ? <span>{lines.sentimentLine}</span> : null}
        </p>
      ) : null}
      {showRangeLine ? (
        <p className="text-center text-sm leading-5 tracking-[0.005em] text-muted-foreground">
          {t('home.market.withinYourRange', { defaultValue: 'Within your range' })}
        </p>
      ) : null}
    </div>
  );
}
