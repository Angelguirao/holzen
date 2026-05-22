import { describe, expect, it } from 'vitest';

import { applyCompanionOrchestrateRetryReset } from './pause-companion-orchestrate-retry-flow';

describe('pause-companion-orchestrate-retry-flow', () => {
  it('re-exports orchestrate retry reset from apply-companion-orchestrate-retry-reset', () => {
    expect(typeof applyCompanionOrchestrateRetryReset).toBe('function');
  });
});
