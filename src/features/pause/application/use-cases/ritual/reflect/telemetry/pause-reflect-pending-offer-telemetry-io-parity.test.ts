import { describe, expect, it } from 'vitest';

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
});
