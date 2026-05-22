import { describe, expect, it } from 'vitest';

import {
  trackPausePendingAdopted as trackAdoptedDirect,
  trackPausePendingDeclined as trackDeclinedDirect,
} from './pending-pause-offer-telemetry';
import { trackPauseSessionAbandoned as trackAbandonedDirect } from './pause-session-abandoned-telemetry';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-pending-offer-telemetry-flow';

describe('pause-pending-offer-telemetry-flow', () => {
  it('re-exports pending-offer and session-abandoned telemetry trackers', () => {
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect(trackPausePendingAdopted).toBe(trackAdoptedDirect);
    expect(trackPausePendingDeclined).toBe(trackDeclinedDirect);
    expect(trackPauseSessionAbandoned).toBe(trackAbandonedDirect);
  });
});
