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
import * as shareIo from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';

/**
 * Presentation sibling parity: share-io vs pending-offer-io (parity with
 * application `pause-reflect-share-pending-offer-flow-sibling-parity.test.ts` and
 * `pause-reflect-generation-pending-offer-io-sibling-parity.test.ts`).
 */
describe('pause-reflect-share-io ↔ pause-reflect-pending-offer-io sibling parity', () => {
  it('share-io and pending-offer-io are distinct presentation I/O surfaces', () => {
    expect(typeof buildReflectionShareText).toBe('function');
    expect(typeof buildReflectionShareTweetUrl).toBe('function');
    expect(typeof buildReflectionShareWhatsAppUrl).toBe('function');
    expect(typeof buildReflectionShareTelegramUrl).toBe('function');
    expect(typeof pauseReflectionShareImage).toBe('function');

    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in shareIo).toBe(false);
    expect('pauseDeclinePendingOffer' in shareIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in shareIo).toBe(false);
    expect('reflectPauseRepository' in shareIo).toBe(false);

    expect('pauseReflectionShareImage' in pendingOfferIo).toBe(false);
    expect('buildReflectionShareText' in pendingOfferIo).toBe(false);
    expect('buildReflectionShareTweetUrl' in pendingOfferIo).toBe(false);
    expect('buildReflectionShareWhatsAppUrl' in pendingOfferIo).toBe(false);
    expect('buildReflectionShareTelegramUrl' in pendingOfferIo).toBe(false);
  });

  it('share builders and PNG orchestration stay off pending-offer RPC and display', () => {
    expect(pauseReflectionShareImage).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectionShareImage).not.toBe(pauseDeclinePendingOffer);
    expect(buildReflectionShareText).not.toBe(getPendingPauseOfferDisplay);
    expect(buildReflectionShareTweetUrl).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(buildReflectionShareWhatsAppUrl).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildReflectionShareTelegramUrl).not.toBe(reflectPauseRepository);
  });

  it('pending-offer RPC wrappers stay off reflection share builders and PNG orchestration', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectionShareImage);
    expect(pauseDeclinePendingOffer).not.toBe(buildReflectionShareText);
    expect(getPendingPauseOfferDisplay).not.toBe(buildReflectionShareTweetUrl);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(buildReflectionShareTelegramUrl);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
  });
});
