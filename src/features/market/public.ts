/** Public API for market context — export only what other features may import. */
export {
  getManualReflectionCooldownMs,
  isHolzenDevMode,
} from './application/manual-cooldown';
export {
  buildPauseContextFromBtc,
  buildPauseContextFromMarket,
} from './application/pause-context-from-market';
export {
  DEFAULT_CUMULATIVE_THRESHOLD,
  effectiveCumulativeThreshold,
  isCumulativeMoveTriggered,
} from './domain/volatility-thresholds';
export { parsePauseContextForHomePreview } from './application/pause-context-home-preview';
export {
  severityFromBtcChangePercent,
  type BtcMoveSeverity,
} from './domain/btc-move-severity';
export {
  TRACKED_ASSETS,
  normalizeTrackedAssetId,
  trackedAssetSymbol,
  type TrackedAssetId,
} from './domain/tracked-assets';
export type {
  BtcPriceData,
  FearGreedData,
  OnChainData,
  SupportedCurrency,
} from './domain/market-quote';
export { SUPPORTED_CURRENCIES } from './domain/market-quote';
export { formatBtcPrice } from './application/format-market-price';
export {
  fetchBtcData,
  fetchMarketData,
} from './infrastructure/fetch-market-data';
export {
  BREATHE_AMBIENT_BTC_QUERY_KEY,
  getBreatheAmbientBtcQueryOptions,
} from './infrastructure/queries/breathe-ambient-btc-query';
export {
  getHolzenMarketDisplayQueryOptions,
  holzenMarketDisplayQueryKey,
} from './infrastructure/queries/holzen-market-display-query';
export {
  getCoingeckoBtcUsdQueryOptions,
  prefetchCoingeckoBtcUsd,
} from './infrastructure/queries/coingecko-btc-usd-query';
export {
  getCoingeckoMarketChartQueryOptions,
  type CoingeckoMarketChartPoint,
} from './infrastructure/queries/coingecko-market-chart-query';
