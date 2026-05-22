import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectPauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
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
import {
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository as hubReflectPauseRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  resolveReflectGenerationPrefetch,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';

/**
 * Presentation I/O parity (colocated beside `pause-reflect-ambience-io.ts`).
 * Imports `pause-reflect-ambience-flow` CI umbrella for `.toBe` identity pins only — production ambience I/O keeps domain leaf imports.
 * Hub-io sibling pins: `pause-reflect-ambience-hub-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (hub cluster).
 * Generation-io sibling pins: `pause-reflect-ambience-generation-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (generation cluster).
 * Steps-io cross-surface: `pause-reflect-steps-ambience-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (application).
 * Pending-offer cross-surface: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` (application + presentation);
 * reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (presentation).
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
   * Reciprocal inline pins ↔ `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts` (frame-focus bed vs reflect+decide flows).
   * Dedicated sibling file: `pause-reflect-flows-ambience-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startFromAmbienceIo).not.toBe(pauseReflectOutcomeLog);
    expect(stopFromAmbienceIo).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(startFromAmbienceIo).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(stopFromAmbienceIo).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(startFromAmbienceIo).not.toBe(pauseReflectOutcomeLogWithRepository);
    // Reciprocal inline pins: `presentation/reflect/flows/pause-reflect-flows-io-parity.test.ts`.
    // Full pins: `pause-reflect-flows-ambience-io-sibling-parity.test.ts`.
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

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (frame-focus bed vs shift-frame hub).
   * Dedicated sibling file: `pause-reflect-ambience-hub-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startFromAmbienceIo).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(stopFromAmbienceIo).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(startFromAmbienceIo).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(stopFromAmbienceIo).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(startFromAmbienceIo).not.toBe(hubReflectPauseRepository);
    expect(stopFromAmbienceIo).not.toBe(pauseShiftEmotionFrameHubDone);
    // Reciprocal inline pins: `pause-reflect-hub-io-parity.test.ts`.
    // Full pins: `pause-reflect-ambience-hub-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (frame-focus bed vs holzen-reflect).
   * Dedicated sibling file: `pause-reflect-ambience-generation-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: generation-io exports stay distinct from ambience-io frame-focus bed', () => {
    expect(startFromAmbienceIo).not.toBe(runReflectGeneration);
    expect(stopFromAmbienceIo).not.toBe(pauseReflectGeneration);
    expect(startFromAmbienceIo).not.toBe(reflectGenerationPrerequisite);
    expect(stopFromAmbienceIo).not.toBe(messageFromReflectGenerationResult);
    expect(startFromAmbienceIo).not.toBe(resolveReflectGenerationPrefetch);
    expect(stopFromAmbienceIo).not.toBe(shouldCommitReflectGeneration);
    expect(startFromAmbienceIo).not.toBe(reflectGenerator);
    // Reciprocal inline pins: `pause-reflect-generation-io-parity.test.ts`.
    // Full pins: `pause-reflect-ambience-generation-io-sibling-parity.test.ts`.
  });
});
