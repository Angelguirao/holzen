import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as hubIo from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository as pendingOfferReflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';

/**
 * Application sibling parity: hub-io vs pending-offer-io (parity with presentation
 * `pause-reflect-hub-pending-offer-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-hub-pending-offer-flow-sibling-parity.test.ts` when present).
 * Reciprocal inline pins: `pause-reflect-hub-io-parity.test.ts` ↔
 * `pause-reflect-pending-offer-io-parity.test.ts`.
 */
describe('pause-reflect-hub-io ↔ pause-reflect-pending-offer-io sibling parity (application)', () => {
  it('hub-io and pending-offer-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(typeof buildShiftEmotionFrameHubLogBundle).toBe('function');
    expect(typeof resolveShiftFrameHubDonePresentation).toBe('function');
    expect(typeof hubReflectPauseRepository).toBe('object');

    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof pendingOfferReflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in hubIo).toBe(false);
    expect('pauseDeclinePendingOffer' in hubIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in hubIo).toBe(false);

    expect('pauseShiftEmotionFrameHubDone' in pendingOfferIo).toBe(false);
    expect('buildShiftEmotionFrameHubLogBundle' in pendingOfferIo).toBe(false);
    expect('resolveShiftFrameHubDonePresentation' in pendingOfferIo).toBe(false);
  });

  it('hub-io exports stay off pending-offer adopt/decline RPC wrappers and display', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseAdoptPendingOffer);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseDeclinePendingOffer);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseShiftEmotionFrameHubDoneWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildShiftEmotionFrameHubLogBundle).not.toBe(getPendingPauseOfferDisplay);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(getPendingPauseOfferDisplay);
    expect(resolveShiftFrameHubDonePresentation).not.toBe(pauseAdoptPendingOffer);
    // Shared default repository binding is intentional; wrapper exports above must stay distinct.
    expect(hubReflectPauseRepository).toBe(pendingOfferReflectPauseRepository);
  });

  it('pending-offer-io exports stay off shift-frame hub RPC and presentation mapping', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseDeclinePendingOffer).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(getPendingPauseOfferDisplay).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(getPendingPauseOfferDisplay).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(pauseAdoptPendingOffer).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(resolveShiftFrameHubDonePresentation);
  });
});
