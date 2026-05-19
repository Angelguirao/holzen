import { normalizeTrackedAssetId } from '@/features/market/domain/tracked-assets';

export const HOLZEN_MARKET_DISPLAY_QUERY_PREFIX = ['holzen', 'market-display'] as const;

/** TanStack cache for CoinGecko-backed market strip on Home (`useHolzen`). */
export function holzenMarketDisplayQueryKey(coinIdRaw: string | null | undefined, currency: string) {
  return [
    ...HOLZEN_MARKET_DISPLAY_QUERY_PREFIX,
    normalizeTrackedAssetId(coinIdRaw),
    currency.toUpperCase(),
  ] as const;
}
