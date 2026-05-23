/**
 * CI cluster anchor for ritual decide impact payload (§3 / application imports).
 * Pure builder lives in domain; re-export for application-layer imports.
 */
export {
  buildPauseImpactDataOnComplete,
  type BuildPauseImpactDataOnCompleteInput,
  type PauseImpactData,
} from '@/features/pause/domain/decide/build-pause-impact-data-on-complete';
