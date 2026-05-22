import { describe, expect, it } from 'vitest';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepTransitionConfig,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-io';
import {
  buildPauseSessionPersistSnapshot,
  computePauseStorageRitualSyncPatch,
} from './scaffold/pause-session-scaffold-io';
import {
  buildPauseSessionStepRitualBundle as buildRitualFromLeaf,
  buildPauseSessionStepShellBundle as buildShellFromLeaf,
} from '@/features/pause/application/use-cases/session/step-bundles';

describe('pause-session-step-handlers-io', () => {
  it('re-exports bundle builders from step-bundles', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromLeaf);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromLeaf);
  });

  it('sibling cluster: step-transition-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
    // Full cross-I/O pins: `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `scaffold/pause-session-scaffold-io.test.ts` (step-handlers-io cluster).
   * Dedicated sibling file: `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: scaffold-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionPersistSnapshot);
    expect(buildPauseSessionStepRitualBundle).not.toBe(computePauseStorageRitualSyncPatch);
    // Full cross-I/O pins: `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts`.
  });
});
