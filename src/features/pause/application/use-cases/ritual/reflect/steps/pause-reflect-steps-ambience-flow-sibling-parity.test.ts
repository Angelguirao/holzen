import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '../ambience/pause-reflect-ambience-flow';
import * as ambienceFlow from '../ambience/pause-reflect-ambience-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

/**
 * Flow-level sibling parity: steps-flow vs ambience-flow CI umbrellas.
 * I/O mirror: `pause-reflect-steps-ambience-io-sibling-parity.test.ts` (application + presentation).
 */
describe('pause-reflect-steps-flow ↔ pause-reflect-ambience-flow sibling parity', () => {
  it('steps-flow and ambience-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect('startPauseReflectFrameFocusAmbience' in stepsFlow).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in stepsFlow).toBe(false);

    expect('runPauseFavoriteToggle' in ambienceFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in ambienceFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in ambienceFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in ambienceFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in ambienceFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in ambienceFlow).toBe(false);
  });

  it('steps umbrella exports stay off frame-focus ambience bed', () => {
    expect(runPauseFavoriteToggle).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runPauseReflectNoteUpdate).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(runPauseReflectTagUpdate).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runPauseReflectionStepLogOnce).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(shouldShowFavoriteProHint).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(shouldLogPauseReflectionStep).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('ambience-flow exports stay off step mutations and domain step gates', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runPauseFavoriteToggle);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runPauseReflectNoteUpdate);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runPauseReflectTagUpdate);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runPauseReflectionStepLogOnce);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(shouldShowFavoriteProHint);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(shouldLogPauseReflectionStep);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
