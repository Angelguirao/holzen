/**
 * Presentation sibling parity (colocated beside `pause-reflect-pending-offer-telemetry-io.ts`):
 * pending-offer RPC I/O vs pending-offer PostHog telemetry I/O stay namespace-separated.
 * Application mirror: `application/.../pending-offer/pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts`.
 * Distinct from colocated `pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts` (pending-offer-io ↔ session telemetry-io).
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as pendingOfferTelemetryIo from './pause-reflect-pending-offer-telemetry-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from './pause-reflect-pending-offer-telemetry-io';

describe('pause-reflect-pending-offer-io ↔ pause-reflect-pending-offer-telemetry-io sibling parity', () => {
  it('pending-offer-io and pending-offer-telemetry-io are distinct presentation I/O surfaces', () => {
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');

    expect('trackPausePendingAdopted' in pendingOfferIo).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferIo).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferIo).toBe(false);

    expect('getPendingPauseOfferDisplay' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseAdoptPendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseDeclinePendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseAdoptPendingOfferWithRepository' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseDeclinePendingOfferWithRepository' in pendingOfferTelemetryIo).toBe(false);
    expect('reflectPauseRepository' in pendingOfferTelemetryIo).toBe(false);
  });

  it('pending-offer RPC I/O keeps adopt/decline wrappers off PostHog telemetry trackers', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackPausePendingAdopted);
    expect(pauseDeclinePendingOffer).not.toBe(trackPausePendingDeclined);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackPauseSessionAbandoned);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackPausePendingAdopted);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPausePendingDeclined);
    expect(reflectPauseRepository).not.toBe(trackPauseSessionAbandoned);
  });

  it('pending-offer telemetry I/O keeps PostHog trackers off RPC and display helpers', () => {
    expect(trackPausePendingAdopted).not.toBe(pauseAdoptPendingOffer);
    expect(trackPausePendingDeclined).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseSessionAbandoned).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(trackPausePendingAdopted).not.toBe(getPendingPauseOfferDisplay);
    expect(trackPausePendingDeclined).not.toBe(reflectPauseRepository);
    expect(trackPauseSessionAbandoned).not.toBe(pauseDeclinePendingOfferWithRepository);
  });
});
