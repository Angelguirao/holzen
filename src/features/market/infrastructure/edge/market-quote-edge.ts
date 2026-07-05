import { invokeEdge } from '@/lib/invoke-edge';
import type { MarketQuoteEdgePayload } from './map-market-quote-payload';

export type MarketQuoteMode = 'lite' | 'full';

export function invokeMarketQuote(params: {
  coinId: string;
  currency: string;
  mode?: MarketQuoteMode;
}) {
  return invokeEdge<MarketQuoteEdgePayload>('market-quote', {
    body: {
      coinId: params.coinId,
      currency: params.currency,
      mode: params.mode ?? 'lite',
    },
  });
}
