import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle as buildRitualFromLeaf,
  buildPauseSessionStepShellBundle as buildShellFromLeaf,
} from '@/features/pause/application/use-cases/session/step-bundles';
import {
  buildPauseSessionStepRitualBundle as buildRitualFromFlow,
  buildPauseSessionStepShellBundle as buildShellFromFlow,
} from '@/features/pause/application/use-cases/session/pause-session-step-handlers-flow';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';

describe('pause-session-step-handlers-io re-exports', () => {
  it('re-exports step bundle builders from step-bundles leaf module', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromLeaf);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromLeaf);
  });

  it('presentation I/O bindings match pause-session-step-handlers-flow CI anchor (leaf parity)', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromFlow);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromFlow);
  });
});
