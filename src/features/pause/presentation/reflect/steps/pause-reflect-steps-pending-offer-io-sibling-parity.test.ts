import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  reflectionStepSessionStorage: { storage: 'reflectionStepSessionStorage' },
}));

import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository as pendingOfferReflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as stepsIo from './pause-reflect-steps-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  reflectPauseRepository as stepsReflectPauseRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from './pause-reflect-steps-io';

/**
 * Presentation sibling parity: steps-io vs pending-offer-io (parity with application
 * `pause-reflect-steps-pending-offer-flow-sibling-parity.test.ts`).
 */
describe('pause-reflect-steps-io ↔ pause-reflect-pending-offer-io sibling parity', () => {
  it('steps-io and pending-offer-io are distinct presentation I/O surfaces', () => {
    expect(typeof pauseReflectTagUpdate).toBe('function');
    expect(typeof pauseReflectNoteUpdate).toBe('function');
    expect(typeof pauseReflectFavoriteToggle).toBe('function');
    expect(typeof pauseReflectionStepLogOnce).toBe('function');
    expect(typeof pauseReflectTagUpdateWithRepository).toBe('function');
    expect(typeof pauseReflectNoteUpdateWithRepository).toBe('function');
    expect(typeof pauseReflectFavoriteToggleWithRepository).toBe('function');
    expect(typeof pauseReflectionStepLogOnceWithRepository).toBe('function');
    expect(typeof shouldShowFavoriteProHint).toBe('function');
    expect(typeof shouldLogPauseReflectionStep).toBe('function');
    expect(typeof stepsReflectPauseRepository).toBe('object');

    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof pendingOfferReflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in stepsIo).toBe(false);
    expect('pauseDeclinePendingOffer' in stepsIo).toBe(false);
    expect('pauseAdoptPendingOfferWithRepository' in stepsIo).toBe(false);
    expect('pauseDeclinePendingOfferWithRepository' in stepsIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in stepsIo).toBe(false);

    expect('pauseReflectTagUpdate' in pendingOfferIo).toBe(false);
    expect('pauseReflectNoteUpdate' in pendingOfferIo).toBe(false);
    expect('pauseReflectFavoriteToggle' in pendingOfferIo).toBe(false);
    expect('pauseReflectionStepLogOnce' in pendingOfferIo).toBe(false);
    expect('shouldShowFavoriteProHint' in pendingOfferIo).toBe(false);
    expect('shouldLogPauseReflectionStep' in pendingOfferIo).toBe(false);
  });

  it('step mutation I/O keeps post-it RPC wrappers off pending-offer adopt/decline and display', () => {
    expect(pauseReflectTagUpdate).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectNoteUpdate).not.toBe(pauseDeclinePendingOffer);
    expect(pauseReflectFavoriteToggle).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectionStepLogOnce).not.toBe(pauseDeclinePendingOffer);
    expect(pauseReflectTagUpdateWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(pauseReflectNoteUpdateWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseReflectionStepLogOnceWithRepository).not.toBe(pauseAdoptPendingOffer);
    expect(shouldShowFavoriteProHint).not.toBe(getPendingPauseOfferDisplay);
    expect(shouldLogPauseReflectionStep).not.toBe(pauseDeclinePendingOffer);
  });

  it('pending-offer-io keeps adopt/decline wrappers off step mutations and domain step gates', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseDeclinePendingOffer).not.toBe(pauseReflectNoteUpdate);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseAdoptPendingOffer).not.toBe(shouldShowFavoriteProHint);
    expect(pauseDeclinePendingOffer).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
  });
});
