/**
 * Home pause widget read-model helpers (no Supabase).
 * Scheduling quarter-hour math: `public-scheduling`. Presentation imports barrels, not `application/*`.
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
