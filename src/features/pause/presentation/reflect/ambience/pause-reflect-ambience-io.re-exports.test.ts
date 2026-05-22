import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  startPauseReflectFrameFocusAmbience as startPauseReflectFrameFocusAmbienceDirect,
  stopPauseReflectFrameFocusAmbience as stopPauseReflectFrameFocusAmbienceDirect,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
import {
  startPauseReflectFrameFocusAmbience as startFromAmbienceFlow,
  stopPauseReflectFrameFocusAmbience as stopFromAmbienceFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';

import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';

import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from './pause-reflect-ambience-io';

describe('pause-reflect-ambience-io re-exports', () => {
  it('re-exports frame-focus ambience helpers from domain ritual/breathe leaf module', () => {
    expect(typeof startPauseReflectFrameFocusAmbience).toBe('function');
    expect(typeof stopPauseReflectFrameFocusAmbience).toBe('function');

    expect(startPauseReflectFrameFocusAmbience).toBe(startPauseReflectFrameFocusAmbienceDirect);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopPauseReflectFrameFocusAmbienceDirect);
  });

  it('presentation I/O bindings match pause-reflect-ambience-flow CI anchor (leaf parity)', () => {
    expect(startPauseReflectFrameFocusAmbience).toBe(startFromAmbienceFlow);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopFromAmbienceFlow);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io.re-exports.test.ts` (frame-focus bed vs pending-offer RPC).
   * Dedicated sibling file: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` (presentation + application).
   */
  it('sibling cluster: pending-offer-io re-exports stay distinct from ambience-io re-exports', () => {
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseAdoptPendingOffer);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseDeclinePendingOffer);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(startPauseReflectFrameFocusAmbience).not.toBe(getPendingPauseOfferDisplay);
    expect(stopPauseReflectFrameFocusAmbience).not.toBe(reflectPauseRepository);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io.re-exports.test.ts`.
  });
});
