import { describe, expect, it } from 'vitest';

import {
  messageFromReflectGenerationResult,
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '../generation/pause-reflect-generation-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as generationFlow from '../generation/pause-reflect-generation-flow';
import * as stepsFlow from './pause-reflect-steps-flow';

describe('pause-reflect-steps-flow ↔ pause-reflect-generation-flow sibling parity', () => {
  it('steps-flow and generation-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');

    expect('runReflectGeneration' in stepsFlow).toBe(false);
    expect('messageFromReflectGenerationResult' in stepsFlow).toBe(false);
    expect('reflectGenerationPrerequisite' in stepsFlow).toBe(false);
    expect('shouldCommitReflectGeneration' in stepsFlow).toBe(false);
    expect('openManualPauseFromHome' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in generationFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in generationFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in generationFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in generationFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in generationFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in generationFlow).toBe(false);
  });

  it('steps umbrella exports stay off holzen-reflect generation and manual-open', () => {
    expect(runPauseFavoriteToggle).not.toBe(runReflectGeneration);
    expect(runPauseReflectNoteUpdate).not.toBe(runReflectGeneration);
    expect(runPauseReflectTagUpdate).not.toBe(messageFromReflectGenerationResult);
    expect(runPauseReflectionStepLogOnce).not.toBe(reflectGenerationPrerequisite);
    expect(shouldShowFavoriteProHint).not.toBe(shouldCommitReflectGeneration);
    expect(shouldLogPauseReflectionStep).not.toBe(openManualPauseFromHome);
  });

  it('generation umbrella exports stay off step mutations and domain step gates', () => {
    expect(runReflectGeneration).not.toBe(runPauseFavoriteToggle);
    expect(runReflectGeneration).not.toBe(runPauseReflectNoteUpdate);
    expect(messageFromReflectGenerationResult).not.toBe(runPauseReflectTagUpdate);
    expect(reflectGenerationPrerequisite).not.toBe(shouldShowFavoriteProHint);
    expect(shouldCommitReflectGeneration).not.toBe(shouldLogPauseReflectionStep);
    expect(openManualPauseFromHome).not.toBe(runPauseReflectionStepLogOnce);
  });
});
