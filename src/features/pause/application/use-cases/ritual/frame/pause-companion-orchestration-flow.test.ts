import { describe, expect, it } from 'vitest';

import { invalidateCompanionUiCompletionQuery } from '@/features/pause/infrastructure/queries/companion/companion-ui-completion-query-key';
import {
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  persistCompanionUiStepCompletion,
  runToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-flow';

describe('pause-companion-orchestration-flow', () => {
  it('re-exports orchestration leaf modules for session load, UI completion, expansion, and favorites', () => {
    expect(typeof loadCompanionOrchestrateSession).toBe('function');
    expect(typeof invalidateCompanionUiCompletionQuery).toBe('function');
    expect(typeof nextExpandedWithLazyFetch).toBe('function');
    expect(typeof persistCompanionUiStepCompletion).toBe('function');
    expect(typeof runToggleCompanionLibraryFavorite).toBe('function');
  });
});
