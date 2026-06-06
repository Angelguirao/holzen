/** @deprecated Import from `./coingecko-spot-price-query` instead. */
export {
  fetchCoingeckoSpotPriceUsd as fetchCoingeckoBtcUsd,
  getCoingeckoSpotPriceUsdQueryOptions as getCoingeckoBtcUsdQueryOptions,
  prefetchCoingeckoSpotPriceUsd as prefetchCoingeckoBtcUsd,
} from './coingecko-spot-price-query';

export {
  COINGECKO_SPOT_PRICE_QUERY_KEY as COINGECKO_BTC_USD_QUERY_KEY,
  COINGECKO_SPOT_PRICE_QUERY_LEAF as COINGECKO_BTC_USD_QUERY_LEAF,
  COINGECKO_SPOT_PRICE_QUERY_PREFIX as COINGECKO_BTC_USD_QUERY_PREFIX,
} from '@/features/market/application/queries/coingecko-spot-price-keys';
