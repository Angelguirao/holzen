import type { BtcOnThisDayOverlay } from '@/features/pause/domain/btc-on-this-day';

export interface CachedHistoricalInsightShape extends BtcOnThisDayOverlay {
  title?: string;
  period?: string;
  btcInsight?: string;
  assetClass?: string;
  analogy?: string;
}
