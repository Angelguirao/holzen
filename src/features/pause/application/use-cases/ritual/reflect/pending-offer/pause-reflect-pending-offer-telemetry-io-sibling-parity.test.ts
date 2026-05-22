import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as pendingOfferTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';

/**
 * Application-layer cross-surface parity: pending-offer-io vs pending-offer-telemetry-io.
 * Mirrors presentation `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts`;
 * complements `presentation/reflect/pending-offer/pause-reflect-pending-offer-telemetry-io-parity.test.ts`.
 */
describe('pause-reflect-pending-offer-io ↔ pause-reflect-pending-offer-telemetry-io sibling parity (application)', () => {
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
});
