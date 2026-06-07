/**
 * Home pause widget read-model helpers (no Supabase).
 * Scheduling volatility-check hour math: `public-scheduling`. Home widget reads + conductors (pending-offer, completed count, dismiss outlet, pause actions, context previews, manual trigger, HolzenProvider state) live here (§6 peel).
 * Screens/home and `PauseHomeProvider` **read** pause/market state here; profile via `user/public-hooks`. Adopt/decline mutations: `public-session`.
 */
export {
  resolvePauseArrivalToneAction,
  type PauseArrivalToneAction,
} from './domain/home/resolve-pause-arrival-tone-action';
export {
  pauseHomeErrorKind,
  pauseHomeErrorStrings,
  shouldShowHomePauseSectionSnooze,
  shouldSurfacePauseWidgetError,
  type PauseHomeErrorKind,
} from './domain/home/pause-home-widget-error';
export { usePauseArrivalAudio } from './presentation/home/use-pause-arrival-audio';
export {
  usePauseCardProjection,
  type PauseCardProjection,
  type UsePauseCardProjectionParams,
} from './presentation/home/use-pause-card-projection';
export {
  useHomePauseWidgetProjection,
  HOME_PAUSE_WIDGET_EXPANDED_STORAGE_KEY,
} from './presentation/home/use-home-pause-widget-projection';
export type {
  HomePauseWidgetProjection,
  HomePauseWidgetBodyProjection,
  UseHomePauseWidgetProjectionParams,
} from './domain/home/home-pause-widget-projection-types';
export {
  resolveHomePauseWidgetMode,
  homePauseWidgetSectionTitleKey,
  type HomePauseWidgetMode,
} from './domain/home/home-pause-widget-mode';
export { hasReachedReflectForHome } from './domain/home/has-reached-reflect-for-home';
export {
  useCompletedPauseCount,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
  fetchCompletedPauseCount,
  getCompletedPauseCountQueryOptions,
} from './presentation/home/use-completed-pause-count';
export { useHomePracticeStats, type HomePracticeStats } from './presentation/home/use-home-practice-stats';
export {
  fetchHomePracticeStats,
  getHomePracticeStatsQueryOptions,
  HOME_PRACTICE_STATS_QUERY_KEY,
} from './infrastructure/queries/home-practice-stats-query';
export { useDismissOutletPauseReady } from './presentation/home/use-dismiss-outlet-pause-ready';
export {
  usePendingPauseOffer,
  pendingPauseOfferQueryKey,
  type PendingPauseOfferRow,
} from './presentation/reflect/pending-offer/use-pending-pause-offer';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
  type PendingPauseOfferDisplayInput,
} from './presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
export {
  useHomePauseActions,
  type PauseDismissAnalyticsSurface,
} from './presentation/home/use-home-pause-actions';
export { useHomePendingPauseOfferActions } from './presentation/home/use-home-pending-pause-offer-actions';
export {
  usePauseContextHomePreviews,
  type PauseContextHomePreview,
} from './presentation/home/use-pause-context-home-previews';
export { useOpenPauseHomePreview } from './presentation/home/use-open-pause-home-preview';
export type { UseOpenPauseHomePreviewOptions } from './presentation/home/use-open-pause-home-preview';
export {
  useManualPauseTrigger,
  type UseManualPauseTriggerParams,
} from './presentation/reflect/generation/manual-open/use-manual-pause-trigger';
export {
  useHolzenManualTriggerOrchestration,
  type UseHolzenManualTriggerOrchestrationParams,
} from './presentation/home/use-holzen-manual-trigger-orchestration';
export { useHolzenHomeContextState } from './presentation/home/use-holzen-home-context-state';
export {
  PauseHomeProvider,
  usePauseHomeContext,
  type PauseHomeContextValue,
} from './presentation/home/pause-home-context';
export {
  trackHomeCustomizeOpened,
  trackHomeCustomizeResetLayout,
  trackHomeGoalWhyExpandToggled,
  trackHomeHeroQuoteViewed,
  trackHomeOptionalWidgetToggled,
  trackOnboardingCompleted,
} from './presentation/home/home-screen-telemetry-io';
