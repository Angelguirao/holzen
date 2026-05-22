import { describe, expect, it } from 'vitest';

import * as pendingOfferTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import * as sessionReflectTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';

/**
 * Presentation sibling parity: session reflect UI telemetry-io vs pending-offer telemetry-io
 * (colocated beside pending-offer-io; parity with application
 * `application/.../pending-offer/pause-reflect-telemetry-pending-offer-telemetry-io-sibling-parity.test.ts`
 * and flow-level `pause-reflect-telemetry-pending-offer-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-telemetry-io ↔ pause-reflect-pending-offer-telemetry-io sibling parity', () => {
  it('session reflect telemetry-io and pending-offer telemetry-io are distinct presentation surfaces', () => {
    expect(typeof trackPauseReflectPostItOpen).toBe('function');
    expect(typeof trackPauseReflectShareTap).toBe('function');
    expect(typeof trackPauseReflectWallpaperTap).toBe('function');

    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('trackPausePendingAdopted' in sessionReflectTelemetryIo).toBe(false);
    expect('trackPausePendingDeclined' in sessionReflectTelemetryIo).toBe(false);
    expect('trackPauseSessionAbandoned' in sessionReflectTelemetryIo).toBe(false);

    expect('trackPauseReflectPostItOpen' in pendingOfferTelemetryIo).toBe(false);
    expect('trackPauseReflectShareTap' in pendingOfferTelemetryIo).toBe(false);
    expect('trackPauseReflectWallpaperTap' in pendingOfferTelemetryIo).toBe(false);
  });

  it('session reflect UI telemetry keeps post-it/share/wallpaper trackers off pending-offer and abandoned helpers', () => {
    expect(trackPauseReflectPostItOpen).not.toBe(trackPausePendingAdopted);
    expect(trackPauseReflectShareTap).not.toBe(trackPausePendingDeclined);
    expect(trackPauseReflectWallpaperTap).not.toBe(trackPauseSessionAbandoned);
    expect(trackPauseReflectPostItOpen).not.toBe(trackPausePendingDeclined);
    expect(trackPauseReflectShareTap).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer telemetry keeps adopt/decline/abandoned trackers off session reflect UI tap helpers', () => {
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPausePendingDeclined).not.toBe(trackPauseReflectShareTap);
    expect(trackPauseSessionAbandoned).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectShareTap);
    expect(trackPausePendingDeclined).not.toBe(trackPauseReflectWallpaperTap);
  });
});
