import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-flow';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-pending-offer-telemetry-flow';
import * as sessionReflectTelemetryFlow from './pause-reflect-telemetry-flow';
import * as pendingOfferTelemetryFlow from './pause-pending-offer-telemetry-flow';

describe('pause-reflect-telemetry-flow ↔ pause-pending-offer-telemetry-flow sibling parity', () => {
  it('session reflect telemetry-flow and pending-offer telemetry-flow are distinct sibling CI anchors', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('trackPausePendingAdopted' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackPausePendingDeclined' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackPauseSessionAbandoned' in sessionReflectTelemetryFlow).toBe(false);
    expect('trackPauseReflectPostItOpen' in pendingOfferTelemetryFlow).toBe(false);
    expect('trackPauseReflectShareTap' in pendingOfferTelemetryFlow).toBe(false);
    expect('trackPauseReflectWallpaperTap' in pendingOfferTelemetryFlow).toBe(false);
  });

  it('session reflect telemetry exports stay off pending-offer and abandoned trackers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPausePendingAdopted);
    expect(trackPauseReflectShareTap).not.toBe(trackPausePendingDeclined);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer telemetry exports stay off session reflect UI tap trackers', () => {
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPausePendingDeclined).not.toBe(trackPauseReflectShareTap);
    expect(trackPauseSessionAbandoned).not.toBe(trackPauseReflectWallpaperTap);
  });
});
