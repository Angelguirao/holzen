import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer', () => ({
  runAdoptPendingPauseOffer: vi.fn(() => Promise.resolve({ status: 'ok' as const, instanceId: 'inst-adopted' })),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer', () => ({
  runDeclinePendingPauseOffer: vi.fn(() => Promise.resolve({ status: 'ok' as const })),
}));

import { runAdoptPendingPauseOffer as runAdoptDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import { getPendingPauseOfferDisplay as getDisplayFromDisplayFlow } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import {
  trackPausePendingAdopted as trackAdoptedFromPendingOfferTelemetryIo,
  trackPausePendingDeclined as trackDeclinedFromPendingOfferTelemetryIo,
  trackPauseSessionAbandoned as trackAbandonedFromPendingOfferTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import * as pendingOfferIo from './pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay as getDisplayFromPendingOfferIo,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from './pause-reflect-pending-offer-io';
import * as pendingOfferTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';
import {
  startPauseReflectFrameFocusAmbience,
  stopPauseReflectFrameFocusAmbience,
} from '@/features/pause/presentation/reflect/ambience/pause-reflect-ambience-io';
import {
  buildReflectionShareTelegramUrl,
  buildReflectionShareText,
  buildReflectionShareTweetUrl,
  buildReflectionShareWhatsAppUrl,
  pauseReflectionShareImage,
} from '@/features/pause/presentation/reflect/share/pause-reflect-share-io';
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
  buildPauseScoreImpacts,
  formatReinforcementQuoteFromSession,
  getSessionQuote,
  pauseReflectOutcomeLog,
  pauseReflectOutcomeLogWithRepository,
  resolvePauseDecideOutcomeFlow,
  resolvePauseSessionReflectAndDecideAfterGeneration,
  resolvePauseSessionReflectAndDecidePreflight,
  showPauseOutcomeNotCompletedToast,
  showPauseOutcomeSaveFailedToast,
} from '@/features/pause/presentation/reflect/flows/pause-reflect-flows-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  pauseShiftEmotionFrameHubDoneWithRepository,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';

describe('pause-reflect-pending-offer-io parity', () => {
  it('presentation I/O pending-offer display matches pending-offer CI umbrella', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromPendingOfferIo);
  });

  it('presentation I/O display matches pause-pending-offer-display-flow CI anchor', () => {
    expect(getPendingPauseOfferDisplay).toBe(getDisplayFromDisplayFlow);
    expect(getDisplayFromPendingOfferIo).toBe(getDisplayFromDisplayFlow);
  });

  it('pending-offer CI umbrella composes the same run-* leaf use cases as presentation I/O', () => {
    expect(runAdoptPendingPauseOffer).toBe(runAdoptDirect);
    expect(runDeclinePendingPauseOffer).toBe(runDeclineDirect);
  });

  it('presentation I/O binds reflectPauseRepository to public-rpc supabasePauseRepository', () => {
    expect(reflectPauseRepository).toBe(supabasePauseRepository);
  });

  it('presentation I/O exports adopt/decline port wrappers distinct from leaf use cases', () => {
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
    expect(pauseAdoptPendingOffer).not.toBe(runAdoptDirect);
    expect(pauseDeclinePendingOffer).not.toBe(runDeclineDirect);
    expect(pauseAdoptPendingOffer).not.toBe(pauseDeclinePendingOffer);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(runAdoptDirect);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(runDeclineDirect);
  });

  it('pauseAdoptPendingOffer delegates to run-adopt-pending-pause-offer with default repository', async () => {
    await pauseAdoptPendingOffer();

    expect(runAdoptDirect).toHaveBeenCalledWith(supabasePauseRepository);
  });

  it('pauseDeclinePendingOffer delegates to run-decline-pending-pause-offer with default repository', async () => {
    await pauseDeclinePendingOffer();

    expect(runDeclineDirect).toHaveBeenCalledWith(supabasePauseRepository);
  });

  it('pauseAdoptPendingOfferWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected-adopt' } as unknown as typeof supabasePauseRepository;

    await pauseAdoptPendingOfferWithRepository(customRepo);

    expect(runAdoptDirect).toHaveBeenCalledWith(customRepo);
  });

  it('pauseDeclinePendingOfferWithRepository forwards injected PauseRepository', async () => {
    const customRepo = { port: 'injected-decline' } as unknown as typeof supabasePauseRepository;

    await pauseDeclinePendingOfferWithRepository(customRepo);

    expect(runDeclineDirect).toHaveBeenCalledWith(customRepo);
  });

  it('presentation pending-offer-io stays off pending-offer-telemetry-io exports', () => {
    expect('trackPausePendingAdopted' in pendingOfferIo).toBe(false);
    expect('trackPausePendingDeclined' in pendingOfferIo).toBe(false);
    expect('trackPauseSessionAbandoned' in pendingOfferIo).toBe(false);
    expect('pauseAdoptPendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('pauseDeclinePendingOffer' in pendingOfferTelemetryIo).toBe(false);
    expect('getPendingPauseOfferDisplay' in pendingOfferTelemetryIo).toBe(false);
    expect('reflectPauseRepository' in pendingOfferTelemetryIo).toBe(false);
  });

  it('pending-offer-io RPC wrappers stay distinct from pending-offer-telemetry-io trackers', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackAdoptedFromPendingOfferTelemetryIo);
    expect(pauseDeclinePendingOffer).not.toBe(trackDeclinedFromPendingOfferTelemetryIo);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackAbandonedFromPendingOfferTelemetryIo);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackAdoptedFromPendingOfferTelemetryIo);
    expect(getPendingPauseOfferDisplay).not.toBe(trackDeclinedFromPendingOfferTelemetryIo);
    expect(reflectPauseRepository).not.toBe(trackAbandonedFromPendingOfferTelemetryIo);
    // Reciprocal inline pins: `pause-reflect-pending-offer-io.test.ts`;
    // dedicated sibling: `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-flows-io-parity.test.ts` and `pause-reflect-flows-io.test.ts`.
   * Dedicated sibling file: `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: flows-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseDeclinePendingOffer).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseReflectOutcomeLog);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseReflectOutcomeLogWithRepository);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(resolvePauseSessionReflectAndDecidePreflight);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(resolvePauseSessionReflectAndDecideAfterGeneration);
    expect(pauseDeclinePendingOffer).not.toBe(buildPauseScoreImpacts);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(resolvePauseDecideOutcomeFlow);
    expect(getPendingPauseOfferDisplay).not.toBe(formatReinforcementQuoteFromSession);
    expect(getPendingPauseOfferDisplay).not.toBe(getSessionQuote);
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectOutcomeLog);
    expect(pauseDeclinePendingOffer).not.toBe(showPauseOutcomeNotCompletedToast);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(showPauseOutcomeSaveFailedToast);
    // Reciprocal inline pins: `pause-reflect-flows-io-parity.test.ts`, `pause-reflect-flows-io.test.ts`.
    // Full pins: `pause-reflect-flows-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-steps-io-parity.test.ts` (pending-offer RPC vs post-it step wrappers).
   * Dedicated sibling file: `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: steps-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseDeclinePendingOffer).not.toBe(pauseReflectNoteUpdate);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseReflectTagUpdateWithRepository);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(pauseReflectFavoriteToggleWithRepository);
    expect(getPendingPauseOfferDisplay).not.toBe(pauseReflectionStepLogOnce);
    expect(pauseAdoptPendingOffer).not.toBe(shouldShowFavoriteProHint);
    expect(pauseDeclinePendingOffer).not.toBe(shouldLogPauseReflectionStep);
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectionStepLogOnceWithRepository);
    // Reciprocal inline pins: `pause-reflect-steps-io-parity.test.ts`.
    // Full pins: `pause-reflect-steps-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (pending-offer RPC vs shift-frame hub).
   * Dedicated sibling file: `pause-reflect-hub-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io shift-frame exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseDeclinePendingOffer).not.toBe(pauseShiftEmotionFrameHubDoneWithRepository);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(getPendingPauseOfferDisplay).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(pauseAdoptPendingOffer).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(pauseDeclinePendingOffer).not.toBe(resolveShiftFrameHubDonePresentation);
    // Reciprocal inline pins: `pause-reflect-hub-io-parity.test.ts`.
    // Full pins: `pause-reflect-hub-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-share-io-parity.test.ts` (pending-offer RPC vs share builders).
   * Dedicated sibling file: `pause-reflect-share-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: share-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectionShareImage);
    expect(pauseDeclinePendingOffer).not.toBe(buildReflectionShareText);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(buildReflectionShareTweetUrl);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(buildReflectionShareWhatsAppUrl);
    expect(getPendingPauseOfferDisplay).not.toBe(buildReflectionShareTelegramUrl);
    expect(reflectPauseRepository).not.toBe(pauseReflectionShareImage);
    // Full pins: `pause-reflect-share-pending-offer-io-sibling-parity.test.ts`.
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-ambience-io-parity.test.ts` (pending-offer RPC vs frame-focus bed).
   * Dedicated sibling file: `pause-reflect-ambience-pending-offer-io-sibling-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: ambience-io frame-focus bed exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOffer).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    expect(getPendingPauseOfferDisplay).not.toBe(startPauseReflectFrameFocusAmbience);
    expect(reflectPauseRepository).not.toBe(stopPauseReflectFrameFocusAmbience);
    // Reciprocal inline pins: `presentation/reflect/ambience/pause-reflect-ambience-io-parity.test.ts`.
  });
});
