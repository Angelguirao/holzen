import type { MarketQuote } from '@/features/market/domain/market-quote';
import { enrichPauseContextWithMarketData } from '@holzen-pause-context';

/** 24h move line + Fear & Greed / on-chain enrichment (matches manual pause copy). */
export function buildPauseContextFromMarket(
  data: MarketQuote,
  assetSymbol: string,
): string {
  const dir = data.direction === 'down' ? 'down' : 'up';
  const pct = Math.abs(data.changePercent).toFixed(1);
  const ctx = `${assetSymbol} is ${dir} ${pct}% in the last 24 hours.`;
  return enrichPauseContextWithMarketData(ctx, data.fearGreed, data.onChain);
}

/** @deprecated Use buildPauseContextFromMarket — kept for callers that assume BTC copy only. */
export function buildPauseContextFromBtc(data: MarketQuote): string {
  return buildPauseContextFromMarket(data, 'BTC');
}
