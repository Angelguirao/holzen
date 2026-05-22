import { describe, expect, it } from 'vitest';

import { runCompanionSlotOrchestrate } from './pause-companion-slot-orchestrate-flow';
import { runCompanionSlotOrchestrate as runSlotOrchestrateDirect } from './run-companion-slot-orchestrate';

describe('pause-companion-slot-orchestrate-flow', () => {
  it('re-exports slot orchestrate use case from run-companion-slot-orchestrate', () => {
    expect(typeof runCompanionSlotOrchestrate).toBe('function');
    expect(runCompanionSlotOrchestrate).toBe(runSlotOrchestrateDirect);
  });
});
