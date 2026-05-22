import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-flow';
import * as ambienceFlow from './pause-reflect-ambience-flow';
import {
  startPauseReflectFrameFocusAmbience as startFromAmbienceIo,
  stopPauseReflectFrameFocusAmbience as stopFromAmbienceIo,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import * as ambienceIo from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';

/**
 * Application sibling parity: ambience-flow CI umbrella vs presentation ambience-io wrappers.
 * Presentation mirror: `presentation/reflect/ambience/pause-reflect-ambience-flow-io-wrapper-sibling-parity.test.ts`.
 * Delegation parity: `pause-reflect-ambience-io.re-exports.test.ts` (application + presentation).
 */
describe('pause-reflect-ambience-flow ↔ pause-reflect-ambience-io wrapper sibling parity', () => {
  it('ambience-flow CI umbrella and presentation ambience-io are distinct module anchors', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');
    expect(ambienceFlow).not.toBe(ambienceIo);
    expect(startPauseReflectFrameFocusAmbience).toBe(startFromAmbienceIo);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopFromAmbienceIo);
  });

  it('ambience-flow and presentation ambience-io expose only frame-focus bed exports', () => {
    expect(Object.keys(ambienceFlow).sort()).toEqual([
      'startPauseReflectFrameFocusAmbience',
      'stopPauseReflectFrameFocusAmbience',
    ]);
    expect(Object.keys(ambienceIo).sort()).toEqual([
      'startPauseReflectFrameFocusAmbience',
      'stopPauseReflectFrameFocusAmbience',
    ]);
  });
});
