import { describe, expect, it } from 'vitest';

import {
  initialDecisionFromRestored,
  initialPhaseFromRestored,
} from '@/features/pause/application/use-cases/ritual/decide/restored-decide-ritual-state';
import {
  initialDecisionFromRestored as initialDecisionFromDecideFlow,
  initialPhaseFromRestored as initialPhaseFromDecideFlow,
} from '@/features/pause/application/use-cases/session/pause-session-decide-flow';
import type { PauseImpactData as PauseImpactDataFromDecideFlow } from '@/features/pause/application/use-cases/session/pause-session-decide-flow';
import type { PauseImpactData as PauseImpactDataFromDomain } from '@/features/pause/domain/decide/pause-impact-data';
import type { PauseImpactData as PauseImpactDataFromDecideIo } from '@/features/pause/presentation/session/pause-session-decide-io';
import * as pauseSessionDecideIo from '@/features/pause/presentation/session/pause-session-decide-io';

/** Compile-time: presentation decide-io type peel matches flow + domain. */
type AssertIoMatchesFlow = PauseImpactDataFromIo extends PauseImpactDataFromDecideFlow
  ? PauseImpactDataFromDecideFlow extends PauseImpactDataFromIo
    ? true
    : false
  : false;
type AssertFlowMatchesDomain = PauseImpactDataFromDecideFlow extends PauseImpactDataFromDomain
  ? PauseImpactDataFromDomain extends PauseImpactDataFromDecideFlow
    ? true
    : false
  : false;

describe('pause-session-decide-io parity', () => {
  it('PauseImpactData type peel matches pause-session-decide-flow and domain', () => {
    const ioMatchesFlow: AssertIoMatchesFlow = true;
    const flowMatchesDomain: AssertFlowMatchesDomain = true;
    expect(ioMatchesFlow).toBe(true);
    expect(flowMatchesDomain).toBe(true);
  });

  it('presentation decide-io exports only PauseImpactData (hydration stays on decide-flow)', () => {
    expect(Object.keys(pauseSessionDecideIo)).toEqual([]);
    expect(pauseSessionDecideIo).not.toHaveProperty('initialDecisionFromRestored');
    expect(pauseSessionDecideIo).not.toHaveProperty('initialPhaseFromRestored');
  });

  it('decide-flow CI umbrella composes restored-decide ritual leaf modules', () => {
    expect(initialDecisionFromRestored).toBe(initialDecisionFromDecideFlow);
    expect(initialPhaseFromRestored).toBe(initialPhaseFromDecideFlow);
  });
});
