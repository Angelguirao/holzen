import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import * as moodIo from '@/features/pause/presentation/feel/pause-feel-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
  pauseInitialEmotionSelectWithRepository,
  pauseInitialEmotionSkipWithRepository,
  reflectPauseRepository as moodReflectPauseRepository,
} from '@/features/pause/presentation/feel/pause-feel-io';
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
 * Application sibling parity: mood-io vs pending-offer-io (parity with presentation
 * `pause-feel-pending-offer-io-sibling-parity.test.ts` and flow-level
 * `pause-feel-pending-offer-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-feel-io-parity.test.ts` ↔
 * `pause-reflect-pending-offer-io-parity.test.ts`.
 */
describe('pause-feel-io ↔ pause-reflect-pending-offer-io sibling parity (application)', () => {
  it('mood-io and pending-offer-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseInitialEmotionSelect).toBe('function');
    expect(typeof pauseInitialEmotionSkip).toBe('function');
    expect(typeof pauseInitialEmotionSelectWithRepository).toBe('function');
    expect(typeof pauseInitialEmotionSkipWithRepository).toBe('function');
    expect(typeof buildFeelTilesMoodLogOptions).toBe('function');
    expect(typeof moodReflectPauseRepository).toBe('object');

    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof pendingOfferReflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in moodIo).toBe(false);
    expect('pauseDeclinePendingOffer' in moodIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in moodIo).toBe(false);

    expect('pauseInitialEmotionSelect' in pendingOfferIo).toBe(false);
    expect('pauseInitialEmotionSkip' in pendingOfferIo).toBe(false);
    expect('buildFeelTilesMoodLogOptions' in pendingOfferIo).toBe(false);
  });

  it('mood-io exports stay off pending-offer adopt/decline RPC wrappers and display', () => {
    expect(pauseInitialEmotionSelect).not.toBe(pauseAdoptPendingOffer);
    expect(pauseInitialEmotionSkip).not.toBe(pauseDeclinePendingOffer);
    expect(pauseInitialEmotionSelectWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseInitialEmotionSkipWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(buildFeelTilesMoodLogOptions).not.toBe(getPendingPauseOfferDisplay);
    expect(pauseInitialEmotionSelect).not.toBe(getPendingPauseOfferDisplay);
    // Shared default repository binding is intentional; wrapper exports above must stay distinct.
    expect(moodReflectPauseRepository).toBe(pendingOfferReflectPauseRepository);
  });

  it('pending-offer-io exports stay off initial-emotion RPC and feel-tile helpers', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseInitialEmotionSelect);
    expect(pauseDeclinePendingOffer).not.toBe(pauseInitialEmotionSkip);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseInitialEmotionSelectWithRepository);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(pauseInitialEmotionSkipWithRepository);
    expect(getPendingPauseOfferDisplay).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseAdoptPendingOffer).not.toBe(buildFeelTilesMoodLogOptions);
  });
});
