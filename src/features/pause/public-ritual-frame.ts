/**
 * Frame / companion ritual beat — pure types and format helpers (no React hooks).
 * Orchestration hooks remain on `public-hooks.ts` until peeled incrementally.
 */
export type { CompanionData, CompanionPrefs } from './domain/companion-card-types';
export type { CachedHistoricalInsightShape } from './domain/historical-insight';
export type {
  InterventionState,
  RegenerateCompanionSlot,
} from './domain/companion-orchestrate';
export type { CompanionFeedbackVote } from './application/use-cases/ritual/frame/log-companion-feedback-vote';
export type {
  CompanionSlotCacheIds,
  CompanionSlotRelaxations,
} from './application/use-cases/ritual/frame/orchestrate-slot-apply';
export {
  companionSectionProFavoriteProps,
  type CompanionSectionProFavoriteProps,
} from './application/use-cases/ritual/frame/companion-section-pro-favorite';
export {
  resolveCompanionRegenerateClick,
  type CompanionRegenerateClickResult,
} from './application/use-cases/ritual/frame/companion-feedback-regenerate';
export { estimateReadTime } from './application/use-cases/ritual/frame/estimate-read-time';
export { formatCompanionHistoryRelativeDay } from './application/use-cases/ritual/frame/format-companion-history-relative-day';
export { zoomOutTotalCharsForReadTime } from './application/use-cases/ritual/frame/zoom-out-payload';
export type {
  EchoUserWord,
  ZoomOutData,
  ZoomOutEchoData,
  ZoomOutOnThisDayEntry,
} from './domain/zoom-out-display';
