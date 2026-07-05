/**
 * Feel ritual beat — mood tiles, depth picker, initial emotion, session mood chrome.
 * Mutations bind through `presentation/feel/pause-feel-io.ts` (not `public-rpc` per-hook facades).
 */
export {
  clampFeelIntensity,
  isPauseMoodValue,
  PAUSE_MOOD_GROUPS,
  PAUSE_MOOD_VALUES,
  type MoodValue,
} from './domain/mood-value';
export type { FeelStepTile } from './domain/feel-step-tile';
export { PAUSE_FEEL_STEP_TILE_ROWS } from './domain/pause-feel-step-tiles';
export {
  PAUSE_FEEL_INTENSITY_KEYS,
  type PauseFeelIntensityKey,
} from './domain/pause-feel-intensity';
export { usePauseSessionMoodChromeHandlers } from './presentation/feel/use-pause-session-mood-chrome-handlers';
export {
  usePauseSessionMoodAndPersist,
  type UsePauseSessionMoodAndPersistParams,
} from './presentation/feel/use-pause-session-mood-and-persist';
export { usePauseSessionDepthPickerHandlers } from './presentation/feel/use-pause-session-depth-picker-handlers';
export { usePauseSessionFeelTilesSelect } from './presentation/feel/use-pause-session-feel-tiles-select';
export { usePauseSessionInitialMoodHandlers } from './presentation/feel/use-pause-session-initial-mood-handlers';
export { usePauseSessionDepthAndBriefCopy } from './presentation/feel/use-pause-session-depth-and-brief-copy';
export { PAUSE_DEPTH_PICKER_CARD_BUTTON_CLASS } from './presentation/feel/pause-depth-picker-styles';
export { formatPauseDepthPickerMarketLines } from './domain/feel/format-pause-depth-picker-market-lines';
export { shouldShowPauseRitualMarketContext } from './domain/session/should-show-pause-ritual-market-context';
export { usePauseFeelShiftLogDedupeRefs } from './presentation/feel/use-pause-feel-shift-log-dedupe-refs';
