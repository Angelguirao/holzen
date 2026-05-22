import { describe, expect, it } from 'vitest';

import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-flow';

describe('pause-home-reflect-telemetry-flow', () => {
  it('re-exports Home reflect PostHog trackers from manual-open telemetry siblings', () => {
    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(typeof trackHomePendingPauseBannerPauseOpened).toBe('function');
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');
  });
});
