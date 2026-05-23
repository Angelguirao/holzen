import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-flow';
import {
  buildPauseSessionStepRitualBundle as buildRitualDirect,
  buildPauseSessionStepShellBundle as buildShellDirect,
} from './step-bundles';
import {
  buildPauseSessionStepTransitionConfig,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-flow';
import {
  buildPauseScoreImpacts,
  resolvePauseSessionReflectAndDecidePreflight,
  runPauseOutcomeLog,
} from '@/features/pause/application/use-cases/ritual/reflect/flows/pause-reflect-flows-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import {
  buildPauseSessionStepRitualBundle as buildRitualFromHandlersIo,
  buildPauseSessionStepShellBundle as buildShellFromHandlersIo,
} from '@/features/pause/presentation/session/pause-session-step-handlers-io';

describe('pause-session-step-handlers-flow', () => {
  it('re-exports step bundle builders from step-bundles', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');
    expect(buildPauseSessionStepShellBundle).toBe(buildShellDirect);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualDirect);
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-handlers-io.test.ts` (flow CI umbrella vs presentation I/O).
   * Dedicated sibling file: `pause-session-step-handlers-flow-io-wrapper-sibling-parity.test.ts` (application);
   * presentation mirror: `presentation/session/pause-session-step-handlers-flow-io-wrapper-sibling-parity.test.ts`.
   */
  it('sibling cluster: step-handlers-io bundle exports align with flow umbrella (wrapper parity)', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromHandlersIo);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromHandlersIo);
    expect(buildPauseSessionStepShellBundle).not.toBe(runPauseFavoriteToggle);
    expect(buildPauseSessionStepRitualBundle).not.toBe(runPauseReflectNoteUpdate);
    expect(buildPauseSessionStepShellBundle).not.toBe(runPauseReflectTagUpdate);
    expect(buildPauseSessionStepRitualBundle).not.toBe(runPauseReflectionStepLogOnce);
    // Reciprocal inline pins: `pause-session-step-handlers-io.test.ts`.
  });

  it('sibling cluster: step-transition-flow exports stay distinct from step-handlers umbrella exports', () => {
    // Full cross-flow pins: `pause-session-step-handlers-step-transition-flow-sibling-parity.test.ts`.
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-flow.test.ts` (session bundles vs reflect step RPC).
   * Dedicated sibling file: `pause-session-step-handlers-steps-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: reflect steps-flow exports stay distinct from step-handlers umbrella exports', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(runPauseFavoriteToggle);
    expect(buildPauseSessionStepRitualBundle).not.toBe(runPauseReflectNoteUpdate);
    expect(buildPauseSessionStepShellBundle).not.toBe(runPauseReflectTagUpdate);
    expect(buildPauseSessionStepRitualBundle).not.toBe(runPauseReflectionStepLogOnce);
    expect(buildPauseSessionStepShellBundle).not.toBe(shouldShowFavoriteProHint);
    expect(buildPauseSessionStepRitualBundle).not.toBe(shouldLogPauseReflectionStep);
    // Reciprocal inline pins: `pause-reflect-steps-flow.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-flow.test.ts`. Full cross-flow pins:
   * `pause-session-step-handlers-flows-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: reflect flows-flow exports stay distinct from step-handlers-flow', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildPauseSessionStepRitualBundle).not.toBe(runPauseOutcomeLog);
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseScoreImpacts);
    // Full cross-flow pins: `pause-session-step-handlers-flows-flow-sibling-parity.test.ts`.
  });
});
