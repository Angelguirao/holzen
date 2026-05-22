import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  PAUSE_SESSION_STEP_TRANSITION_EASE,
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
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';

describe('pause-session-step-handlers-io', () => {
  it('re-exports bundle builders from step-bundles', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromLeaf);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromLeaf);
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-transition-io.test.ts` (step bundles vs motion I/O).
   * Dedicated sibling file: `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: step-transition-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepShellBundle).not.toBe(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX);
    expect(buildPauseSessionStepRitualBundle).not.toBe(PAUSE_SESSION_STEP_TRANSITION_DURATION_S);
    expect(buildPauseSessionStepShellBundle).not.toBe(PAUSE_SESSION_STEP_TRANSITION_DURATION_REDUCED_S);
    expect(buildPauseSessionStepRitualBundle).not.toBe(PAUSE_SESSION_STEP_TRANSITION_EASE);
    // Reciprocal inline pins: `pause-session-step-transition-io.test.ts`.
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

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io.test.ts` (session bundles vs reflect RPC).
   * Dedicated sibling file: `pause-session-step-handlers-steps-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: reflect steps-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectTagUpdate);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectNoteUpdate);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectFavoriteToggle);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectionStepLogOnce);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(buildPauseSessionStepShellBundle).not.toBe(shouldShowFavoriteProHint);
    expect(buildPauseSessionStepRitualBundle).not.toBe(shouldLogPauseReflectionStep);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectFavoriteToggleWithRepository);
    // Full cross-I/O pins: `pause-session-step-handlers-steps-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io.test.ts` (session bundles vs reflect+decide flows I/O).
   * Dedicated sibling file: `pause-session-step-handlers-flows-io-sibling-parity.test.ts`.
   */
  it('sibling cluster: reflect flows-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectOutcomeLog);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(buildPauseSessionStepShellBundle).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildPauseSessionStepRitualBundle).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseScoreImpacts);
    expect(buildPauseSessionStepRitualBundle).not.toBe(formatReinforcementQuoteFromSession);
    expect(buildPauseSessionStepShellBundle).not.toBe(reflectPauseRepository);
    // Full cross-I/O pins: `pause-session-step-handlers-flows-io-sibling-parity.test.ts`.
  });
});
