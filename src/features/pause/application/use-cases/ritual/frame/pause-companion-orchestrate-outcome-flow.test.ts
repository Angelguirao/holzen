import { describe, expect, it } from 'vitest';

import { applyCompanionSlotOrchestrateOutcome } from './pause-companion-orchestrate-outcome-flow';

describe('pause-companion-orchestrate-outcome-flow', () => {
  it('re-exports slot orchestrate outcome apply from apply-companion-slot-orchestrate-outcome', () => {
    expect(typeof applyCompanionSlotOrchestrateOutcome).toBe('function');
  });
});
