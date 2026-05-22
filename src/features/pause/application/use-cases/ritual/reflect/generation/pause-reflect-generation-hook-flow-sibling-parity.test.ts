import { describe, expect, it } from 'vitest';

import {
  dismissOpenPauseHome,
  messageFromReflectGenerationResult,
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldClearReflectGenerationLoading,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-flow';
import {
  messageFromReflectGenerationResult as messageFromHookFlow,
  reflectGenerationPrerequisite as prerequisiteFromHookFlow,
  resolveReflectGenerationPrefetch as resolvePrefetchFromHookFlow,
  runReflectGeneration as runReflectGenerationFromHookFlow,
  shouldClearReflectGenerationLoading as shouldClearFromHookFlow,
  shouldCommitReflectGeneration as shouldCommitFromHookFlow,
} from './holzen-reflect/pause-reflect-generation-hook-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as hookFlow from './holzen-reflect/pause-reflect-generation-hook-flow';

describe('pause-reflect-generation-flow ↔ pause-reflect-generation-hook-flow sibling parity', () => {
  it('generation-flow and hook-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof resolveReflectGenerationPrefetch).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');

    expect('runReflectGeneration' in generationFlow).toBe(true);
    expect('openManualPauseFromHome' in generationFlow).toBe(true);
    expect('dismissOpenPauseHome' in generationFlow).toBe(true);
    expect('openManualPauseFromHome' in hookFlow).toBe(false);
    expect('dismissOpenPauseHome' in hookFlow).toBe(false);
    expect('runOpenManualPauseSilentModeAfterCreate' in hookFlow).toBe(false);
    expect('runPersistSilentReflectionStub' in hookFlow).toBe(false);
  });

  it('generation umbrella shares holzen-reflect hook bindings with hook-flow subcluster', () => {
    expect(runReflectGeneration).toBe(runReflectGenerationFromHookFlow);
    expect(reflectGenerationPrerequisite).toBe(prerequisiteFromHookFlow);
    expect(resolveReflectGenerationPrefetch).toBe(resolvePrefetchFromHookFlow);
    expect(shouldCommitReflectGeneration).toBe(shouldCommitFromHookFlow);
    expect(shouldClearReflectGenerationLoading).toBe(shouldClearFromHookFlow);
    expect(messageFromReflectGenerationResult).toBe(messageFromHookFlow);
  });

  it('hook-flow subcluster stays off manual-open Home use cases', () => {
    expect(runReflectGenerationFromHookFlow).not.toBe(openManualPauseFromHome);
    expect(runReflectGenerationFromHookFlow).not.toBe(dismissOpenPauseHome);
    expect(prerequisiteFromHookFlow).not.toBe(openManualPauseFromHome);
    expect(resolvePrefetchFromHookFlow).not.toBe(dismissOpenPauseHome);
    expect(shouldCommitFromHookFlow).not.toBe(openManualPauseFromHome);
    expect(messageFromHookFlow).not.toBe(dismissOpenPauseHome);
  });

  it('generation umbrella manual-open exports stay off hook-only namespace', () => {
    expect(openManualPauseFromHome).not.toBe(runReflectGenerationFromHookFlow);
    expect(dismissOpenPauseHome).not.toBe(prerequisiteFromHookFlow);
    expect(openManualPauseFromHome).not.toBe(resolvePrefetchFromHookFlow);
    expect(dismissOpenPauseHome).not.toBe(shouldClearFromHookFlow);
  });
});
