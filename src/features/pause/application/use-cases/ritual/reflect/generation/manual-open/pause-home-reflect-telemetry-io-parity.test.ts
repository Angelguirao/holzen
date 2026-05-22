/**
 * Application-layer I/O parity for Home manual-open PostHog telemetry (parity with
 * `pause-reflect-telemetry-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-home-reflect-telemetry-io.ts`).
 * Imports `pause-home-reflect-telemetry-flow` CI umbrella for `.toBe` identity pins only —
 * production Home telemetry I/O keeps leaf tracker imports.
 * Presentation mirror: `presentation/reflect/telemetry/pause-home-reflect-telemetry-io-parity.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-flow';
import {
  markPauseManualStartedHomeOnce as markManualStartedFromHomeTelemetryIo,
  trackHomePendingPauseBannerPauseOpened as trackBannerOpenedFromHomeTelemetryIo,
  trackManualPauseInstanceCreated as trackInstanceCreatedFromHomeTelemetryIo,
  trackPauseManualCompleted as trackManualCompletedFromHomeTelemetryIo,
  trackPauseOpenDismissed as trackOpenDismissedFromHomeTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-home-reflect-telemetry-io';
import { openManualPauseFromHome } from './pause-reflect-generation-manual-open-flow';

describe('pause-home-reflect-telemetry-io parity (application)', () => {
  it('presentation I/O Home reflect telemetry matches home-reflect-telemetry-flow CI umbrella', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedFromHomeTelemetryIo);
    expect(trackHomePendingPauseBannerPauseOpened).toBe(trackBannerOpenedFromHomeTelemetryIo);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedFromHomeTelemetryIo);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedFromHomeTelemetryIo);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedFromHomeTelemetryIo);
  });

  it('home-reflect-telemetry-flow CI umbrella exports stay distinct from manual-open-flow', () => {
    expect(trackPauseOpenDismissed).not.toBe(openManualPauseFromHome);
    expect(trackHomePendingPauseBannerPauseOpened).not.toBe(openManualPauseFromHome);
    expect(markPauseManualStartedHomeOnce).not.toBe(openManualPauseFromHome);
    // Full pins: `pause-home-reflect-telemetry-flow-manual-open-flow-sibling-parity.test.ts`.
  });
});
