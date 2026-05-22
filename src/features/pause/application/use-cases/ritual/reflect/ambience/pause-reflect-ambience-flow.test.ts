import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience as startDirect,
  stopPauseReflectFrameFocusAmbience as stopDirect,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
import {
  dismissOpenPauseHome,
  openManualPauseFromHome,
  runReflectGeneration,
} from '../generation/pause-reflect-generation-flow';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-flow';

describe('pause-reflect-ambience-flow', () => {
  it('re-exports frame-focus ambience helpers from domain/ritual/breathe', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');
    expect(startPauseReflectFrameFocusAmbience).toBe(startDirect);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopDirect);
  });

  it('sibling cluster: generation-flow exports stay distinct from ambience-flow exports', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(openManualPauseFromHome);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(dismissOpenPauseHome);
  });
});
