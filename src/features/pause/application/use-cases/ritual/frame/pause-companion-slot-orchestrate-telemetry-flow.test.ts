import { describe, expect, it } from 'vitest';

import {
  logCompanionSlotOrchestrateInvoke,
  trackCompanionGenerationInitiated,
} from './pause-companion-slot-orchestrate-telemetry-flow';

describe('pause-companion-slot-orchestrate-telemetry-flow', () => {
  it('re-exports slot orchestrate PostHog trackers from leaf telemetry modules', () => {
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');
  });
});
