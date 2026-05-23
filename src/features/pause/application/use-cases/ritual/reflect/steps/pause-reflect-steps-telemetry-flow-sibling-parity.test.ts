import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '../telemetry/pause-reflect-telemetry-flow';
import {
  runPauseFavoriteToggle,
  runPauseReflectNoteUpdate,
  runPauseReflectTagUpdate,
  runPauseReflectionStepLogOnce,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-flow';
import * as stepsFlow from './pause-reflect-steps-flow';
import * as telemetryFlow from '../telemetry/pause-reflect-telemetry-flow';

describe('pause-reflect-steps-flow ↔ pause-reflect-telemetry-flow sibling parity', () => {
  it('steps-flow and telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof runPauseFavoriteToggle).toBe('function');
    expect(typeof runPauseReflectNoteUpdate).toBe('function');
    expect(typeof runPauseReflectTagUpdate).toBe('function');
    expect(typeof runPauseReflectionStepLogOnce).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('trackPauseReflectPostItOpen' in stepsFlow).toBe(false);
    expect('trackPauseReflectShareTap' in stepsFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in stepsFlow).toBe(false);
    expect('runPauseFavoriteToggle' in telemetryFlow).toBe(false);
    expect('runPauseReflectNoteUpdate' in telemetryFlow).toBe(false);
    expect('runPauseReflectTagUpdate' in telemetryFlow).toBe(false);
    expect('runPauseReflectionStepLogOnce' in telemetryFlow).toBe(false);
    expect('shouldShowFavoriteProHint' in telemetryFlow).toBe(false);
    expect('shouldLogPauseReflectionStep' in telemetryFlow).toBe(false);
  });

  it('steps umbrella exports stay off session reflect UI telemetry trackers', () => {
    expect(runPauseFavoriteToggle).not.toBe(trackPauseReflectPostItOpen);
    expect(runPauseReflectNoteUpdate).not.toBe(trackPauseReflectShareTap);
    expect(runPauseReflectTagUpdate).not.toBe(trackPauseReflectWallpaperTap);
    expect(runPauseReflectionStepLogOnce).not.toBe(trackPauseReflectPostItOpen);
    expect(shouldShowFavoriteProHint).not.toBe(trackPauseReflectShareTap);
    expect(shouldLogPauseReflectionStep).not.toBe(trackPauseReflectWallpaperTap);
    expect(runPauseFavoriteToggle).not.toBe(trackPauseReflectShareTap);
    expect(runPauseReflectTagUpdate).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('telemetry-flow exports stay off reflect step mutations and step gates', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runPauseFavoriteToggle);
    expect(trackPauseReflectShareTap).not.toBe(runPauseReflectNoteUpdate);
    expect(trackPauseReflectWallpaperTap).not.toBe(runPauseReflectTagUpdate);
    expect(trackPauseReflectPostItOpen).not.toBe(runPauseReflectionStepLogOnce);
    expect(trackPauseReflectShareTap).not.toBe(shouldShowFavoriteProHint);
    expect(trackPauseReflectWallpaperTap).not.toBe(shouldLogPauseReflectionStep);
    expect(trackPauseReflectPostItOpen).not.toBe(shouldLogPauseReflectionStep);
    expect(trackPauseReflectShareTap).not.toBe(runPauseReflectionStepLogOnce);
  });
});
