import type { MarketOnThisDayOverlay } from '@/features/pause/domain/market-on-this-day';

export interface CachedHistoricalInsightShape extends MarketOnThisDayOverlay {
  title?: string;
  period?: string;
  /** Serialized companion/cache field (BTC-centric copy today). */
  btcInsight?: string;
  assetClass?: string;
  analogy?: string;
}
