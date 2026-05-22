import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/presentation/reflect/telemetry/pause-home-reflect-telemetry-io';
import * as homeReflectTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-home-reflect-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import * as sessionReflectTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';

/**
 * Presentation sibling parity: session reflect telemetry-io vs Home manual-open telemetry-io
 * (colocated beside pause-home-reflect-io; parity with application
 * `application/.../manual-open/pause-reflect-telemetry-home-reflect-telemetry-io-sibling-parity.test.ts`
 * and `pause-home-reflect-telemetry-flow-reflect-telemetry-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-telemetry-io ↔ pause-home-reflect-telemetry-io sibling parity', () => {
  it('session reflect telemetry-io and Home manual-open telemetry-io are distinct presentation surfaces', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(typeof trackHomePendingPauseBannerPauseOpened).toBe('function');
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');

    expect('trackPauseOpenDismissed' in sessionReflectTelemetryIo).toBe(false);
    expect('trackHomePendingPauseBannerPauseOpened' in sessionReflectTelemetryIo).toBe(false);
    expect('markPauseManualStartedHomeOnce' in sessionReflectTelemetryIo).toBe(false);
    expect('trackManualPauseInstanceCreated' in sessionReflectTelemetryIo).toBe(false);
    expect('trackPauseManualCompleted' in sessionReflectTelemetryIo).toBe(false);

    expect('trackPauseReflectPostItOpen' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectShareTap' in homeReflectTelemetryIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in homeReflectTelemetryIo).toBe(false);
  });

  it('session reflect UI telemetry keeps post-it/share/wallpaper trackers off Home manual-open helpers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPauseOpenDismissed);
    expect(trackPauseReflectShareTap).not.toBe(trackHomePendingPauseBannerPauseOpened);
    expect(trackPauseReflectWallpaperTap).not.toBe(markPauseManualStartedHomeOnce);
    expect(trackPauseReflectPostItOpen).not.toBe(trackManualPauseInstanceCreated);
    expect(trackPauseReflectShareTap).not.toBe(trackPauseManualCompleted);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseOpenDismissed);
  });

  it('Home manual-open telemetry keeps open/dismiss/manual trackers off session reflect UI tap helpers', () => {
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(trackPauseReflectShareTap);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectShareTap);
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectWallpaperTap);
  });
});
