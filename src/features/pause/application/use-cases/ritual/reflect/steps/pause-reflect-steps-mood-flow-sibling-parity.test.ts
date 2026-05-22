import { describe, expect, it } from 'vitest';

import {
  buildFeelTilesMoodLogOptions,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '../mood/pause-reflect-mood-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as moodFlow from '../mood/pause-reflect-mood-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

/**
 * Flow-level sibling parity (presentation I/O mirror:
 * `pause-reflect-steps-mood-io-sibling-parity.test.ts` application + presentation).
 */
describe('pause-reflect-steps-flow ↔ pause-reflect-mood-flow sibling parity', () => {
  it('steps-flow and mood-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');

    expect('runInitialEmotionSelect' in stepsFlow).toBe(false);
    expect('runInitialEmotionSkip' in stepsFlow).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in moodFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in moodFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in moodFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in moodFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in moodFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in moodFlow).toBe(false);
  });

  it('steps umbrella exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(runPauseFavoriteToggle).not.toBe(runInitialEmotionSelect);
    expect(runPauseReflectNoteUpdate).not.toBe(runInitialEmotionSkip);
    expect(runPauseReflectTagUpdate).not.toBe(buildFeelTilesMoodLogOptions);
    expect(runPauseReflectionStepLogOnce).not.toBe(runInitialEmotionSelect);
    expect(shouldShowFavoriteProHint).not.toBe(buildFeelTilesMoodLogOptions);
    expect(shouldLogPauseReflectionStep).not.toBe(runInitialEmotionSkip);
  });

  it('mood umbrella exports stay off step mutations and domain step gates', () => {
    expect(runInitialEmotionSelect).not.toBe(runPauseFavoriteToggle);
    expect(runInitialEmotionSkip).not.toBe(runPauseReflectNoteUpdate);
    expect(buildFeelTilesMoodLogOptions).not.toBe(runPauseReflectTagUpdate);
    expect(runInitialEmotionSelect).not.toBe(shouldShowFavoriteProHint);
    expect(buildFeelTilesMoodLogOptions).not.toBe(shouldLogPauseReflectionStep);
  });
});
