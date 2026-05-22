import { describe, expect, it } from 'vitest';

import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '../telemetry/pause-reflect-telemetry-flow';
import {
  trackPausePendingAdopted as trackAdoptedDirect,
  trackPausePendingDeclined as trackDeclinedDirect,
} from './pending-pause-offer-telemetry';
import { trackPauseSessionAbandoned as trackAbandonedDirect } from './pause-session-abandoned-telemetry';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted as trackAdoptedFromPendingOfferFlow,
  trackPausePendingDeclined as trackDeclinedFromPendingOfferFlow,
  trackPauseSessionAbandoned as trackAbandonedFromPendingOfferFlow,
} from '../pending-offer/pause-reflect-pending-offer-flow';
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

  it('sibling cluster: telemetry-flow shares PostHog trackers only with pending-offer umbrella (not RPC or display)', () => {
    expect(trackPausePendingAdopted).toBe(trackAdoptedFromPendingOfferFlow);
    expect(trackPausePendingDeclined).toBe(trackDeclinedFromPendingOfferFlow);
    expect(trackPauseSessionAbandoned).toBe(trackAbandonedFromPendingOfferFlow);
    expect(trackPausePendingAdopted).not.toBe(runAdoptPendingPauseOffer);
    expect(trackPausePendingDeclined).not.toBe(runDeclinePendingPauseOffer);
    expect(trackPauseSessionAbandoned).not.toBe(getPendingPauseOfferDisplay);
    expect(runAdoptPendingPauseOffer).not.toBe(getPendingPauseOfferDisplay);
    expect(runDeclinePendingPauseOffer).not.toBe(getPendingPauseOfferDisplay);
  });
});
