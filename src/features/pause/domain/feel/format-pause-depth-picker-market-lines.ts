import { trackedAssetSymbol, type MarketQuote } from '@/features/market/public';

export type PauseDepthPickerMarketLines = {
  sym: string;
  arrow: '▲' | '▼';
  direction: 'up' | 'down';
  pct: string;
  sentimentLine: string | null;
};

/** Figma 589:19181 — compact move + fear/greed row for depth picker. */
export function formatPauseDepthPickerMarketLines(
  marketData: MarketQuote | null,
  trackedAssetId: string | null,
): PauseDepthPickerMarketLines | null {
  if (!marketData || !trackedAssetId) return null;
  const fg = marketData.fearGreed;
  return {
    sym: trackedAssetSymbol(trackedAssetId),
    arrow: marketData.direction === 'down' ? '▼' : '▲',
    direction: marketData.direction,
    pct: Math.abs(marketData.changePercent).toFixed(1),
    sentimentLine:
      fg?.label && typeof fg.value === 'number' ? `${fg.label} · ${fg.value}` : null,
  };
}
