/**
 * Application-layer I/O parity for Home manual-open PostHog trackers (parity with
 * `pause-reflect-telemetry-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-home-reflect-telemetry-io.ts`).
 * Imports `pause-home-reflect-telemetry-flow` CI umbrella for `.toBe` identity pins only —
 * production home telemetry I/O keeps leaf tracker imports.
 */
import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/pause-home-reflect-telemetry-flow';
import {
  markPauseManualStartedHomeOnce as markManualStartedFromHomeTelemetryIo,
  trackHomePendingPauseBannerPauseOpened as trackBannerOpenedFromHomeTelemetryIo,
  trackManualPauseInstanceCreated as trackInstanceCreatedFromHomeTelemetryIo,
  trackPauseManualCompleted as trackManualCompletedFromHomeTelemetryIo,
  trackPauseOpenDismissed as trackOpenDismissedFromHomeTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-home-reflect-telemetry-io';

/**
 * Application mirror: `presentation/reflect/telemetry/pause-home-reflect-telemetry-io-parity.test.ts`.
 */
describe('pause-home-reflect-telemetry-io parity (application)', () => {
  it('presentation I/O Home reflect telemetry matches home-reflect-telemetry-flow CI umbrella', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedFromHomeTelemetryIo);
    expect(trackHomePendingPauseBannerPauseOpened).toBe(trackBannerOpenedFromHomeTelemetryIo);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedFromHomeTelemetryIo);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedFromHomeTelemetryIo);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedFromHomeTelemetryIo);
  });
});
