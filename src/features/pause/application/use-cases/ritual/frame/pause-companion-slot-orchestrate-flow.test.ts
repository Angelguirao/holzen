import { describe, expect, it } from 'vitest';

import { runCompanionSlotOrchestrate as runSlotOrchestrateDirect } from './run-companion-slot-orchestrate';

import { runCompanionSlotOrchestrate } from './pause-companion-slot-orchestrate-flow';

describe('pause-companion-slot-orchestrate-flow', () => {
  it('re-exports slot orchestrate use case from run-companion-slot-orchestrate', () => {
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateDirect);
  });
});
