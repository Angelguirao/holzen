import { describe, expect, it } from 'vitest';

import {
  trackPauseOpenDismissed as trackDismissDirect,
} from './home-pause-actions-telemetry';
import {
  markPauseManualStartedHomeOnce as markStartedDirect,
  trackManualPauseInstanceCreated as trackCreatedDirect,
  trackPauseManualCompleted as trackCompletedDirect,
} from './manual-pause-trigger-telemetry';
import {
  markPauseManualStartedHomeOnce,
  trackManualPauseInstanceCreated,
  trackPauseManualCompleted,
  trackPauseOpenDismissed,
} from './pause-home-reflect-telemetry-flow';

describe('pause-home-reflect-telemetry-flow', () => {
  it('re-exports Home reflect PostHog trackers from manual-open telemetry siblings', () => {
    expect(typeof trackPauseOpenDismissed).toBe('function');
    expect(typeof markPauseManualStartedHomeOnce).toBe('function');
    expect(typeof trackManualPauseInstanceCreated).toBe('function');
    expect(typeof trackPauseManualCompleted).toBe('function');

    expect(trackPauseOpenDismissed).toBe(trackDismissDirect);
    expect(markPauseManualStartedHomeOnce).toBe(markStartedDirect);
    expect(trackManualPauseInstanceCreated).toBe(trackCreatedDirect);
    expect(trackPauseManualCompleted).toBe(trackCompletedDirect);
  });
});
