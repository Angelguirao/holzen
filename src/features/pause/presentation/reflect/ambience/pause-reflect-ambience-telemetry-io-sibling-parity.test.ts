import { describe, expect, it } from 'vitest';

import * as ambienceIo from './pause-reflect-ambience-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';
import * as telemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
  type PauseReflectTelemetrySurface,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Presentation sibling parity: ambience-io vs telemetry-io (parity with
 * `pause-reflect-ambience-share-io-sibling-parity.test.ts`,
 * `pause-reflect-share-telemetry-io-sibling-parity.test.ts`, and application
 * `application/.../ambience/pause-reflect-ambience-telemetry-io-sibling-parity.test.ts`;
 * complements `pause-reflect-flows-telemetry-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-ambience-io ↔ pause-reflect-telemetry-io sibling parity', () => {
  it('ambience-io and telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    const surface: PauseReflectTelemetrySurface = 'pause_reflect';
    expect(surface).toBe('pause_reflect');

    expect('trackPauseReflectPostItOpen' in ambienceIo).toBe(false);
    expect('trackPauseReflectShareTap' in ambienceIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in ambienceIo).toBe(false);
    expect('PauseReflectTelemetrySurface' in ambienceIo).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in telemetryIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in telemetryIo).toBe(false);
  });

  it('frame-focus ambience I/O keeps Web Audio bed off session reflect UI PostHog trackers', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectPostItOpen);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectShareTap);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectWallpaperTap);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(trackPauseReflectPostItOpen);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(stopPauseReflectFrameFocusAmbience);
  });

  it('telemetry-io exports stay off frame-focus ambience bed start/stop', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectWallpaperTap).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectPostItOpen).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(trackPauseReflectShareTap).not.toBe(trackPauseReflectWallpaperTap);
  });
});
