import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-flow';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  runReflectGeneration,
} from '../generation/pause-reflect-generation-flow';
import * as ambienceFlow from './pause-reflect-ambience-flow';
import * as generationFlow from '../generation/pause-reflect-generation-flow';

describe('pause-reflect-ambience-flow ↔ pause-reflect-generation-flow sibling parity', () => {
  it('ambience-flow and generation-flow are distinct sibling CI anchors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');
    expect(typeof dismissOpenPauseHome).toBe('function');

    expect('runReflectGeneration' in ambienceFlow).toBe(false);
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
  });

  it('generation umbrella exports stay off frame-focus ambience bed helpers', () => {
    expect(runReflectGeneration).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(runReflectGeneration).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(openManualPauseFromHome).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(dismissOpenPauseHome).not.toBe(stopPauseReflectFrameFocusAmbience);
  });
});
