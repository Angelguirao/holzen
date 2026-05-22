import { describe, expect, it } from 'vitest';

import {
  runPauseFavoriteToggle,
  shouldShowFavoriteProHint,
} from './pause-favorite-toggle-flow';
import {
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
} from './pause-reflection-step-log-flow';
import * as favoriteFlow from './pause-favorite-toggle-flow';
import * as reflectionStepLogFlow from './pause-reflection-step-log-flow';

describe('pause-favorite-toggle-flow ↔ pause-reflection-step-log-flow sibling parity', () => {
  it('favorite-toggle-flow and reflection-step-log-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect('runPauseFavoriteToggle' in favoriteFlow).toBe(true);
    expect('shouldShowFavoriteProHint' in favoriteFlow).toBe(true);
    expect('runPauseReflectionStepLogOnce' in favoriteFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in favoriteFlow).toBe(false);

    expect('runPauseReflectionStepLogOnce' in reflectionStepLogFlow).toBe(true);
    expect('shouldLogPauseReflectionStep' in reflectionStepLogFlow).toBe(true);
    expect('runPauseFavoriteToggle' in reflectionStepLogFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in reflectionStepLogFlow).toBe(false);
  });

  it('favorite umbrella exports stay off reflection_step log leaf bindings', () => {
    expect(runPauseFavoriteToggle).not.toBe(runPauseReflectionStepLogOnce);
    expect(shouldShowFavoriteProHint).not.toBe(shouldLogPauseReflectionStep);
    expect(runPauseFavoriteToggle).not.toBe(shouldLogPauseReflectionStep);
    expect(shouldShowFavoriteProHint).not.toBe(runPauseReflectionStepLogOnce);
  });

  it('reflection_step log umbrella exports stay off favorite toggle leaf bindings', () => {
    expect(runPauseReflectionStepLogOnce).not.toBe(runPauseFavoriteToggle);
    expect(shouldLogPauseReflectionStep).not.toBe(shouldShowFavoriteProHint);
    expect(runPauseReflectionStepLogOnce).not.toBe(shouldShowFavoriteProHint);
    expect(shouldLogPauseReflectionStep).not.toBe(runPauseFavoriteToggle);
  });
});
