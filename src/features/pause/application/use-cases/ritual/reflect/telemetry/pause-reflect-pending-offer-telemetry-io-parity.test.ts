/**
 * Application-layer I/O parity for ritual reflect pending-offer PostHog telemetry
 * (colocated beside `pause-reflect-telemetry-io-parity.test.ts` under `application/.../telemetry/`).
 * Presentation mirror: `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io-parity.test.ts`.
 * Imports `pause-pending-offer-telemetry-flow` CI umbrella for `.toBe` identity pins only —
 * production pending-offer telemetry I/O keeps leaf tracker modules under `pending-offer/`.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {},
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

import {
  trackPausePendingAdopted as trackAdoptedDirect,
  trackPausePendingDeclined as trackDeclinedDirect,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-telemetry';
import { trackPauseSessionAbandoned as trackAbandonedDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-session-abandoned-telemetry';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-telemetry-flow';
import {
  pauseAdoptPendingOffer,
  pauseDeclinePendingOffer,
  getPendingPauseOfferDisplay,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  trackPausePendingAdopted as trackAdoptedFromPendingOfferTelemetryIo,
  trackPausePendingDeclined as trackDeclinedFromPendingOfferTelemetryIo,
  trackPauseSessionAbandoned as trackAbandonedFromPendingOfferTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';

describe('pause-reflect-pending-offer-telemetry-io parity (application)', () => {
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

  it('pending-offer-telemetry-io trackers stay distinct from pending-offer-io RPC wrappers', () => {
    expect(trackPausePendingAdopted).not.toBe(pauseAdoptPendingOffer);
    expect(trackPausePendingDeclined).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseSessionAbandoned).not.toBe(pauseAdoptPendingOffer);
    expect(trackAdoptedFromPendingOfferTelemetryIo).not.toBe(pauseDeclinePendingOffer);
    expect(trackDeclinedFromPendingOfferTelemetryIo).not.toBe(getPendingPauseOfferDisplay);
    expect(trackAbandonedFromPendingOfferTelemetryIo).not.toBe(reflectPauseRepository);
    // Reciprocal inline pins: `presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io-parity.test.ts`.
    // Dedicated sibling: `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts` (application + presentation).
  });
});
