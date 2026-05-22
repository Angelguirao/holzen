import { describe, expect, it, vi } from 'vitest';
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
  '@/features/pause/application/use-cases/ritual/reflect/pending-offer/pause-reflect-pending-offer-flow',
  () => ({
    runAdoptPendingPauseOffer: runAdoptPendingPauseOfferMock,
    runDeclinePendingPauseOffer: runDeclinePendingPauseOfferMock,
    getPendingPauseOfferDisplay: getPendingPauseOfferDisplayMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { kind: 'supabase' },
}));

describe('pause-reflect-pending-offer-io', () => {
  it('re-exports adopt/decline use cases from pause-reflect-pending-offer-flow', () => {
    expect(typeof pauseAdoptPendingOffer).toBe('function');
    expect(typeof pauseDeclinePendingOffer).toBe('function');
    expect(typeof pauseAdoptPendingOfferWithRepository).toBe('function');
    expect(typeof pauseDeclinePendingOfferWithRepository).toBe('function');
  });

  it('routes adopt through the flow anchor with the default repository', () => {
    pauseAdoptPendingOffer();
    expect(runAdoptPendingPauseOfferMock).toHaveBeenCalledWith({ kind: 'supabase' });
  });

  it('routes decline through the flow anchor with the default repository', () => {
    pauseDeclinePendingOffer();
    expect(runDeclinePendingPauseOfferMock).toHaveBeenCalledWith({ kind: 'supabase' });
  });

  it('re-exports getPendingPauseOfferDisplay from pause-reflect-pending-offer-flow', () => {
    const display: PendingPauseOfferDisplay = getPendingPauseOfferDisplay({
      context: 'btc',
      preview_message: 'Take a breath',
    });
    expect(getPendingPauseOfferDisplayMock).toHaveBeenCalled();
    expect(display.contextText).toBe('mock-context');
  });
});
