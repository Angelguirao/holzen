import { describe, expect, it } from 'vitest';

import {
  trackPausePendingAdopted as trackAdoptedDirect,
  trackPausePendingDeclined as trackDeclinedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pending-pause-offer-telemetry';
import { trackPauseSessionAbandoned as trackAbandonedDirect } from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-session-abandoned-telemetry';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/application/use-cases/ritual/reflect/telemetry/pause-pending-offer-telemetry-flow';
import {
  trackPausePendingAdopted as trackAdoptedFromPendingOfferTelemetryIo,
  trackPausePendingDeclined as trackDeclinedFromPendingOfferTelemetryIo,
  trackPauseSessionAbandoned as trackAbandonedFromPendingOfferTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';

describe('pause-reflect-pending-offer-telemetry-io parity', () => {
  it('presentation I/O pending-offer telemetry matches pending-offer-telemetry-flow CI umbrella', () => {
    expect(trackPausePendingAdopted).toBe(trackAdoptedFromPendingOfferTelemetryIo);
    expect(trackPausePendingDeclined).toBe(trackDeclinedFromPendingOfferTelemetryIo);
    expect(trackPauseSessionAbandoned).toBe(trackAbandonedFromPendingOfferTelemetryIo);
  });

  it('pending-offer-telemetry-flow CI umbrella composes the same leaf trackers as presentation I/O', () => {
    expect(trackPausePendingAdopted).toBe(trackAdoptedDirect);
    expect(trackPausePendingDeclined).toBe(trackDeclinedDirect);
    expect(trackPauseSessionAbandoned).toBe(trackAbandonedDirect);
    expect(trackAdoptedFromPendingOfferTelemetryIo).toBe(trackAdoptedDirect);
    expect(trackDeclinedFromPendingOfferTelemetryIo).toBe(trackDeclinedDirect);
    expect(trackAbandonedFromPendingOfferTelemetryIo).toBe(trackAbandonedDirect);
  });
});
