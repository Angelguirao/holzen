import { describe, expect, it } from 'vitest';

import type { PauseImpactData as PauseImpactDataFromDecideFlow } from '@/features/pause/application/use-cases/session/pause-session-decide-flow';
import type { PauseImpactData as PauseImpactDataFromDomain } from '@/features/pause/domain/decide/pause-impact-data';
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

describe('pause-session-decide-io re-exports', () => {
  it('PauseImpactData type peel matches pause-session-decide-flow and domain', () => {
    const ioMatchesFlow: AssertIoMatchesFlow = true;
    const flowMatchesDomain: AssertFlowMatchesDomain = true;
    expect(ioMatchesFlow).toBe(true);
    expect(flowMatchesDomain).toBe(true);
  });

  it('presentation decide-io exports only PauseImpactData type (no runtime hydration)', () => {
    expect(Object.keys(pauseSessionDecideIo)).toEqual([]);
  });
});
