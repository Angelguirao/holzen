import type { MarketOnThisDayOverlay } from '@/features/pause/domain/market-on-this-day';

export interface CachedHistoricalInsightShape extends MarketOnThisDayOverlay {
  title?: string;
  period?: string;
  /** Canonical insight body in client code. */
  marketInsight?: string;
  /** Serialized edge/cache field — dual-read with `marketInsight`. */
  btcInsight?: string;
  assetClass?: string;
  analogy?: string;
}

/** Prefer `marketInsight`; fall back to legacy serialized `btcInsight`. */
export function resolveHistoricalMarketInsight(
  data: Pick<CachedHistoricalInsightShape, 'marketInsight' | 'btcInsight'> | null | undefined,
): string | undefined {
  if (!data) return undefined;
  return data.marketInsight ?? data.btcInsight;
}
