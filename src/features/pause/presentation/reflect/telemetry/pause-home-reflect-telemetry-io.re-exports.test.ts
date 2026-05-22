import { describe, expect, it } from 'vitest';

import {
  trackHomePendingPauseBannerPauseOpened as trackBannerOpenedDirect,
  trackPauseOpenDismissed as trackOpenDismissedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/home-pause-actions-telemetry';
import {
  markPauseManualStartedHomeOnce as markManualStartedDirect,
  trackManualPauseInstanceCreated as trackInstanceCreatedDirect,
  trackPauseManualCompleted as trackManualCompletedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/generation/manual-open/manual-pause-trigger-telemetry';

import {
  markPauseManualStartedHomeOnce,
  trackHomePendingPauseBannerPauseOpened,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-io';

describe('pause-home-reflect-telemetry-io re-exports', () => {
  it('re-exports Home reflect PostHog helpers from manual-open telemetry leaf modules', () => {
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackHomePendingPauseBannerPauseOpened).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');
    expect(typeof trackPauseOpenDismissed).toBe('function');

    expect(trackHomePendingPauseBannerPauseOpened).toBe(trackBannerOpenedDirect);
    expect(trackPauseOpenDismissed).toBe(trackOpenDismissedDirect);
    expect(markPauseManualStartedHomeOnce).toBe(markManualStartedDirect);
    expect(trackManualPauseInstanceCreated).toBe(trackInstanceCreatedDirect);
    expect(trackPauseManualCompleted).toBe(trackManualCompletedDirect);
  });
});
