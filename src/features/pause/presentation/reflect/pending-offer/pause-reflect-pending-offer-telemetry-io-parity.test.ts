import { describe, expect, it, vi } from 'vitest';

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
} from './pause-reflect-pending-offer-io';
import * as pendingOfferIo from './pause-reflect-pending-offer-io';
import {
  trackPausePendingAdopted as trackAdoptedFromPendingOfferTelemetryIo,
  trackPausePendingDeclined as trackDeclinedFromPendingOfferTelemetryIo,
  trackPauseSessionAbandoned as trackAbandonedFromPendingOfferTelemetryIo,
} from '../telemetry/pause-reflect-pending-offer-telemetry-io';
import * as pendingOfferTelemetryIo from '../telemetry/pause-reflect-pending-offer-telemetry-io';

/**
 * Presentation pending-offer telemetry I/O parity (colocated beside `pause-reflect-pending-offer-io.ts`).
 * Sibling pins: `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts` (presentation + application);
 * reciprocal inline pins ↔ `pause-reflect-pending-offer-telemetry-io.test.ts` ↔ `pause-reflect-pending-offer-io.test.ts`.
 */
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

  it('presentation pending-offer-telemetry-io stays off pending-offer-io RPC exports', () => {
    expect('pauseAdoptPendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseDeclinePendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in pendingOfferTelemetryIo).toBe(false);
    expect('reflectPauseRepository' in pendingOfferTelemetryIo).toBe(false);
    expect('trackPausePendingAdopted' in pendingOfferIo).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferIo).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferIo).toBe(false);
  });

  it('pending-offer-telemetry-io trackers stay distinct from pending-offer-io RPC wrappers', () => {
    expect(trackPausePendingAdopted).not.toBe(pauseAdoptPendingOffer);
    expect(trackPausePendingDeclined).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseSessionAbandoned).not.toBe(pauseAdoptPendingOffer);
    expect(trackAdoptedFromPendingOfferTelemetryIo).not.toBe(pauseDeclinePendingOffer);
    expect(trackDeclinedFromPendingOfferTelemetryIo).not.toBe(getPendingPauseOfferDisplay);
    expect(trackAbandonedFromPendingOfferTelemetryIo).not.toBe(reflectPauseRepository);
    // Reciprocal inline pins: `pause-reflect-pending-offer-telemetry-io.test.ts`;
    // dedicated sibling: `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts` (application + presentation).
  });
});
