import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-flow';
import * as homeReflectTelemetryFlow from './pause-home-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '../../telemetry/pause-reflect-telemetry-flow';
import * as sessionReflectTelemetryFlow from '../../telemetry/pause-reflect-telemetry-flow';

/**
 * Application sibling parity: Home manual-open telemetry-flow vs session reflect telemetry-flow.
 */
describe('pause-home-reflect-telemetry-flow ↔ pause-reflect-telemetry-flow sibling parity', () => {
  it('home-reflect-telemetry-flow and reflect-telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(typeof trackHomePendingPauseBannerPauseOpened).toBe('function');
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');

    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect('trackPauseReflectPostItOpen' in homeReflectTelemetryFlow).toBe(false);
    expect('trackPauseReflectShareTap' in homeReflectTelemetryFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in homeReflectTelemetryFlow).toBe(false);

    expect('trackPauseOpenDismissed' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackHomePendingPauseBannerPauseOpened' in sessionReflectTelemetryFlow).toBe(false);
    expect('markPauseManualStartedHomeOnce' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackManualPauseInstanceCreated' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackPauseManualCompleted' in sessionReflectTelemetryFlow).toBe(false);
  });

  it('Home manual-open telemetry-flow exports stay off session reflect UI PostHog tap trackers', () => {
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(trackPauseReflectShareTap);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectShareTap);
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('session reflect telemetry-flow exports stay off Home manual-open PostHog helpers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPauseOpenDismissed);
    expect(trackPauseReflectShareTap).not.toBe(trackHomePendingPauseBannerPauseOpened);
    expect(trackPauseReflectWallpaperTap).not.toBe(markPauseManualStartedHomeOnce);
    expect(trackPauseReflectPostItOpen).not.toBe(trackManualPauseInstanceCreated);
    expect(trackPauseReflectShareTap).not.toBe(trackPauseManualCompleted);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseOpenDismissed);
  });
});
