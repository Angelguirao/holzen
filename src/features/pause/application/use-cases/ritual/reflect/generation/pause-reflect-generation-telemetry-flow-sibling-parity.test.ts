import { describe, expect, it } from 'vitest';

import {
  messageFromReflectGenerationResult,
  openManualPauseFromHome,
  reflectGenerationPrerequisite,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '../telemetry/pause-reflect-telemetry-flow';
import * as generationFlow from './pause-reflect-generation-flow';
import * as telemetryFlow from '../telemetry/pause-reflect-telemetry-flow';

describe('pause-reflect-generation-flow ↔ pause-reflect-telemetry-flow sibling parity', () => {
  it('generation-flow and telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof openManualPauseFromHome).toBe('function');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('trackPauseReflectPostItOpen' in generationFlow).toBe(false);
    expect('trackPauseReflectShareTap' in generationFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in generationFlow).toBe(false);
    expect('runReflectGeneration' in telemetryFlow).toBe(false);
    expect('messageFromReflectGenerationResult' in telemetryFlow).toBe(false);
    expect('reflectGenerationPrerequisite' in telemetryFlow).toBe(false);
    expect('shouldCommitReflectGeneration' in telemetryFlow).toBe(false);
    expect('openManualPauseFromHome' in telemetryFlow).toBe(false);
  });

  it('generation umbrella exports stay off session reflect UI PostHog tap trackers', () => {
    expect(runReflectGeneration).not.toBe(trackPauseReflectPostItOpen);
    expect(runReflectGeneration).not.toBe(trackPauseReflectShareTap);
    expect(runReflectGeneration).not.toBe(trackPauseReflectWallpaperTap);
    expect(messageFromReflectGenerationResult).not.toBe(trackPauseReflectPostItOpen);
    expect(reflectGenerationPrerequisite).not.toBe(trackPauseReflectShareTap);
    expect(shouldCommitReflectGeneration).not.toBe(trackPauseReflectWallpaperTap);
    expect(openManualPauseFromHome).not.toBe(trackPauseReflectPostItOpen);
    expect(openManualPauseFromHome).not.toBe(trackPauseReflectShareTap);
  });

  it('telemetry umbrella exports stay off holzen-reflect generation and manual-open', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(runReflectGeneration);
    expect(trackPauseReflectShareTap).not.toBe(runReflectGeneration);
    expect(trackPauseReflectWallpaperTap).not.toBe(runReflectGeneration);
    expect(trackPauseReflectPostItOpen).not.toBe(messageFromReflectGenerationResult);
    expect(trackPauseReflectShareTap).not.toBe(reflectGenerationPrerequisite);
    expect(trackPauseReflectWallpaperTap).not.toBe(shouldCommitReflectGeneration);
    expect(trackPauseReflectPostItOpen).not.toBe(openManualPauseFromHome);
    expect(trackPauseReflectShareTap).not.toBe(openManualPauseFromHome);
  });
});
