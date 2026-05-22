import { describe, expect, it } from 'vitest';

import {
  trackHomePendingPauseBannerPauseOpened as trackBannerDirect,
  trackPauseOpenDismissed as trackDismissDirect,
} from './home-pause-actions-telemetry';
import {
  markPauseManualStartedHomeOnce as markStartedDirect,
  trackManualPauseInstanceCreated as trackCreatedDirect,
  trackPauseManualCompleted as trackCompletedDirect,
} from './manual-pause-trigger-telemetry';
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

    expect(trackPauseOpenDismissed).toBe(trackDismissDirect);
    expect(trackHomePendingPauseBannerPauseOpened).toBe(trackBannerDirect);
    expect(markPauseManualStartedHomeOnce).toBe(markStartedDirect);
    expect(trackManualPauseInstanceCreated).toBe(trackCreatedDirect);
    expect(trackPauseManualCompleted).toBe(trackCompletedDirect);
  });
});
