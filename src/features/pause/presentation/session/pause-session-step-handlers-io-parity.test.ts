/**
 * Presentation I/O parity (colocated beside `pause-session-step-handlers-io.ts`).
 * Imports `pause-session-step-handlers-flow` CI umbrella for `.toBe` identity pins only — production step-handlers I/O keeps `step-bundles` leaf import.
 * Application flow/sibling parity tests stay under `application/.../session/`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import {
  buildPauseSessionStepRitualBundle as buildRitualFromLeaf,
  buildPauseSessionStepShellBundle as buildShellFromLeaf,
} from '@/features/pause/application/use-cases/session/step-bundles';
import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from '@/features/pause/application/use-cases/session/pause-session-step-handlers-flow';
import {
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
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
  buildPauseSessionStepRitualBundle as buildRitualFromStepHandlersIo,
  buildPauseSessionStepShellBundle as buildShellFromStepHandlersIo,
} from './pause-session-step-handlers-io';
import {
  buildPauseSessionStepTransitionConfig,
  PAUSE_SESSION_STEP_SLIDE_OFFSET_PX,
  PAUSE_SESSION_STEP_TRANSITION_DURATION_S,
  pauseStepSwipeDirection,
} from './pause-session-step-transition-io';
import {
  buildPauseSessionPersistSnapshot,
  buildPauseSessionScaffoldRitualDerived,
  computePauseStorageRitualSyncPatch,
  hasPersistablePauseSessionAnchor,
} from './scaffold/pause-session-scaffold-io';

describe('pause-session-step-handlers-io parity', () => {
  it('presentation I/O bundle builders match step-handlers CI umbrella', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromStepHandlersIo);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromStepHandlersIo);
  });

  it('step-handlers CI umbrella composes the same step-bundles leaf as presentation I/O', () => {
    expect(buildPauseSessionStepShellBundle).toBe(buildShellFromLeaf);
    expect(buildPauseSessionStepRitualBundle).toBe(buildRitualFromLeaf);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (session bundles vs reflect RPC).
   * Dedicated sibling file: `pause-session-step-handlers-steps-io-sibling-parity.test.ts` (application);
   * presentation mirror: `pause-session-step-handlers-steps-io-sibling-parity.test.ts` under `presentation/session/`.
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
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (session bundles vs reflect+decide).
   * Dedicated sibling file: `pause-session-step-handlers-flows-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: reflect flows-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseReflectOutcomeLog);
    expect(buildPauseSessionStepRitualBundle).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildPauseSessionStepShellBundle).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseReflectOutcomeLog);
    // Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts`.
    // Full pins: `pause-session-step-handlers-flows-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-step-transition-io-parity.test.ts` (session bundles vs Framer motion).
   * Dedicated sibling file: `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: step-transition-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionStepTransitionConfig);
    expect(buildPauseSessionStepShellBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepRitualBundle).not.toBe(pauseStepSwipeDirection);
    expect(buildPauseSessionStepShellBundle).not.toBe(PAUSE_SESSION_STEP_SLIDE_OFFSET_PX);
    expect(buildPauseSessionStepRitualBundle).not.toBe(PAUSE_SESSION_STEP_TRANSITION_DURATION_S);
    // Reciprocal inline pins: `pause-session-step-transition-io-parity.test.ts` (colocated under `presentation/session/`).
    // Full pins: `pause-session-step-handlers-step-transition-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-session-scaffold-io-parity.test.ts` (step bundles vs persist/sync/derived).
   * Dedicated sibling file: `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: scaffold-io exports stay distinct from step-handlers-io', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionPersistSnapshot);
    expect(buildPauseSessionStepRitualBundle).not.toBe(computePauseStorageRitualSyncPatch);
    expect(buildPauseSessionStepShellBundle).not.toBe(buildPauseSessionScaffoldRitualDerived);
    expect(buildPauseSessionStepRitualBundle).not.toBe(hasPersistablePauseSessionAnchor);
    expect(buildPauseSessionStepShellBundle).not.toBe(hasPersistablePauseSessionAnchor);
    expect(buildPauseSessionStepRitualBundle).not.toBe(buildPauseSessionPersistSnapshot);
    // Reciprocal inline pins: `scaffold/pause-session-scaffold-io-parity.test.ts`.
    // Full pins: `pause-session-scaffold-step-handlers-io-sibling-parity.test.ts`.
  });
});
