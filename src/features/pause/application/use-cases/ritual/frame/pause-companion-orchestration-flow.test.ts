import { describe, expect, it } from 'vitest';

import { loadCompanionOrchestrateSession as loadSessionDirect } from './load-companion-orchestrate-session';
import { nextExpandedWithLazyFetch as nextExpandedDirect } from './next-expanded-with-lazy-fetch';
import { persistCompanionUiStepCompletion as persistDirect } from './persist-ui-step-completion';
import { runToggleCompanionLibraryFavorite as toggleFavoriteDirect } from './run-toggle-companion-library-favorite';

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
});
