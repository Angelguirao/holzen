import type { MarketQuote, OnChainData } from '@/features/market/domain/market-quote';
import { normalizeTrackedAssetId } from '@/features/market/domain/tracked-assets';

export type MarketQuoteEdgePayload = {
  coinId: string;
  currentPrice: number;
  price24hAgo: number;
  changePercent: number;
  direction: 'up' | 'down';
  fearGreed?: { value: number; label: string };
  onChain?: Record<string, unknown>;
  currency: string;
};

function mapOnChain(raw: Record<string, unknown> | undefined): OnChainData | undefined {
  if (!raw) return undefined;
  const onChain: OnChainData = {};
  if (typeof raw.mempoolSize === 'number') onChain.mempoolSize = raw.mempoolSize;
  if (typeof raw.fastestFee === 'number') onChain.fastestFee = raw.fastestFee;
  if (typeof raw.medianFee === 'number') onChain.medianFee = raw.medianFee;
  if (typeof raw.hashrate === 'string') onChain.hashrate = raw.hashrate;
  if (typeof raw.blockHeight === 'number') onChain.blockHeight = raw.blockHeight;
  return Object.keys(onChain).length > 0 ? onChain : undefined;
}

/** Map `market-quote` edge JSON into client `MarketQuote`. */
export function mapMarketQuotePayload(payload: MarketQuoteEdgePayload): MarketQuote {
  return {
    coinId: normalizeTrackedAssetId(payload.coinId),
    currentPrice: payload.currentPrice,
    price24hAgo: payload.price24hAgo,
    changePercent: payload.changePercent,
    direction: payload.direction,
    fearGreed: payload.fearGreed,
    onChain: mapOnChain(payload.onChain),
    currency: payload.currency.toUpperCase(),
  };
}
