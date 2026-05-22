import { describe, expect, it } from 'vitest';

import { resetInterventionIdempotency as resetIdempotencyDirect } from './intervention-idempotency';
import { runCompanionInterventionBootstrap as runBootstrapDirect } from './run-companion-intervention-bootstrap';

import {
  resetInterventionIdempotency,
  runCompanionInterventionBootstrap,
} from './pause-companion-intervention-orchestrate-flow';

describe('pause-companion-intervention-orchestrate-flow', () => {
  it('re-exports intervention bootstrap and idempotency reset from leaf modules', () => {
    expect(typeof runCompanionInterventionBootstrap).toBe('function');
    expect(typeof resetInterventionIdempotency).toBe('function');

    expect(runCompanionInterventionBootstrap).toBe(runBootstrapDirect);
    expect(resetInterventionIdempotency).toBe(resetIdempotencyDirect);
  });
});
