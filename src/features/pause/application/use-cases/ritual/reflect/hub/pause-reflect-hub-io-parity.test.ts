/**
 * Application-layer I/O parity for ritual reflect hub cluster (parity with
 * `pause-reflect-flows-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-hub-io.ts`).
 * Imports `pause-reflect-hub-flow` CI umbrella for `.toBe` identity pins only —
 * production hub I/O keeps domain + `run-shift-emotion-frame-hub-done` leaf imports.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
  supabaseReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done',
  () => ({
    runShiftEmotionFrameHubDone: vi.fn(() =>
      Promise.resolve({ status: 'advance' as const, logKey: 'k' }),
    ),
  }),
);

import { runShiftEmotionFrameHubDone as runShiftHubDoneDirect } from '@/features/pause/application/use-cases/ritual/reflect/hub/run-shift-emotion-frame-hub-done';
import { buildShiftEmotionFrameHubLogBundle as buildLogBundleDirect } from '@/features/pause/domain/reflect/hub/shift-emotion-log';
import {
  resolveShiftFrameHubDonePresentation as resolvePresentationDirect,
} from '@/features/pause/domain/reflect/hub/shift-frame-hub-done-presentation';
import {
  buildShiftEmotionFrameHubLogBundle,
  resolveShiftFrameHubDonePresentation,
  runShiftEmotionFrameHubDone as runShiftHubDoneFromFlow,
} from '@/features/pause/application/use-cases/ritual/reflect/hub/pause-reflect-hub-flow';
import {
  buildShiftEmotionFrameHubLogBundle as buildLogBundleFromHubIo,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  reflectPauseRepository,
  resolveShiftFrameHubDonePresentation as resolvePresentationFromHubIo,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  messageFromReflectGenerationResult,
  pauseReflectGeneration,
  reflectGenerationPrerequisite,
  reflectGenerator,
  runReflectGeneration,
  shouldCommitReflectGeneration,
} from '@/features/pause/presentation/reflect/generation/pause-reflect-generation-io';
import {
  pauseReflectFavoriteToggle,
  pauseReflectNoteUpdate,
  pauseReflectionStepLogOnce,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  formatReinforcementQuoteFromSession,
  pauseReflectOutcomeLog,
  resolvePauseSessionReflectAndDecidePreflight,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/**
 * Application mirror: `presentation/reflect/hub/pause-reflect-hub-io-parity.test.ts`.
 */
describe('pause-reflect-hub-io parity (application)', () => {
  it('presentation I/O hub exports match hub CI umbrella', () => {
    expect(buildShiftEmotionFrameHubLogBundle).toBe(buildLogBundleFromHubIo);
    expect(resolveShiftFrameHubDonePresentation).toBe(resolvePresentationFromHubIo);
    expect(runShiftHubDoneFromFlow).toBe(runShiftHubDoneDirect);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('hub CI umbrella composes the same domain + leaf modules as presentation I/O', () => {
    expect(buildShiftEmotionFrameHubLogBundle).toBe(buildLogBundleDirect);
    expect(resolveShiftFrameHubDonePresentation).toBe(resolvePresentationDirect);
    expect(runShiftHubDoneFromFlow).toBe(runShiftHubDoneDirect);
    expect(buildLogBundleFromHubIo).toBe(buildLogBundleDirect);
    expect(resolvePresentationFromHubIo).toBe(resolvePresentationDirect);
  });

  it('presentation I/O exports hub RPC wrapper distinct from leaf use case', () => {
    expect(typeof pauseShiftEmotionFrameHubDone).toBe('function');
    expect(typeof pauseShiftEmotionFrameHubDoneWithRepository).toBe('function');
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runShiftHubDoneDirect);
  });

  it('pauseShiftEmotionFrameHubDone delegates to run-shift-emotion-frame-hub-done with default repository', async () => {
    const input = { pauseInstanceId: 'inst-hub-app', lastShiftLogKey: null };

    await pauseShiftEmotionFrameHubDone(input);

    expect(runShiftHubDoneDirect).toHaveBeenCalledWith(supabasePauseRepository, input);
  });

  it('pauseShiftEmotionFrameHubDoneWithRepository delegates with injected repository', async () => {
    const customRepository = { port: 'customPauseRepository' };
    const input = { pauseInstanceId: 'inst-hub-app-custom', lastShiftLogKey: 'key-1' };

    await pauseShiftEmotionFrameHubDoneWithRepository(
      customRepository as unknown as typeof supabasePauseRepository,
      input,
    );

    expect(runShiftHubDoneDirect).toHaveBeenCalledWith(customRepository, input);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-generation-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: generation-io holzen-reflect exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(runReflectGeneration);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectGeneration);
    expect(buildLogBundleFromHubIo).not.toBe(reflectGenerationPrerequisite);
    expect(resolvePresentationFromHubIo).not.toBe(shouldCommitReflectGeneration);
    expect(reflectPauseRepository).not.toBe(reflectGenerator);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(messageFromReflectGenerationResult);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectNoteUpdate);
    expect(buildLogBundleFromHubIo).not.toBe(pauseReflectionStepLogOnce);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io reflect+decide exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseReflectOutcomeLog);
    expect(buildLogBundleFromHubIo).not.toBe(formatReinforcementQuoteFromSession);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-pending-offer-io-parity.test.ts` (presentation).
   */
  it('sibling cluster: pending-offer-io exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(pauseAdoptPendingOffer);
    expect(buildLogBundleFromHubIo).not.toBe(getPendingPauseOfferDisplay);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io frame-focus bed exports stay distinct from hub-io wrappers', () => {
    expect(pauseShiftEmotionFrameHubDone).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseShiftEmotionFrameHubDone).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(buildLogBundleFromHubIo).not.toBe(startPauseReflectFrameFocusAmbience);
  });
});
