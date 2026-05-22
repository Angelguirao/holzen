import { describe, expect, it } from 'vitest';

import { trackCompanionGenerationInitiated as trackGenerationDirect } from './companion-generation-telemetry';
import { logCompanionSlotOrchestrateInvoke as logInvokeDirect } from './companion-slot-orchestrate-telemetry';

import {
  logCompanionSlotOrchestrateInvoke,
  trackCompanionGenerationInitiated,
} from './pause-companion-slot-orchestrate-telemetry-flow';

describe('pause-companion-slot-orchestrate-telemetry-flow', () => {
  it('re-exports slot orchestrate PostHog trackers from leaf telemetry modules', () => {
    expect(typeof logCompanionSlotOrchestrateInvoke).toBe('function');
    expect(typeof trackCompanionGenerationInitiated).toBe('function');

    expect(logCompanionSlotOrchestrateInvoke).toBe(logInvokeDirect);
    expect(trackCompanionGenerationInitiated).toBe(trackGenerationDirect);
  });
});
