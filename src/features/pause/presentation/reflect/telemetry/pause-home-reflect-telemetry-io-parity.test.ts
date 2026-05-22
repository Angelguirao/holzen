/**
 * Presentation I/O parity for Home manual-open PostHog trackers (colocated beside
 * `pause-home-reflect-telemetry-io.ts`; application `pause-home-reflect-telemetry-flow` stays CI umbrella).
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
} from './pause-home-reflect-telemetry-io';

describe('pause-home-reflect-telemetry-io parity', () => {
  it('presentation I/O Home reflect telemetry matches home-reflect-telemetry-flow CI umbrella', () => {
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedFromHomeTelemetryIo);
    expect(trackHomePendingPauseBannerPauseOpened).toBe(trackBannerOpenedFromHomeTelemetryIo);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedFromHomeTelemetryIo);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedFromHomeTelemetryIo);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedFromHomeTelemetryIo);
  });
});
