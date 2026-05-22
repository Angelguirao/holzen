/**
 * Application-layer I/O parity for ritual reflect pending-offer cluster (parity with
 * `pause-reflect-hub-io-parity.test.ts`; presentation pins stay colocated beside
 * `pause-reflect-pending-offer-io.ts`).
 * Imports `pause-reflect-pending-offer-flow` CI umbrella for `.toBe` identity pins only —
 * production pending-offer I/O keeps run-* + display leaf imports.
 */
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
import { getPendingPauseOfferDisplay as getDisplayFromDisplayFlow } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-pending-offer-display-flow';
import {
  getPendingPauseOfferDisplay,
  runAdoptPendingPauseOffer,
  runDeclinePendingPauseOffer,
} from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow';
import * as pendingOfferIo from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import {
  getPendingPauseOfferDisplay as getDisplayFromPendingOfferIo,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  reflectPauseRepository,
} from '@/features/pause/presentation/reflect/pending-offer/pause-reflect-pending-offer-io';
import * as pendingOfferTelemetryIo from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  trackPausePendingAdopted as trackAdoptedFromTelemetryIo,
  trackPausePendingDeclined as trackDeclinedFromTelemetryIo,
  trackPauseSessionAbandoned as trackAbandonedFromTelemetryIo,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  buildShiftEmotionFrameHubLogBundle,
  pauseShiftEmotionFrameHubDone,
  resolveShiftFrameHubDonePresentation,
} from '@/features/pause/presentation/reflect/hub/pause-reflect-hub-io';
import {
  buildFeelTilesMoodLogOptions,
  pauseInitialEmotionSelect,
  pauseInitialEmotionSkip,
} from '@/features/pause/presentation/reflect/mood/pause-reflect-mood-io';
import { supabasePauseRepository } from '@/features/pause/public-rpc';

/**
 * Application mirror: `presentation/reflect/pending-offer/pause-reflect-pending-offer-io-parity.test.ts`.
 */
describe('pause-reflect-pending-offer-io parity (application)', () => {
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
    expect(pauseAdoptPendingOffer).not.toBe(trackAdoptedFromTelemetryIo);
    expect(pauseDeclinePendingOffer).not.toBe(trackDeclinedFromTelemetryIo);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackAbandonedFromTelemetryIo);
    expect(getPendingPauseOfferDisplay).not.toBe(trackDeclinedFromTelemetryIo);
    expect(reflectPauseRepository).not.toBe(trackAbandonedFromTelemetryIo);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-hub-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: hub-io shift-frame exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseShiftEmotionFrameHubDone);
    expect(pauseDeclinePendingOffer).not.toBe(buildShiftEmotionFrameHubLogBundle);
    expect(getPendingPauseOfferDisplay).not.toBe(resolveShiftFrameHubDonePresentation);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseShiftEmotionFrameHubDone);
  });

  /**
   * Reciprocal inline pins ↔ `pause-reflect-mood-io-parity.test.ts` (application + presentation).
   */
  it('sibling cluster: mood-io initial-emotion exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(pauseInitialEmotionSelect);
    expect(pauseDeclinePendingOffer).not.toBe(pauseInitialEmotionSkip);
    expect(getPendingPauseOfferDisplay).not.toBe(buildFeelTilesMoodLogOptions);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseInitialEmotionSelect);
  });
});
