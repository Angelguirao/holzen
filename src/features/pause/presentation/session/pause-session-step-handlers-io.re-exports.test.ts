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
  buildPauseSessionStepTransitionConfig,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-io';
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

  /**
   * Reciprocal inline pins ↔ `pause-session-step-transition-io.re-exports.test.ts` (bundle vs motion).
   * Dedicated sibling file: `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts`.
   * Cross-layer flow anchor: `pause-session-step-handlers-flow-io-wrapper-sibling-parity.test.ts`.
   */
  it('sibling cluster: step-transition-io exports stay distinct from step-handlers-io re-exports', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
    // Reciprocal inline pins: `pause-session-step-transition-io.re-exports.test.ts`.
  });
});
