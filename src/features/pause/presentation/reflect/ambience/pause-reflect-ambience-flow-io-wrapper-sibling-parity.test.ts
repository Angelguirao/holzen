import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import * as ambienceFlow from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import {
  startPauseReflectFrameFocusAmbience as startFromAmbienceIo,
  stopPauseReflectFrameFocusAmbience as stopFromAmbienceIo,
} from './pause-reflect-ambience-io';
import * as ambienceIo from './pause-reflect-ambience-io';

/**
 * Presentation sibling parity: ambience-flow CI umbrella vs ambience-io port-bound wrappers.
 * Mirrors application `pause-reflect-ambience-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-ambience-flow.ts` at application layer).
 * Delegation parity: colocated `pause-reflect-ambience-io.re-exports.test.ts`.
 */
describe('pause-reflect-ambience-flow ↔ pause-reflect-ambience-io wrapper sibling parity (presentation)', () => {
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
