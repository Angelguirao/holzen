import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import * as pendingOfferFlow from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import {
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from './pause-reflect-pending-offer-io';
import * as pendingOfferIo from './pause-reflect-pending-offer-io';

/**
 * Presentation sibling parity: pending-offer-flow CI umbrella vs pending-offer-io port-bound wrappers.
 * Mirrors application `pause-reflect-pending-offer-flow-io-wrapper-sibling-parity.test.ts`
 * (colocated beside `pause-reflect-pending-offer-flow.ts`).
 * Delegation parity: colocated `pause-reflect-pending-offer-io-parity.test.ts`.
 */
describe('pause-reflect-pending-offer-flow ↔ pause-reflect-pending-offer-io wrapper sibling parity (presentation)', () => {
  it('pending-offer-flow CI umbrella and presentation pending-offer-io are distinct anchors', () => {
    expect(typeof runAdoptPendingPauseOffer).toBe('function');
    expect(typeof runDeclinePendingPauseOffer).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof trackPausePendingAdopted).toBe('function');
    expect(typeof trackPausePendingDeclined).toBe('function');
    expect(typeof trackPauseSessionAbandoned).toBe('function');
    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in pendingOfferFlow).toBe(false);
    expect('pauseDeclinePendingOffer' in pendingOfferFlow).toBe(false);
    expect('pauseAdoptPendingOfferWithRepository' in pendingOfferFlow).toBe(false);
    expect('pauseDeclinePendingOfferWithRepository' in pendingOfferFlow).toBe(false);
    expect('reflectPauseRepository' in pendingOfferFlow).toBe(false);
    expect('trackPausePendingAdopted' in pendingOfferIo).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferIo).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferIo).toBe(false);
  });

  it('pending-offer-flow umbrella exports stay off presentation port-bound wrappers', () => {
    expect(runAdoptPendingPauseOffer).not.toBe(pauseAdoptPendingOffer);
    expect(runDeclinePendingPauseOffer).not.toBe(pauseDeclinePendingOffer);
    expect(runAdoptPendingPauseOffer).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(runDeclinePendingPauseOffer).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseAdoptPendingOffer);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseDeclinePendingOffer);
    expect(trackPausePendingAdopted).not.toBe(pauseAdoptPendingOffer);
    expect(trackPausePendingDeclined).not.toBe(pauseDeclinePendingOffer);
    expect(trackPauseSessionAbandoned).not.toBe(reflectPauseRepository);
  });

  it('presentation pending-offer-io wrappers stay off pending-offer-flow leaf re-exports', () => {
    expect(pauseAdoptPendingOffer).not.toBe(runAdoptPendingPauseOffer);
    expect(pauseDeclinePendingOffer).not.toBe(runDeclinePendingPauseOffer);
    expect(pauseAdoptPendingOffer).not.toBe(runDeclinePendingPauseOffer);
    expect(pauseDeclinePendingOffer).not.toBe(runAdoptPendingPauseOffer);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(runAdoptPendingPauseOffer);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(runDeclinePendingPauseOffer);
    expect(reflectPauseRepository).not.toBe(getPendingPauseOfferDisplay);
    expect(pauseAdoptPendingOffer).not.toBe(trackPausePendingAdopted);
    expect(pauseDeclinePendingOffer).not.toBe(trackPausePendingDeclined);
  });
});
