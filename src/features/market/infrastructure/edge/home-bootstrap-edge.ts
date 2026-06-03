import { invokeEdge } from '@/lib/invoke-edge';
import type { HolzenNumberData } from '@/features/user/infrastructure/edge/holzen-number-edge';
import type { MarketQuoteEdgePayload } from './map-market-quote-payload';

export type HomeBootstrapResponse = {
  holzenNumber: HolzenNumberData;
  market: MarketQuoteEdgePayload;
};

/** Single round-trip for Home hero stats + market strip (`home-bootstrap` edge). */
export function invokeHomeBootstrap(params: { coinId: string; currency: string }) {
  return invokeEdge<HomeBootstrapResponse>('home-bootstrap', {
    body: {
      coinId: params.coinId,
      currency: params.currency,
    },
  });
}
