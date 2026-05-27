import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';
import * as homeReflectTelemetryFlow from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-flow';
import * as sessionReflectTelemetryFlow from './pause-reflect-telemetry-flow';

describe('pause-home-reflect-telemetry-flow ↔ pause-reflect-telemetry-flow sibling parity', () => {
  it('home-reflect-telemetry-flow and reflect-telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof trackPauseOpenDismissed).toBe('function');
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
    expect('markPauseManualStartedHomeOnce' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackManualPauseInstanceCreated' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackPauseManualCompleted' in sessionReflectTelemetryFlow).toBe(false);
  });

  it('Home manual-open telemetry-flow exports stay off session reflect UI PostHog tap trackers', () => {
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectPostItOpen);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectShareTap);
    expect(trackManualPauseInstanceCreated).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackPauseManualCompleted).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseOpenDismissed).not.toBe(trackPauseReflectShareTap);
    expect(markPauseManualStartedHomeOnce).not.toBe(trackPauseReflectWallpaperTap);
  });

  it('session reflect telemetry-flow exports stay off Home manual-open PostHog helpers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPauseOpenDismissed);
    expect(trackPauseReflectShareTap).not.toBe(markPauseManualStartedHomeOnce);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackManualPauseInstanceCreated);
    expect(trackPauseReflectPostItOpen).not.toBe(trackManualPauseInstanceCreated);
    expect(trackPauseReflectShareTap).not.toBe(trackPauseManualCompleted);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseOpenDismissed);
  });
});
