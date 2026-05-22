import { describe, expect, it } from 'vitest';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepRitualBundle as buildRitualFromLeaf,
  buildPauseSessionStepShellBundle as buildShellFromLeaf,
} from '@/features/pause/application/use-cases/session/step-bundles';

describe('pause-session-step-handlers-io', () => {
  it('re-exports bundle builders from step-bundles', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromLeaf);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromLeaf);
  });
});
