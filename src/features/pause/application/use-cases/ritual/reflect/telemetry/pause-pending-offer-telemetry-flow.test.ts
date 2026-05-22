import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from './pause-reflect-telemetry-flow';
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

  it('sibling cluster: pending-offer-telemetry-flow exports stay distinct from session reflect UI telemetry-flow exports', () => {
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectShareTap);
    expect(trackPausePendingAdopted).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackPausePendingDeclined).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPausePendingDeclined).not.toBe(trackPauseReflectShareTap);
    expect(trackPausePendingDeclined).not.toBe(trackPauseReflectWallpaperTap);
    expect(trackPauseSessionAbandoned).not.toBe(trackPauseReflectPostItOpen);
    expect(trackPauseSessionAbandoned).not.toBe(trackPauseReflectShareTap);
    expect(trackPauseSessionAbandoned).not.toBe(trackPauseReflectWallpaperTap);
  });
});
