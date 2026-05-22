/**
 * CI cluster anchor for companion orchestration presentation I/O (§3 / check:architecture-alignment).
 * Composes ritual/frame leaf modules (not orchestration subcluster flow anchors).
 * Presentation: `pause-companion-orchestration-io.ts` imports leaf modules directly.
 */
import { invalidateCompanionUiCompletionQuery } from '@/features/pause/application/queries/companion-ui-completion-query-key';
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

export { invalidateCompanionUiCompletionQuery, nextExpandedWithLazyFetch };

export type { CompanionUiCompletionStep };

export { persistCompanionUiStepCompletion };

export { runToggleCompanionLibraryFavorite };
