/**
 * Home pause widget read-model helpers (no Supabase).
 * Scheduling quarter-hour math: `public-scheduling`. Home widget reads + conductors (pending-offer, completed count, dismiss outlet, pause actions, context previews, manual trigger, HolzenProvider state) live here (§6 peel).
 * Screens/home, `HolzenProvider`, and pause pending-offer **read** UI import here. Adopt/decline mutations: `public-session`. Presentation imports barrels, not `application/*`.
 */
export {
  resolvePauseArrivalToneAction,
  type PauseArrivalToneAction,
} from './domain/home/resolve-pause-arrival-tone-action';
export {
  buildHomePauseCardBodyProps,
  type BuildHomePauseCardBodyPropsInput,
  type HomePauseCardBodyPropsProjection,
  type PauseContextHomePreview,
} from './application/use-cases/home/home-pause-card-body-props';
export {
  pauseHomeErrorKind,
  pauseHomeErrorStrings,
  shouldShowHomePauseSectionSnooze,
  shouldSurfacePauseWidgetError,
  type PauseHomeErrorKind,
} from './domain/home/pause-home-widget-error';
export {
  buildZenModeHomeRouteProps,
  type BuildZenModeHomeRoutePropsInput,
  type ZenModeHomeRoutePropsProjection,
} from './application/use-cases/home/build-zen-mode-home-route-props';
export { usePauseArrivalAudio } from './presentation/home/use-pause-arrival-audio';
export {
  usePauseCardProjection,
  type PauseCardProjection,
  type UsePauseCardProjectionParams,
} from './presentation/home/use-pause-card-projection';
export { useZenModeHomeRouteProps } from './presentation/home/use-zen-mode-home-route-props';
export { groupBulkHoldByLocalDay } from './application/use-cases/home/bulk-hold/group-by-local-day';
export {
  formatBulkHoldContextQuote,
  formatBulkHoldLocalTime,
  parseBulkHoldChange24hPct,
  type BulkHoldOutcomeChoice,
  type BulkHoldReviewSection,
} from './domain/bulk-hold';
export {
  useBulkHoldPending,
  bulkHoldPendingQueryKey,
  type BulkHoldPendingPause,
  type UseBulkHoldPendingOptions,
} from './presentation/home/use-bulk-hold-pending';
export {
  useBulkHoldApplyOutcomes,
  type UseBulkHoldApplyOutcomesParams,
} from './presentation/home/use-bulk-hold-apply-outcomes';
export {
  useCompletedPauseCount,
  COMPLETED_PAUSE_COUNT_QUERY_KEY,
  fetchCompletedPauseCount,
  getCompletedPauseCountQueryOptions,
} from './presentation/home/use-completed-pause-count';
export { useDismissOutletPauseReady } from './presentation/home/use-dismiss-outlet-pause-ready';
export {
  usePendingPauseOffer,
  pendingPauseOfferQueryKey,
  type PendingPauseOfferRow,
} from './presentation/session/use-pending-pause-offer';
export {
  getPendingPauseOfferDisplay,
  type PendingPauseOfferDisplay,
} from './application/use-cases/session/pending-offer/pending-pause-offer-display';
export {
  useHomePauseActions,
  type PauseDismissAnalyticsSurface,
} from './presentation/home/use-home-pause-actions';
export { usePauseContextHomePreviews } from './presentation/home/use-pause-context-home-previews';
export { useOpenPauseHomePreview } from './presentation/reflect/generation/manual-open/use-open-pause-home-preview';
export {
  useManualPauseTrigger,
  type UseManualPauseTriggerParams,
} from './presentation/reflect/generation/manual-open/use-manual-pause-trigger';
export {
  useHolzenManualTriggerOrchestration,
  type UseHolzenManualTriggerOrchestrationParams,
} from './presentation/home/use-holzen-manual-trigger-orchestration';
export { useHolzenHomeContextState } from './presentation/home/use-holzen-home-context-state';
