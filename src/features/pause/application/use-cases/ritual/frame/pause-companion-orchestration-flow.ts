/**
 * CI cluster anchor for companion orchestration presentation I/O (§3 / check:architecture-alignment).
 * Composes ritual/frame leaf modules (not orchestration subcluster flow anchors).
 * Sibling CI anchor: `pause-companion-section-visibility-flow` (visibility only; composed by frame-ui-flow).
 * Presentation: `pause-companion-orchestration-io.ts` imports leaf modules directly.
 * Parity: `pause-companion-orchestration-section-visibility-sibling-parity.test.ts`;
 * `pause-companion-orchestrate-orchestration-flow-sibling-parity.test.ts` ↔ `pause-companion-orchestrate-flow`;
 * `pause-companion-frame-ui-orchestration-flow-sibling-parity.test.ts` ↔ `pause-companion-frame-ui-flow`.
 */
import {
  loadCompanionOrchestrateSession,
  type LoadCompanionOrchestrateSessionInput,
  type LoadCompanionOrchestrateSessionPorts,
} from './load-companion-orchestrate-session';
import type { CompanionUiCompletionStep } from './companion-ui-completion-types';
import { nextExpandedWithLazyFetch } from './next-expanded-with-lazy-fetch';
import { persistCompanionUiStepCompletion } from './persist-ui-step-completion';
import { runToggleCompanionLibraryFavorite } from './run-toggle-companion-library-favorite';

export type { LoadCompanionOrchestrateSessionInput, LoadCompanionOrchestrateSessionPorts };

export { loadCompanionOrchestrateSession };

export { nextExpandedWithLazyFetch };

export type { CompanionUiCompletionStep };

export { persistCompanionUiStepCompletion };

export { runToggleCompanionLibraryFavorite };
