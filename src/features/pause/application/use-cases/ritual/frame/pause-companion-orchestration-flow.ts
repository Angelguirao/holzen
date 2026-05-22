/**
 * CI cluster anchor for companion orchestration presentation I/O (§3 / check:architecture-alignment).
 * Composes orchestration subcluster anchors; presentation imports via `pause-companion-orchestration-io.ts`.
 */
export {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from './pause-companion-orchestrate-session-flow';
export { nextExpandedWithLazyFetch } from './pause-companion-section-expansion-flow';
export {
  invalidateCompanionUiCompletionQuery,
  persistCompanionUiStepCompletion,
  type CompanionUiCompletionStep,
} from './pause-companion-ui-completion-flow';
export { runToggleCompanionLibraryFavorite } from './pause-companion-library-favorite-flow';
