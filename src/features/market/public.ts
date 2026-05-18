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
