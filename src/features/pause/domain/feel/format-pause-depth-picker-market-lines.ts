import {
  formatCompactMarketSentimentFromContextText,
  formatCompactMarketSentimentFromFearGreed,
  parsePauseContextForHomePreview,
  trackedAssetSymbol,
  type MarketQuote,
} from '@/features/market/public';

export type PauseDepthPickerMarketLines = {
  sym: string;
  arrow: '▲' | '▼';
  direction: 'up' | 'down';
  pct: string;
  sentimentLine: string | null;
};

function resolveSentimentLine(
  marketData: MarketQuote | null,
  contextText: string | null | undefined,
): string | null {
  const parsed = parsePauseContextForHomePreview(contextText ?? null);
  return (
    formatCompactMarketSentimentFromContextText(parsed.marketSentiment) ??
    (marketData ? formatCompactMarketSentimentFromFearGreed(marketData.fearGreed) : null)
  );
}

/** Figma 589:19181 — compact move + fear/greed row for depth picker. */
export function formatPauseDepthPickerMarketLines(
  marketData: MarketQuote | null,
  trackedAssetId: string | null,
  contextText?: string | null,
): PauseDepthPickerMarketLines | null {
  if (!marketData || !trackedAssetId) return null;
  return {
    sym: trackedAssetSymbol(trackedAssetId),
    arrow: marketData.direction === 'down' ? '▼' : '▲',
    direction: marketData.direction,
    pct: Math.abs(marketData.changePercent).toFixed(1),
    sentimentLine: resolveSentimentLine(marketData, contextText),
  };
}
