import { describe, expect, it } from 'vitest';

import {
  buildPauseSessionStepRitualBundle,
  buildPauseSessionStepShellBundle,
} from './pause-session-step-handlers-flow';
import * as handlersFlow from './pause-session-step-handlers-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';
import * as stepsFlow from '@/features/pause/application/use-cases/ritual/reflect/steps/pause-reflect-steps-flow';

/**
 * Cross-surface application sibling parity: session step-handlers-flow vs reflect steps-flow.
 * Complements presentation `pause-session-step-handlers-steps-io-sibling-parity.test.ts`.
 */
describe('pause-session-step-handlers-flow ↔ pause-reflect-steps-flow sibling parity', () => {
  it('step-handlers-flow and reflect steps-flow are distinct CI anchors', () => {
    expect(typeof buildPauseSessionStepShellBundle).toBe('function');
    expect(typeof buildPauseSessionStepRitualBundle).toBe('function');
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect('buildPauseSessionStepShellBundle' in stepsFlow).toBe(false);
    expect('buildPauseSessionStepRitualBundle' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in handlersFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in handlersFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in handlersFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in handlersFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in handlersFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in handlersFlow).toBe(false);
  });

  it('step-handlers umbrella exports stay off reflect step use cases and domain gates', () => {
    expect(buildPauseSessionStepShellBundle).not.toBe(runPauseFavoriteToggle);
    expect(buildPauseSessionStepRitualBundle).not.toBe(runPauseReflectNoteUpdate);
    expect(buildPauseSessionStepShellBundle).not.toBe(runPauseReflectTagUpdate);
    expect(buildPauseSessionStepRitualBundle).not.toBe(runPauseReflectionStepLogOnce);
    expect(buildPauseSessionStepShellBundle).not.toBe(shouldShowFavoriteProHint);
    expect(buildPauseSessionStepRitualBundle).not.toBe(shouldLogPauseReflectionStep);
  });

  it('reflect steps umbrella exports stay off session step bundle builders', () => {
    expect(runPauseFavoriteToggle).not.toBe(buildPauseSessionStepShellBundle);
    expect(runPauseReflectNoteUpdate).not.toBe(buildPauseSessionStepRitualBundle);
    expect(runPauseReflectTagUpdate).not.toBe(buildPauseSessionStepShellBundle);
    expect(runPauseReflectionStepLogOnce).not.toBe(buildPauseSessionStepRitualBundle);
    expect(shouldShowFavoriteProHint).not.toBe(buildPauseSessionStepShellBundle);
    expect(shouldLogPauseReflectionStep).not.toBe(buildPauseSessionStepRitualBundle);
  });
});
