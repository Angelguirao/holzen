import { describe, expect, it } from 'vitest';

import {
  startPauseReflectFrameFocusAmbience as startDirect,
  stopPauseReflectFrameFocusAmbience as stopDirect,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
import {
  runPauseFavoriteToggle as runFavoriteFromStepsFlow,
  runPauseReflectNoteUpdate as runNoteFromStepsFlow,
  runPauseReflectTagUpdate as runTagFromStepsFlow,
  runPauseReflectionStepLogOnce as runReflectionStepFromStepsFlow,
  shouldLogPauseReflectionStep as shouldLogFromStepsFlow,
  shouldShowFavoriteProHint as shouldShowFavoriteFromStepsFlow,
} from '../steps/pause-reflect-steps-flow';
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

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-flow.test.ts` (ambience-flow cluster).
   * Dedicated sibling file: `pause-reflect-steps-ambience-flow-sibling-parity.test.ts`.
   */
  it('sibling cluster: steps-flow exports stay distinct from ambience-flow exports', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runFavoriteFromStepsFlow);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runNoteFromStepsFlow);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runTagFromStepsFlow);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(runReflectionStepFromStepsFlow);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(shouldShowFavoriteFromStepsFlow);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(shouldLogFromStepsFlow);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(runReflectGeneration);
    // Full cross-flow pins: `pause-reflect-steps-ambience-flow-sibling-parity.test.ts`.
  });
});
