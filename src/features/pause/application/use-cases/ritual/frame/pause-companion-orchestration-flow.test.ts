import { describe, expect, it } from 'vitest';

import { loadCompanionOrchestrateSession as loadSessionDirect } from './load-companion-orchestrate-session';
import { nextExpandedWithLazyFetch as nextExpandedDirect } from './next-expanded-with-lazy-fetch';
import { persistCompanionUiStepCompletion as persistDirect } from './persist-ui-step-completion';
import { runToggleCompanionLibraryFavorite as toggleFavoriteDirect } from './run-toggle-companion-library-favorite';

import {
  loadCompanionOrchestrateSession as loadSessionFromSessionFlow,
} from './pause-companion-orchestrate-session-flow';
import {
  runToggleCompanionLibraryFavorite as toggleFavoriteFromLibraryFlow,
} from './pause-companion-library-favorite-flow';
import {
  nextExpandedWithLazyFetch as nextExpandedFromExpansionFlow,
} from './pause-companion-section-expansion-flow';
import {
  persistCompanionUiStepCompletion as persistFromUiCompletionFlow,
} from './pause-companion-ui-completion-flow';
import {
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  persistCompanionUiStepCompletion,
  runToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-flow';

describe('pause-companion-orchestration-flow', () => {
  it('re-exports orchestration leaf modules for session load, UI completion, expansion, and favorites', () => {
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof persistCompanionUiStepCompletion).toBe('function');
    expect(typeof runToggleCompanionLibraryFavorite).toBe('function');

    expect(loadCompanionOrchestrateSession).toBe(loadSessionDirect);
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedDirect);
    expect(persistCompanionUiStepCompletion).toBe(persistDirect);
    expect(runToggleCompanionLibraryFavorite).toBe(toggleFavoriteDirect);
  });

  it('umbrella bindings match orchestration subcluster CI anchors (leaf parity)', () => {
    expect(loadCompanionOrchestrateSession).toBe(loadSessionFromSessionFlow);
    expect(nextExpandedWithLazyFetch).toBe(nextExpandedFromExpansionFlow);
    expect(persistCompanionUiStepCompletion).toBe(persistFromUiCompletionFlow);
    expect(runToggleCompanionLibraryFavorite).toBe(toggleFavoriteFromLibraryFlow);
  });
});
