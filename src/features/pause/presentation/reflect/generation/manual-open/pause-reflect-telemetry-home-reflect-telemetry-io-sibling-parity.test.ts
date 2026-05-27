import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-io';
import * as homeReflectTelemetryIo from './pause-home-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import * as sessionReflectTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Presentation sibling parity: session reflect telemetry-io vs Home manual-open telemetry-io
 * (colocated beside `pause-home-reflect-telemetry-io.ts`; parity with application
 * `application/.../telemetry/pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`
 * and `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-telemetry-io ↔ pause-home-reflect-telemetry-io sibling parity', () => {
  it('session reflect telemetry-io and Home manual-open telemetry-io are distinct presentation surfaces', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');

    expect('trackPauseOpenDismissed' in sessionReflectTelemetryIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in sessionReflectTelemetryIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in sessionReflectTelemetryIo).toBe(false);
    expect('trackPauseManualCompleted' in sessionReflectTelemetryIo).toBe(false);

    expect('trackPauseReflectPostItOpen' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectShareTap' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in homeReflectTelemetryIo).toBe(false);
  });

  it('session reflect UI telemetry keeps post-it/share/wallpaper trackers off Home manual-open helpers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPauseOpenDismissed);
    expect(trackPauseReflectShareTap).not.toBe(markPauseManualStartedHomeOnce);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackManualPauseInstanceCreated);
    expect(trackPauseReflectPostItOpen).not.toBe(trackManualPauseInstanceCreated);
    expect(trackPauseReflectShareTap).not.toBe(trackPauseManualCompleted);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseOpenDismissed);
  });

  it('Home manual-open telemetry keeps open/dismiss/manual trackers off session reflect UI tap helpers', () => {
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectShareTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectShareTap);
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectWallpaperTap);
  });
});
