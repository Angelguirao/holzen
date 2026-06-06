/** Public API for market context — export only what other features may import. */
export {
  getManualReflectionCooldownMs,
  isHolzenDevMode,
} from './application/manual-cooldown';
export {
  mapHolzenMarketDisplayError,
  HOLZEN_MARKET_DISPLAY_COINGECKO_ERROR,
  HOLZEN_MARKET_DISPLAY_RETRY_ERROR,
  isHolzenMarketDisplayUserError,
} from './application/map-holzen-market-display-error';
export {
  buildPauseContextFromBtc,
  buildPauseContextFromMarket,
} from './application/pause-context-from-market';
export { isVolatilityThresholdBreached } from './domain/volatility-thresholds';
export {
  resolveMarketVolatilityRangeStatus,
  resolveHomeMarketRangeStatus,
  type MarketVolatilityRangeStatus,
  type MarketVolatilityRangeInput,
  type HomeMarketRangeStatusInput,
} from './domain/market-volatility-range-status';
export {
  resolveHomeMarketDisplayQuote,
  type HomeMarketDisplayQuoteInput,
} from './domain/home-market-display-quote';
export { parsePauseContextForHomePreview } from './application/pause-context-home-preview';
export {
  formatCompactMarketSentimentFromContextText,
  formatCompactMarketSentimentFromFearGreed,
} from './application/format-compact-market-sentiment-line';
export {
  severityFromMarketChangePercent,
  type MarketMoveSeverity,
} from './domain/market-move-severity';
export {
  severityFromBtcChangePercent,
  type BtcMoveSeverity,
} from './domain/btc-move-severity';
export {
  BITCOIN_TRACKED_ASSET,
  TRACKED_ASSETS,
  isBitcoinTrackedAsset,
  isTrackedAssetId,
  normalizeTrackedAssetId,
  trackedAssetDefinition,
  trackedAssetSymbol,
  type AssetQuoteProvider,
  type TrackedAssetDefinition,
  type TrackedAssetId,
  type TrackedAssetKind,
} from './domain/tracked-assets';
export type {
  BtcPriceData,
  FearGreedData,
  MarketQuote,
  OnChainData,
  SupportedCurrency,
} from './domain/market-quote';
export { SUPPORTED_CURRENCIES } from './domain/market-quote';
export { formatBtcPrice, formatMarketPrice } from './application/format-market-price';
export {
  fetchBtcData,
  fetchMarketData,
  fetchMarketDataLite,
} from './infrastructure/fetch-market-data';
export {
  BREATHE_AMBIENT_MARKET_QUERY_KEY,
  getBreatheAmbientMarketQueryOptions,
} from './infrastructure/queries/breathe-ambient-market-query';
export {
  BREATHE_AMBIENT_BTC_QUERY_KEY,
  getBreatheAmbientBtcQueryOptions,
} from './infrastructure/queries/breathe-ambient-btc-query';
export {
  getHolzenMarketDisplayQueryOptions,
  holzenMarketDisplayQueryKey,
} from './infrastructure/queries/holzen-market-display-query';
export { getFearGreedDisplayQueryOptions } from './infrastructure/queries/fear-greed-display-query';
export {
  getCoingeckoSpotPriceUsdQueryOptions,
  prefetchCoingeckoSpotPriceUsd,
} from './infrastructure/queries/coingecko-spot-price-query';
export {
  getCoingeckoBtcUsdQueryOptions,
  prefetchCoingeckoBtcUsd,
} from './infrastructure/queries/coingecko-btc-usd-query';
export {
  getCoingeckoMarketChartQueryOptions,
  type CoingeckoMarketChartPoint,
} from './infrastructure/queries/coingecko-market-chart-query';
