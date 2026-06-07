import {
  resolveMarketVolatilityRangeStatus,
  type MarketVolatilityRangeInput,
} from '@/features/market/domain/market-volatility-range-status';
import type { MarketQuote } from '@/features/market/domain/market-quote';

/** Live quote vs user daily thresholds — Figma 578:27863 engaged + calm waters. */
export function resolveEngagedPauseMarketSettled(input: {
  openPauseState: 'active' | 'engaged' | null;
  marketData: MarketQuote | null;
  threshold: number;
  thresholdDown: number;
}): boolean {
  if (input.openPauseState !== 'engaged' || !input.marketData) return false;

  const move: MarketVolatilityRangeInput = {
    changePercent: input.marketData.changePercent,
    direction: input.marketData.direction,
  };

  return (
    resolveMarketVolatilityRangeStatus(
      { threshold: input.threshold, threshold_down: input.thresholdDown },
      move,
    ).kind === 'within'
  );
}
