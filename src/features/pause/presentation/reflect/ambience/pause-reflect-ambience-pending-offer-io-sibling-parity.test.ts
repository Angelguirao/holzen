import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';
import * as ambienceIo from './pause-reflect-ambience-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';

/**
 * Presentation sibling parity: ambience-io vs pending-offer-io (parity with
 * `pause-reflect-generation-pending-offer-io-sibling-parity.test.ts` and
 * `pause-reflect-ambience-hub-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-ambience-io ↔ pause-reflect-pending-offer-io sibling parity', () => {
  it('ambience-io and pending-offer-io are distinct presentation I/O surfaces', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in ambienceIo).toBe(false);
    expect('pauseDeclinePendingOffer' in ambienceIo).toBe(false);
    expect('pauseAdoptPendingOfferWithRepository' in ambienceIo).toBe(false);
    expect('pauseDeclinePendingOfferWithRepository' in ambienceIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in ambienceIo).toBe(false);
    expect('reflectPauseRepository' in ambienceIo).toBe(false);

    expect('startPauseReflectFrameFocusAmbience' in pendingOfferIo).toBe(false);
    expect('stopPauseReflectFrameFocusAmbience' in pendingOfferIo).toBe(false);
  });

  it('frame-focus ambience I/O keeps Web Audio bed off pending-offer adopt/decline RPC and display', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseAdoptPendingOffer);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseDeclinePendingOffer);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(getPendingPauseOfferDisplay);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(reflectPauseRepository);
  });

  it('pending-offer-io exports stay off reflect/frame focus-bed Web Audio helpers', () => {
    expect(pauseAdoptPendingOffer).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOffer).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(getPendingPauseOfferDisplay).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
  });
});
