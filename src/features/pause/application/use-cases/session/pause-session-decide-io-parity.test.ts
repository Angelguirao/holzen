import { describe, expect, it } from 'vitest';

import {
  initialDecisionFromRestored as initialDecisionDirect,
  initialPhaseFromRestored as initialPhaseDirect,
} from '@/features/pause/application/use-cases/ritual/decide/restored-decide-ritual-state';
import type { PauseImpactData as PauseImpactDataFromDomain } from '@/features/pause/domain/decide/pause-impact-data';
import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from './pause-session-decide-flow';
import type { PauseImpactData as PauseImpactDataFromDecideFlow } from './pause-session-decide-flow';
import type { PauseImpactData as PauseImpactDataFromDecideIo } from '@/features/pause/presentation/session/pause-session-decide-io';

/** Compile-time: presentation decide-io type peel matches flow + domain. */
type AssertIoMatchesFlow = PauseImpactDataFromDecideIo extends PauseImpactDataFromDecideFlow
  ? PauseImpactDataFromDecideFlow extends PauseImpactDataFromDecideIo
    ? true
    : false
  : false;
type AssertFlowMatchesDomain = PauseImpactDataFromDecideFlow extends PauseImpactDataFromDomain
  ? PauseImpactDataFromDomain extends PauseImpactDataFromDecideFlow
    ? true
    : false
  : false;

/**
 * Application decide I/O parity (colocated beside `pause-session-decide-flow.ts`).
 * Presentation mirror: `presentation/session/pause-session-decide-io-parity.test.ts`.
 * Production decide I/O stays type-only (`PauseImpactData` peel); hydration pins use this flow anchor.
 */
describe('pause-session-decide-io parity (application)', () => {
  it('PauseImpactData type peel matches pause-session-decide-flow and domain', () => {
    const ioMatchesFlow: AssertIoMatchesFlow = true;
    const flowMatchesDomain: AssertFlowMatchesDomain = true;
    expect(ioMatchesFlow).toBe(true);
    expect(flowMatchesDomain).toBe(true);
  });

  it('decide-flow CI umbrella composes restored-decide ritual leaf modules', () => {
    expect(initialDecisionFromRestored).toBe(initialDecisionDirect);
    expect(initialPhaseFromRestored).toBe(initialPhaseDirect);
  });
});
