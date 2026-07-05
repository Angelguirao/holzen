import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' }
}));

import * as flowsIo from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildPauseScoreImpacts,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  reflectPauseRepository as flowsReflectPauseRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository as pendingOfferReflectPauseRepository
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';

/**
 * Application sibling parity: flows-io vs pending-offer-io (parity with presentation
 * `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts` and flow-level
 * `pause-reflect-flows-pending-offer-flow-sibling-parity.test.ts`; complements
 * `pause-reflect-flows-share-io-sibling-parity.test.ts`).
 * Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts` ↔
 * `pause-reflect-pending-offer-io-parity.test.ts` and `pause-reflect-flows-io.test.ts` ↔
 * `pause-reflect-pending-offer-io.test.ts`.
 */
describe('pause-reflect-flows-io ↔ pause-reflect-pending-offer-io sibling parity (application)', () => {
  it('flows-io and pending-offer-io are distinct presentation I/O surfaces', () => {
    expect(typeof resolvePauseSessionReflectAndDecidePreflight).toBe('function');
    expect(typeof resolvePauseSessionReflectAndDecideAfterGeneration).toBe('function');
    expect(typeof resolvePauseDecideOutcomeFlow).toBe('function');
    expect(typeof buildPauseScoreImpacts).toBe('function');
    expect(typeof pauseReflectOutcomeLog).toBe('function');
    expect(typeof pauseReflectOutcomeLogWithRepository).toBe('function');
    expect(typeof showPauseOutcomeNotCompletedToast).toBe('function');
    expect(typeof showPauseOutcomeSaveFailedToast).toBe('function');
    expect(typeof flowsReflectPauseRepository).toBe('object');

    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(typeof pendingOfferReflectPauseRepository).toBe('object');

    expect('pauseAdoptPendingOffer' in flowsIo).toBe(false);
    expect('pauseDeclinePendingOffer' in flowsIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in flowsIo).toBe(false);

    expect('resolvePauseSessionReflectAndDecidePreflight' in pendingOfferIo).toBe(false);
    expect('pauseReflectOutcomeLog' in pendingOfferIo).toBe(false);
    expect('buildPauseScoreImpacts' in pendingOfferIo).toBe(false);
    expect('showPauseOutcomeNotCompletedToast' in pendingOfferIo).toBe(false);
  });

  it('flows-io exports stay off pending-offer adopt/decline RPC and display', () => {
    expect(resolvePauseSessionReflectAndDecidePreflight).not.toBe(pauseAdoptPendingOffer);
    expect(resolvePauseSessionReflectAndDecideAfterGeneration).not.toBe(pauseDeclinePendingOffer);
    expect(pauseReflectOutcomeLog).not.toBe(getPendingPauseOfferDisplay);
    expect(pauseReflectOutcomeLogWithRepository).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(buildPauseScoreImpacts).not.toBe(pauseDeclinePendingOffer);
    expect(showPauseOutcomeSaveFailedToast).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(resolvePauseDecideOutcomeFlow).not.toBe(pauseAdoptPendingOfferWithRepository);
    // Shared default repository binding is intentional; wrapper exports above must stay distinct.
    expect(flowsReflectPauseRepository).toBe(pendingOfferReflectPauseRepository);
  });

  it('pending-offer-io exports stay off reflect+decide flow helpers and outcome RPC', () => {
    expect(pauseAdoptPendingOffer).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseDeclinePendingOffer).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseReflectOutcomeLog);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseDeclinePendingOffer).not.toBe(buildPauseScoreImpacts);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(pauseAdoptPendingOffer).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(pauseDeclinePendingOffer).not.toBe(showPauseOutcomeSaveFailedToast);
  });
});
