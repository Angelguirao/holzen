import type { BtcPriceData } from '@/lib/btc';
import { isCumulativeMoveTriggered } from '@/features/market/domain/volatility-thresholds';
import { enrichPauseContextWithMarketData } from '@holzen-pause-context';

/** 24h + optional 7d cumulative line, then Fear & Greed / on-chain enrichment (matches manual pause copy). */
export function buildPauseContextFromMarket(
  data: BtcPriceData,
  cumulativeThreshold: number,
  assetSymbol: string,
): string {
  const dir = data.direction === 'down' ? 'down' : 'up';
  const pct = Math.abs(data.changePercent).toFixed(1);
  let ctx = `${assetSymbol} is ${dir} ${pct}% in the last 24 hours.`;
  if (isCumulativeMoveTriggered(data.cumulativeChangePercent, cumulativeThreshold)) {
    const cumDir = data.cumulativeDirection === 'down' ? 'down' : 'up';
    ctx += ` Over 7 days, it's ${cumDir} ${Math.abs(data.cumulativeChangePercent!).toFixed(1)}%.`;
  }
  return enrichPauseContextWithMarketData(ctx, data.fearGreed, data.onChain);
}

/** @deprecated Use buildPauseContextFromMarket — kept for callers that assume BTC copy only. */
export function buildPauseContextFromBtc(data: BtcPriceData, cumulativeThreshold: number): string {
  return buildPauseContextFromMarket(data, cumulativeThreshold, 'BTC');
}
