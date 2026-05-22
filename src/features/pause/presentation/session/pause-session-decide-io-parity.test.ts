import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

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
import {
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import type { PauseImpactData as PauseImpactDataFromDecideIo } from './pause-session-decide-io';
import * as pauseSessionDecideIo from './pause-session-decide-io';

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
 * Presentation I/O parity (colocated beside `pause-session-decide-io.ts`).
 * Imports `pause-session-decide-flow` CI umbrella and reflect flows-io for sibling distinctness pins only — production decide-io stays type-only from domain.
 */
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

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (restored decide vs reflect+decide I/O).
   * Dedicated sibling file: `pause-reflect-flows-decide-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io reflect+decide exports stay distinct from decide-io type peel', () => {
    expect(initialDecisionFromRestored).not.toBe(pauseReflectOutcomeLog);
    expect(initialPhaseFromRestored).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(initialDecisionFromRestored).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    // Full pins: `pause-reflect-flows-decide-io-sibling-parity.test.ts`.
  });
});
