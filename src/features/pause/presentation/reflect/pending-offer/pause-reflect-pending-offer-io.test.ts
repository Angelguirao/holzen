import { describe, expect, it, vi } from 'vitest';
import { runAdoptPendingPauseOffer as runAdoptDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer';
import { runDeclinePendingPauseOffer as runDeclineDirect } from '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer';
import {
  pauseReflectFavoriteToggle,
} from '@/features/pause/presentation/reflect/steps/pause-reflect-steps-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  trackPauseReflectPostItOpen,
  trackPauseReflectShareTap,
  trackPauseReflectWallpaperTap,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-telemetry-io';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
  trackPauseSessionAbandoned,
} from '@/features/pause/presentation/reflect/telemetry/pause-reflect-pending-offer-telemetry-io';
import {
  getPendingPauseOfferDisplay,
  pauseAdoptPendingOffer,
  pauseAdoptPendingOfferWithRepository,
  pauseDeclinePendingOffer,
  pauseDeclinePendingOfferWithRepository,
  type PendingPauseOfferDisplay,
} from './pause-reflect-pending-offer-io';

const runAdoptPendingPauseOfferMock = vi.hoisted(() => vi.fn());
const runDeclinePendingPauseOfferMock = vi.hoisted(() => vi.fn());
const getPendingPauseOfferDisplayMock = vi.hoisted(() =>
  vi.fn(() => ({
    contextText: 'mock-context',
    previewMessage: 'mock-preview',
    showPreviewLine: true,
  })),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-adopt-pending-pause-offer',
  () => ({
    runAdoptPendingPauseOffer: runAdoptPendingPauseOfferMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/run-decline-pending-pause-offer',
  () => ({
    runDeclinePendingPauseOffer: runDeclinePendingPauseOfferMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pending-pause-offer-display',
  () => ({
    getPendingPauseOfferDisplay: getPendingPauseOfferDisplayMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { kind: 'supabase' },
}));

describe('pause-reflect-pending-offer-io', () => {
  it('re-exports adopt/decline use cases from pending-offer leaf modules', () => {
    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
  });

  it('exports pending-offer RPC wrappers distinct from leaf use cases', () => {
    expect(pauseAdoptPendingOffer).not.toBe(runAdoptDirect);
    expect(pauseDeclinePendingOffer).not.toBe(runDeclineDirect);
    expect(pauseAdoptPendingOffer).not.toBe(pauseDeclinePendingOffer);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(runAdoptDirect);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(runDeclineDirect);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(pauseDeclinePendingOfferWithRepository);
    expect(pauseAdoptPendingOffer).not.toBe(pauseReflectFavoriteToggle);
    expect(pauseDeclinePendingOffer).not.toBe(pauseReflectFavoriteToggle);
  });

  it('routes adopt through the leaf use case with the default repository', () => {
    pauseAdoptPendingOffer();
    expect(runAdoptPendingPauseOfferMock).toHaveBeenCalledWith({ kind: 'supabase' });
  });

  it('routes decline through the leaf use case with the default repository', () => {
    pauseDeclinePendingOffer();
    expect(runDeclinePendingPauseOfferMock).toHaveBeenCalledWith({ kind: 'supabase' });
  });

  it('pauseAdoptPendingOfferWithRepository forwards injected repository', () => {
    const customRepo = { kind: 'injected-adopt' };
    pauseAdoptPendingOfferWithRepository(customRepo as never);
    expect(runAdoptPendingPauseOfferMock).toHaveBeenCalledWith(customRepo);
  });

  it('pauseDeclinePendingOfferWithRepository forwards injected repository', () => {
    const customRepo = { kind: 'injected-decline' };
    pauseDeclinePendingOfferWithRepository(customRepo as never);
    expect(runDeclinePendingPauseOfferMock).toHaveBeenCalledWith(customRepo);
  });

  it('re-exports getPendingPauseOfferDisplay from pending-pause-offer-display leaf module', () => {
    const display: PendingPauseOfferDisplay = getPendingPauseOfferDisplay({
      context: 'btc',
      preview_message: 'Take a breath',
    });
    expect(getPendingPauseOfferDisplayMock).toHaveBeenCalled();
    expect(display.contextText).toBe('mock-context');
  });

  it('sibling cluster: session reflect telemetry-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackPauseReflectPostItOpen);
    expect(pauseDeclinePendingOffer).not.toBe(trackPauseReflectShareTap);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackPauseReflectWallpaperTap);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackPauseReflectPostItOpen);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPauseReflectShareTap);
    // Session reflect UI: `pause-reflect-pending-offer-session-telemetry-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: pending-offer-telemetry-io exports stay distinct from pending-offer-io', () => {
    expect(pauseAdoptPendingOffer).not.toBe(trackPausePendingAdopted);
    expect(pauseDeclinePendingOffer).not.toBe(trackPausePendingDeclined);
    expect(pauseAdoptPendingOfferWithRepository).not.toBe(trackPauseSessionAbandoned);
    expect(pauseDeclinePendingOfferWithRepository).not.toBe(trackPausePendingAdopted);
    expect(getPendingPauseOfferDisplay).not.toBe(trackPausePendingDeclined);
    // Reciprocal inline pins: `pause-reflect-pending-offer-telemetry-io.test.ts`;
    // dedicated sibling: `pause-reflect-pending-offer-telemetry-io-sibling-parity.test.ts`.
  });
});
