import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle as buildRitualFromLeaf,
  buildPauseSessionStepShellBundle as buildShellFromLeaf,
} from '@/features/pause/application/use-cases/session/step-bundles';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/application/use-cases/session/pause-session-step-handlers-flow';
import {
  buildPauseSessionStepRitualBundle as buildRitualFromStepHandlersIo,
  buildPauseSessionStepShellBundle as buildShellFromStepHandlersIo,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';

describe('pause-session-step-handlers-io parity', () => {
  it('presentation I/O bundle builders match step-handlers CI umbrella', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromStepHandlersIo);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromStepHandlersIo);
  });

  it('step-handlers CI umbrella composes the same step-bundles leaf as presentation I/O', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromLeaf);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromLeaf);
  });
});
