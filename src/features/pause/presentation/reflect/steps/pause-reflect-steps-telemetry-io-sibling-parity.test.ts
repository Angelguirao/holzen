import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as stepsIo from './pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';
import * as telemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Presentation sibling parity: steps-io vs telemetry-io (parity with application
 * `pause-reflect-steps-telemetry-flow-sibling-parity.test.ts`; complements
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts` and
 * `pause-reflect-flows-telemetry-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-steps-io ↔ pause-reflect-telemetry-io sibling parity', () => {
  it('steps-io and telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof pauseReflectFavoriteToggleWithRepository).toBe('function');
    expect(typeof pauseReflectionStepLogOnceWithRepository).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');

    expect('trackPauseReflectPostItOpen' in stepsIo).toBe(false);
    expect('trackPauseReflectShareTap' in stepsIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in stepsIo).toBe(false);

    expect('pauseReflectFavoriteToggle' in telemetryIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in telemetryIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in telemetryIo).toBe(false);
    expect('reflectPauseRepository' in telemetryIo).toBe(false);
  });

  it('steps-io exports stay off session reflect UI PostHog trackers', () => {
    expect(pauseReflectFavoriteToggle).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseReflectNoteUpdate).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectTagUpdate).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseReflectionStepLogOnce).not.toBe(trackPauseReflectPostItOpen);
    expect(shouldShowFavoriteProHint).not.toBe(trackPauseReflectShareTap);
    expect(shouldLogPauseReflectionStep).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseReflectFavoriteToggleWithRepository).not.toBe(trackPauseReflectShareTap);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('telemetry-io exports stay off reflect step mutations and step gates', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectFavoriteToggle);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectNoteUpdate);
    expect(trackPauseReflectWallpaperTap).not.toBe(pauseReflectTagUpdate);
    expect(trackPauseReflectPostItOpen).not.toBe(pauseReflectionStepLogOnce);
    expect(trackPauseReflectShareTap).not.toBe(shouldShowFavoriteProHint);
    expect(trackPauseReflectWallpaperTap).not.toBe(shouldLogPauseReflectionStep);
    expect(trackPauseReflectPostItOpen).not.toBe(reflectPauseRepository);
    expect(trackPauseReflectShareTap).not.toBe(pauseReflectionStepLogOnceWithRepository);
  });
});
