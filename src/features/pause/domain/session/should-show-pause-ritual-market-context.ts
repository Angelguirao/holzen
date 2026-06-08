import {
  resolveMarketVolatilityRangeStatus,
  type MarketVolatilityRangeInput,
} from '@/features/market/domain/market-volatility-range-status';
import type { MarketQuote } from '@/features/market/domain/market-quote';

/**
 * `/pause` depth picker + Feel step market strip (Figma 589:19181 / 330:19905).
 * Hide when a pending cron offer exists or live move is back within daily bands —
 * the trigger context is no longer the active story (same gate as Home calm waters).
 */
export function shouldShowPauseRitualMarketContext(input: {
  hasPendingOffer: boolean;
  marketData: MarketQuote | null;
  threshold: number;
  thresholdDown: number;
  profileLoaded?: boolean;
}): boolean {
  if (input.hasPendingOffer) return false;
  if (input.profileLoaded === false) return false;
  if (!input.marketData) return false;

  const move: MarketVolatilityRangeInput = {
    changePercent: input.marketData.changePercent,
    direction: input.marketData.direction,
  };

  return (
    resolveMarketVolatilityRangeStatus(
      { threshold: input.threshold, threshold_down: input.thresholdDown },
      move,
    ).kind === 'beyond'
  );
}
