import { describe, expect, it } from 'vitest';

import {
  dismissOpenPauseHome,
  messageFromReflectGenerationResult,
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '../generation/pause-reflect-generation-flow';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-flow';
import * as ambienceFlow from './pause-reflect-ambience-flow';
import * as generationFlow from '../generation/pause-reflect-generation-flow';

/**
 * Sibling parity: ambience-flow vs generation-flow CI anchors (parity with
 * `pause-reflect-flows-generation-flow-sibling-parity.test.ts` and inline pins on
 * `pause-reflect-ambience-flow.test.ts` / `pause-reflect-generation-flow.test.ts`).
 */
describe('pause-reflect-ambience-flow ↔ pause-reflect-generation-flow sibling parity', () => {
  it('ambience-flow and generation-flow are distinct sibling CI anchors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');

    expect('runReflectGeneration' in ambienceFlow).toBe(false);
    expect('messageFromReflectGenerationResult' in ambienceFlow).toBe(false);
    expect('reflectGenerationPrerequisite' in ambienceFlow).toBe(false);
    expect('shouldCommitReflectGeneration' in ambienceFlow).toBe(false);
    expect('openManualPauseFromHome' in ambienceFlow).toBe(false);
    expect('dismissOpenPauseHome' in ambienceFlow).toBe(false);
    expect('startPauseReflectFrameFocusAmbience' in generationFlow).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in generationFlow).toBe(false);
  });

  it('ambience umbrella exports stay off holzen-reflect generation and manual-open', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(openManualPauseFromHome);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(dismissOpenPauseHome);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(messageFromReflectGenerationResult);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(reflectGenerationPrerequisite);
  });

  it('generation umbrella exports stay off frame-focus ambience bed helpers', () => {
    expect(runReflectGeneration).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runReflectGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(openManualPauseFromHome).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(dismissOpenPauseHome).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(shouldCommitReflectGeneration).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(messageFromReflectGenerationResult).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
