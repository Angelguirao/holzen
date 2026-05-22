import { describe, expect, it } from 'vitest';

import {
  messageFromReflectGenerationResult,
  reflectGenerationPrerequisite,
  reflectGenerationUserErrorMessage,
  resolveEffectiveReflectionCopy,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from './holzen-reflect/pause-reflect-generation-hook-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  runOpenManualPauseSilentModeAfterCreate,
  runPersistSilentReflectionStub,
} from './manual-open/pause-reflect-generation-manual-open-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as hookFlow from './holzen-reflect/pause-reflect-generation-hook-flow';
import * as manualOpenFlow from './manual-open/pause-reflect-generation-manual-open-flow';

describe('pause-reflect-generation-flow ↔ pause-reflect-generation-manual-open-flow sibling parity', () => {
  it('generation-flow and manual-open-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');
    expect(typeof runOpenManualPauseSilentModeAfterCreate).toBe('function');
    expect(typeof runPersistSilentReflectionStub).toBe('function');

    expect('runReflectGeneration' in manualOpenFlow).toBe(false);
    expect('reflectGenerationPrerequisite' in manualOpenFlow).toBe(false);
    expect('resolveReflectGenerationPrefetch' in manualOpenFlow).toBe(false);
    expect('messageFromReflectGenerationResult' in manualOpenFlow).toBe(false);
    expect('openManualPauseFromHome' in hookFlow).toBe(false);
    expect('dismissOpenPauseHome' in hookFlow).toBe(false);
    expect('runOpenManualPauseSilentModeAfterCreate' in hookFlow).toBe(false);
    expect('runPersistSilentReflectionStub' in hookFlow).toBe(false);
  });

  it('holzen-reflect hook-flow exports stay off manual-open Home use cases', () => {
    expect(runReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(runReflectGeneration).not.toBe(dismissOpenPauseHome);
    expect(reflectGenerationPrerequisite).not.toBe(runOpenManualPauseSilentModeAfterCreate);
    expect(resolveReflectGenerationPrefetch).not.toBe(runPersistSilentReflectionStub);
    expect(shouldCommitReflectGeneration).not.toBe(openManualPauseFromHome);
    expect(messageFromReflectGenerationResult).not.toBe(dismissOpenPauseHome);
    expect(reflectGenerationUserErrorMessage).not.toBe(runPersistSilentReflectionStub);
    expect(resolveEffectiveReflectionCopy).not.toBe(runOpenManualPauseSilentModeAfterCreate);
  });

  it('manual-open-flow exports stay off holzen-reflect generation hook helpers', () => {
    expect(openManualPauseFromHome).not.toBe(runReflectGeneration);
    expect(dismissOpenPauseHome).not.toBe(reflectGenerationPrerequisite);
    expect(runOpenManualPauseSilentModeAfterCreate).not.toBe(resolveReflectGenerationPrefetch);
    expect(runPersistSilentReflectionStub).not.toBe(shouldClearReflectGenerationLoading);
    expect(openManualPauseFromHome).not.toBe(messageFromReflectGenerationResult);
    expect(dismissOpenPauseHome).not.toBe(reflectGenerationUserErrorMessage);
    expect(runPersistSilentReflectionStub).not.toBe(resolveEffectiveReflectionCopy);
  });

  it('generation umbrella composes both subclusters without collapsing namespaces', () => {
    expect('runReflectGeneration' in generationFlow).toBe(true);
    expect('openManualPauseFromHome' in generationFlow).toBe(true);
    expect(generationFlow.runReflectGeneration).not.toBe(generationFlow.openManualPauseFromHome);
    expect(generationFlow.runReflectGeneration).not.toBe(generationFlow.dismissOpenPauseHome);
  });
});
