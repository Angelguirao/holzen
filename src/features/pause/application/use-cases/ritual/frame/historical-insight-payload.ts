import type { CachedHistoricalInsightShape } from '@/features/pause/domain/historical-insight';
import type { MarketOnThisDayEntry } from '@/features/pause/domain/market-on-this-day';
import type { ZoomOutData } from '@/features/pause/domain/zoom-out-display';

function parseOnThisDay(raw: unknown): MarketOnThisDayEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: MarketOnThisDayEntry[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    if (
      typeof r.yearsAgo === 'number' &&
      typeof r.price === 'number' &&
      typeof r.date === 'string'
    ) {
      out.push({ yearsAgo: r.yearsAgo, price: r.price, date: r.date });
    }
  }
  return out;
}

/** Coerce wire/cache/orchestrate history payloads for `HistoricalInsightDisplay`. */
export function toHistoricalInsightDisplayData(raw: unknown): CachedHistoricalInsightShape | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const onThisDay = parseOnThisDay(o.onThisDay);
  const currentPrice = typeof o.currentPrice === 'number' ? o.currentPrice : null;
  const partial = typeof o.partial === 'boolean' ? o.partial : undefined;

  const marketInsight =
    typeof o.marketInsight === 'string'
      ? o.marketInsight
      : typeof o.btcInsight === 'string'
        ? o.btcInsight
        : undefined;

  return {
    title: typeof o.title === 'string' ? o.title : undefined,
    period: typeof o.period === 'string' ? o.period : undefined,
    marketInsight,
    btcInsight: marketInsight,
    assetClass: typeof o.assetClass === 'string' ? o.assetClass : undefined,
    analogy: typeof o.analogy === 'string' ? o.analogy : undefined,
    onThisDay,
    currentPrice,
    partial,
  };
}

/**
 * Legacy sessions may still have BTC rows on zoom-out artifacts. Prefer history payload,
 * then fall back to zoom-out price rows when Look Back lacks them.
 */
export function mergeHistoryMarketOverlay(
  history: CachedHistoricalInsightShape | null,
  zoomOut: ZoomOutData | null,
): CachedHistoricalInsightShape | null {
  if (!history) return null;
  const hasHistoryPrices =
    typeof history.currentPrice === 'number' && (history.onThisDay?.length ?? 0) > 0;
  if (hasHistoryPrices) return history;

  const zoPrices =
    typeof zoomOut?.currentPrice === 'number' && (zoomOut.onThisDay?.length ?? 0) > 0;
  if (!zoPrices || !zoomOut) return history;

  return {
    ...history,
    onThisDay: zoomOut.onThisDay,
    currentPrice: zoomOut.currentPrice,
    partial: zoomOut.partial,
  };
}

/** @deprecated Use mergeHistoryMarketOverlay */
export const mergeHistoryBtcOverlay = mergeHistoryMarketOverlay;
