import { describe, expect, it } from 'vitest';

import {
  buildFeelTilesMoodLogOptions,
  runInitialEmotionSelect,
  runInitialEmotionSkip,
} from '../mood/pause-reflect-mood-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  runReflectGeneration,
} from './pause-reflect-generation-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as moodFlow from '../mood/pause-reflect-mood-flow';

describe('pause-reflect-generation-flow ↔ pause-reflect-mood-flow sibling parity', () => {
  it('generation-flow and mood-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runInitialEmotionSelect).toBe('function');
    expect(typeof runInitialEmotionSkip).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');

    expect('runInitialEmotionSelect' in generationFlow).toBe(false);
    expect('runInitialEmotionSkip' in generationFlow).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in generationFlow).toBe(false);
    expect('runReflectGeneration' in moodFlow).toBe(false);
    expect('openManualPauseFromHome' in moodFlow).toBe(false);
    expect('dismissOpenPauseHome' in moodFlow).toBe(false);
    expect('reflectGenerationPrerequisite' in moodFlow).toBe(false);
  });

  it('generation umbrella exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(runReflectGeneration).not.toBe(runInitialEmotionSelect);
    expect(runReflectGeneration).not.toBe(runInitialEmotionSkip);
    expect(openManualPauseFromHome).not.toBe(buildFeelTilesMoodLogOptions);
    expect(dismissOpenPauseHome).not.toBe(runInitialEmotionSelect);
    expect(reflectGenerationPrerequisite).not.toBe(buildFeelTilesMoodLogOptions);
    expect(openManualPauseFromHome).not.toBe(runInitialEmotionSkip);
  });

  it('mood umbrella exports stay off holzen-reflect generation and manual-open', () => {
    expect(runInitialEmotionSelect).not.toBe(runReflectGeneration);
    expect(runInitialEmotionSkip).not.toBe(runReflectGeneration);
    expect(buildFeelTilesMoodLogOptions).not.toBe(openManualPauseFromHome);
    expect(runInitialEmotionSelect).not.toBe(dismissOpenPauseHome);
    expect(buildFeelTilesMoodLogOptions).not.toBe(reflectGenerationPrerequisite);
    expect(runInitialEmotionSkip).not.toBe(openManualPauseFromHome);
  });
});
