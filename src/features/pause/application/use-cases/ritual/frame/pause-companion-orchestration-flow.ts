/**
 * CI cluster anchor for companion orchestration presentation I/O (§3 / check:architecture-alignment).
 * Session load, UI completion, favorites, and section expansion live in sibling `ritual/frame/*` modules.
 * Re-export for presentation I/O imports.
 */
export type { CompanionUiCompletionStep } from './companion-ui-completion-types';
export {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from './load-companion-orchestrate-session';
export { nextExpandedWithLazyFetch } from './next-expanded-with-lazy-fetch';
export { persistCompanionUiStepCompletion } from './persist-ui-step-completion';
export { runToggleCompanionLibraryFavorite } from './run-toggle-companion-library-favorite';
