import { describe, expect, it } from 'vitest';

import {
  invalidateCompanionUiCompletionQuery,
  persistCompanionUiStepCompletion,
} from './pause-companion-ui-completion-flow';

describe('pause-companion-ui-completion-flow', () => {
  it('re-exports UI step completion persist and query invalidation', () => {
    expect(typeof persistCompanionUiStepCompletion).toBe('function');
    expect(typeof invalidateCompanionUiCompletionQuery).toBe('function');
  });
});
