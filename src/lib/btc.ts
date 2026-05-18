/** @deprecated Import from `@/features/market/public` or feature market modules. */
export type {
  BtcPriceData,
  FearGreedData,
  OnChainData,
  SupportedCurrency,
} from '@/features/market/domain/market-quote';
export {
  SUPPORTED_CURRENCIES,
} from '@/features/market/domain/market-quote';
export { formatBtcPrice } from '@/features/market/application/format-market-price';
export {
  fetchBtcData,
  fetchMarketData,
} from '@/features/market/infrastructure/fetch-market-data';
export {
  BREATHE_AMBIENT_BTC_QUERY_KEY,
  getBreatheAmbientBtcQueryOptions,
} from '@/features/market/infrastructure/queries/breathe-ambient-btc-query';
