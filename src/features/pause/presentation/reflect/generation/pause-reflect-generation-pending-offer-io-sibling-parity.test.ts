import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'reflectGenerator' },
}));

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
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from './pause-reflect-generation-io';
import * as generationIo from './pause-reflect-generation-io';

/**
 * Presentation sibling parity: generation-io vs pending-offer-io (parity with application
 * `pause-reflect-generation-pending-offer-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-generation-pending-offer-flow-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-generation-io-parity.test.ts` ↔
 * `pause-reflect-pending-offer-io-parity.test.ts`.
 */
describe('pause-reflect-generation-io ↔ pause-reflect-pending-offer-io sibling parity', () => {
  it('generation-io and pending-offer-io are distinct presentation I/O surfaces', () => {
    expect(typeof runReflectGeneration).toBe('function');
    expect(typeof reflectGenerationPrerequisite).toBe('function');
    expect(typeof messageFromReflectGenerationResult).toBe('function');
    expect(typeof shouldCommitReflectGeneration).toBe('function');
    expect(typeof pauseReflectGeneration).toBe('function');
    expect(typeof reflectGenerator).toBe('object');

    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof reflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in generationIo).toBe(false);
    expect('pauseDeclinePendingOffer' in generationIo).toBe(false);
    expect('pauseAdoptPendingOfferWithRepository' in generationIo).toBe(false);
    expect('pauseDeclinePendingOfferWithRepository' in generationIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in generationIo).toBe(false);

    expect('runReflectGeneration' in pendingOfferIo).toBe(false);
    expect('pauseReflectGeneration' in pendingOfferIo).toBe(false);
    expect('reflectGenerationPrerequisite' in pendingOfferIo).toBe(false);
    expect('shouldCommitReflectGeneration' in pendingOfferIo).toBe(false);
    expect('reflectGenerator' in pendingOfferIo).toBe(false);
  });

  it('generation-io exports stay off pending-offer adopt/decline RPC wrappers and display', () => {
    expect(runReflectGeneration).not.toBe(pauseAdoptPendingOffer);
    expect(pauseReflectGeneration).not.toBe(pauseDeclinePendingOffer);
    expect(reflectGenerationPrerequisite).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(shouldCommitReflectGeneration).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(messageFromReflectGenerationResult).not.toBe(getPendingPauseOfferDisplay);
    expect(reflectGenerator).not.toBe(reflectPauseRepository);
  });

  it('pending-offer-io exports stay off holzen-reflect generation wrappers and domain gates', () => {
    expect(pauseAdoptPendingOffer).not.toBe(runReflectGeneration);
    expect(pauseDeclinePendingOffer).not.toBe(pauseReflectGeneration);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(reflectGenerationPrerequisite);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(shouldCommitReflectGeneration);
    expect(getPendingPauseOfferDisplay).not.toBe(messageFromReflectGenerationResult);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
  });
});
