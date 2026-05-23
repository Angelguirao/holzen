/**
 * Frame ritual beat (companions + `/companion/*` full views) — types, pure helpers, presentation hooks.
 * Orchestration mutations stay on `public-rpc` via presentation I/O modules; screens import here
 * instead of `public-hooks` for Frame UI (mirrors `public-ritual-reflect.ts`).
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

export {
  useCompanionHistoryThread,
  type HistoryThreadRow,
} from './presentation/companion/use-companion-history-thread';
export { useRelatedBiasesThisMonth } from './presentation/companion/use-related-biases-this-month';
export { useCompanionFeedbackVote } from './presentation/companion/use-companion-feedback-vote';
export { isCompanionRegenerateUiEnabled } from './presentation/companion/is-companion-regenerate-ui-enabled';
export { useCompanionAccess } from './presentation/companion/use-companion-access';
export { useCompanionUiCompletion } from './presentation/companion/use-companion-ui-completion';
export { useCompanionLibraryFavorites } from './presentation/companion/use-companion-library-favorites';
export { useCompanionSlotUiState } from './presentation/companion/use-companion-slot-ui-state';
export {
  useCompanionOrchestrateSession,
  type UseCompanionOrchestrateSessionParams,
} from './presentation/companion/use-companion-orchestrate-session';
export {
  useCompanionInterventionFetch,
  type UseCompanionInterventionFetchParams,
} from './presentation/companion/use-companion-intervention-fetch';
export {
  useCompanionOrchestrateRetry,
  type UseCompanionOrchestrateRetryParams,
} from './presentation/companion/use-companion-orchestrate-retry';
export {
  useCompanionSlotOrchestrateFailurePorts,
  type UseCompanionSlotOrchestrateFailurePortsParams,
} from './presentation/companion/use-companion-slot-orchestrate-failure-ports';
export {
  useCompanionInterventionBootstrap,
  type UseCompanionInterventionBootstrapParams,
} from './presentation/companion/use-companion-intervention-bootstrap';
export {
  useCompanionSlotRunOrchestrate,
  type UseCompanionSlotRunOrchestrateParams,
} from './presentation/companion/use-companion-slot-run-orchestrate';
export {
  useCompanionSlotOrchestrateActions,
  type UseCompanionSlotOrchestrateActionsParams,
} from './presentation/companion/use-companion-slot-orchestrate-actions';
export {
  useCompanionOrchestration,
  type UseCompanionOrchestrationParams,
} from './presentation/companion/use-companion-orchestration';
export { useCompanionData, type UseCompanionDataParams } from './presentation/companion/use-companion-data';
export {
  useCompanionFullViewPage,
  type UseCompanionFullViewPageParams,
} from './presentation/companion/use-companion-fullview-page';
export {
  useCompanionSection,
  type UseCompanionSectionParams,
} from './presentation/companion/use-companion-section';
export {
  useCompanionSectionExpansion,
  type UseCompanionSectionExpansionParams,
} from './presentation/companion/use-companion-section-expansion';
export {
  useGroundingEnrichment,
  type GroundingEnrichment,
} from './presentation/companion/use-grounding-enrichment';
export { usePauseSessionCompanionSnapshot } from './presentation/companion/use-pause-session-companion-snapshot';
export {
  useFullviewTelemetry,
  type FullviewCompanion,
} from './presentation/companion/use-fullview-telemetry';
export { useSignalSourceTrustedHost } from './presentation/companion/use-signal-source-trusted-host';
export { useStaggeredReveal } from './presentation/companion/use-staggered-reveal';
