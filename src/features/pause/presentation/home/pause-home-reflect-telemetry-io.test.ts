import { describe, expect, it } from 'vitest';
import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-io';

describe('pause-home-reflect-telemetry-io', () => {
  it('re-exports Home reflect PostHog helpers for presentation conductors', () => {
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackHomePendingPauseBannerPauseOpened).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');
    expect(typeof trackPauseOpenDismissed).toBe('function');
  });
});
