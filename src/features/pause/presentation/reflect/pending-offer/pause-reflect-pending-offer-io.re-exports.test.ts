import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

import { getPendingPauseOfferDisplay as getDisplayDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display';
import { runAdoptPendingPauseOffer as runAdoptDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer';
import { getPendingPauseOfferDisplay as getDisplayFromDisplayFlow } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow';
import {
  getPendingPauseOfferDisplay as getDisplayFromPendingOfferFlow,
  runAdoptPendingPauseOffer as runAdoptFromPendingOfferFlow,
  runDeclinePendingPauseOffer as runDeclineFromPendingOfferFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import { supabasePauseRepository } from '@/features/pause/public-rpc';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';

import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from './pause-reflect-pending-offer-io';

describe('pause-reflect-pending-offer-io re-exports', () => {
  it('re-exports pending-offer display from pending-pause-offer-display leaf module', () => {
    expect(typeof getPendingPauseOfferDisplay).toBe('function');
    expect(getPendingPauseOfferDisplay).toBe(getDisplayDirect);
  });

  it('binds default reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O bindings match pause-reflect-pending-offer-flow CI anchor (leaf parity)', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromPendingOfferFlow);
    expect(runAdoptFromPendingOfferFlow).toBe(runAdoptDirect);
    expect(runDeclineFromPendingOfferFlow).toBe(runDeclineDirect);
  });

  it('presentation I/O display binding matches pause-pending-offer-display-flow CI anchor', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromDisplayFlow);
    expect(getDisplayFromDisplayFlow).toBe(getDisplayDirect);
    expect(getDisplayFromDisplayFlow).toBe(getDisplayFromPendingOfferFlow);
  });

  it('presentation port-bound wrappers stay off pending-offer-flow CI umbrella exports', () => {
    expect(pauseAdoptPendingOffer).not.toBe(runAdoptFromPendingOfferFlow);
    expect(pauseDeclinePendingOffer).not.toBe(runDeclineFromPendingOfferFlow);
    expect(pauseAdoptPendingOffer).not.toBe(runDeclineFromPendingOfferFlow);
    expect(pauseDeclinePendingOffer).not.toBe(runAdoptFromPendingOfferFlow);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(runAdoptFromPendingOfferFlow);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(runDeclineFromPendingOfferFlow);
    expect(reflectPauseRepository).not.toBe(getDisplayFromPendingOfferFlow);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io.re-exports.test.ts` (pending-offer RPC vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` (presentation + application).
   */
  it('sibling cluster: ambience-io re-exports stay distinct from pending-offer-io re-exports', () => {
    expect(pauseAdoptPendingOffer).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOffer).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(getPendingPauseOfferDisplay).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `pause-reflect-ambience-io.re-exports.test.ts`.
  });
});
