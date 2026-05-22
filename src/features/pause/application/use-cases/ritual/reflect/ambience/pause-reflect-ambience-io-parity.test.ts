import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
}));

import {
  startPauseReflectFrameFocusAmbience as startDirect,
  stopPauseReflectFrameFocusAmbience as stopDirect,
} from '@/features/pause/domain/ritual/breathe/reflect-frame-focus-ambience';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/application/use-cases/ritual/reflect/ambience/pause-reflect-ambience-flow';
import {
  startPauseReflectFrameFocusAmbience as startFromAmbienceIo,
  stopPauseReflectFrameFocusAmbience as stopFromAmbienceIo,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectTagUpdate,
  pauseReflectionStepLogOnce,
  pauseReflectFavoriteToggleWithRepository,
  pauseReflectNoteUpdateWithRepository,
  pauseReflectTagUpdateWithRepository,
  pauseReflectionStepLogOnceWithRepository,
  shouldLogPauseReflectionStep,
  shouldShowFavoriteProHint,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';

/**
 * Application-layer ambience I/O parity (domain frame-focus leaves ↔ ambience-flow ↔ presentation I/O).
 * Steps-io cross-surface: `pause-reflect-steps-ambience-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts`.
 * Pending-offer cross-surface: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins below.
 */
describe('pause-reflect-ambience-io parity', () => {
  it('presentation I/O frame-focus exports match ambience CI umbrella', () => {
    expect(startPauseReflectFrameFocusAmbience).toBe(startFromAmbienceIo);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopFromAmbienceIo);
  });

  it('ambience CI umbrella composes the same domain frame-focus leaf as presentation I/O', () => {
    expect(startPauseReflectFrameFocusAmbience).toBe(startDirect);
    expect(stopPauseReflectFrameFocusAmbience).toBe(stopDirect);
    expect(startFromAmbienceIo).toBe(startDirect);
    expect(stopFromAmbienceIo).toBe(stopDirect);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (frame-focus bed vs step RPC wrappers).
   * Dedicated sibling file: `pause-reflect-steps-ambience-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startFromAmbienceIo).not.toBe(pauseReflectFavoriteToggle);
    expect(stopFromAmbienceIo).not.toBe(pauseReflectNoteUpdate);
    expect(startFromAmbienceIo).not.toBe(pauseReflectTagUpdate);
    expect(stopFromAmbienceIo).not.toBe(pauseReflectionStepLogOnce);
    expect(startFromAmbienceIo).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(stopFromAmbienceIo).not.toBe(pauseReflectNoteUpdateWithRepository);
    expect(startFromAmbienceIo).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(stopFromAmbienceIo).not.toBe(pauseReflectionStepLogOnceWithRepository);
    expect(startFromAmbienceIo).not.toBe(shouldShowFavoriteProHint);
    expect(stopFromAmbienceIo).not.toBe(shouldLogPauseReflectionStep);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (frame-focus bed vs pending-offer RPC).
   * Dedicated sibling file: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startFromAmbienceIo).not.toBe(pauseAdoptPendingOffer);
    expect(stopFromAmbienceIo).not.toBe(pauseDeclinePendingOffer);
    expect(startFromAmbienceIo).not.toBe(pauseAdoptPendingOfferWithRepository);
    expect(stopFromAmbienceIo).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(startFromAmbienceIo).not.toBe(getPendingPauseOfferDisplay);
    expect(stopFromAmbienceIo).not.toBe(reflectPauseRepository);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io-parity.test.ts`.
  });
});
