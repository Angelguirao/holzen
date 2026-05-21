import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { usePendingPauseOfferMutations } from './use-pending-pause-offer-mutations';

const {
  runAdoptPendingPauseOfferMock,
  runDeclinePendingPauseOfferMock,
  trackPausePendingAdoptedMock,
  trackPausePendingDeclinedMock,
  mockPauseRepository,
} = vi.hoisted(() => ({
  runAdoptPendingPauseOfferMock: vi.fn(),
  runDeclinePendingPauseOfferMock: vi.fn(),
  trackPausePendingAdoptedMock: vi.fn(),
  trackPausePendingDeclinedMock: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/pending-offer/run-adopt-pending-pause-offer', () => ({
  runAdoptPendingPauseOffer: runAdoptPendingPauseOfferMock,
}));

vi.mock('@/features/pause/application/use-cases/pending-offer/run-decline-pending-pause-offer', () => ({
  runDeclinePendingPauseOffer: runDeclinePendingPauseOfferMock,
}));

vi.mock('@/features/pause/application/use-cases/trigger/pending-pause-offer-telemetry', () => ({
  trackPausePendingAdopted: trackPausePendingAdoptedMock,
  trackPausePendingDeclined: trackPausePendingDeclinedMock,
}));

vi.mock('./pause-session-pending-offer-io', () => ({
  pauseAdoptPendingOffer: () => runAdoptPendingPauseOfferMock(mockPauseRepository),
  pauseDeclinePendingOffer: () => runDeclinePendingPauseOfferMock(mockPauseRepository),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

const t = ((k: string) => k) as TFunction;
const pending = { id: 'offer-1' } as import('./use-pending-pause-offer').PendingPauseOfferRow;

beforeEach(() => {
  runAdoptPendingPauseOfferMock.mockReset();
  runDeclinePendingPauseOfferMock.mockReset();
  vi.mocked(toast.error).mockClear();
  trackPausePendingAdoptedMock.mockClear();
  trackPausePendingDeclinedMock.mockClear();
});

describe('usePendingPauseOfferMutations', () => {
  it('adopts via pending-offer use case and navigates on success', async () => {
    runAdoptPendingPauseOfferMock.mockResolvedValue({ status: 'ok', instanceId: 'inst-9' });
    const onAfterMutation = vi.fn().mockResolvedValue(undefined);
    const navigateAfterAdopt = vi.fn();
    const refreshPendingOffer = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePendingPauseOfferMutations({
        pending,
        onAfterMutation,
        navigateAfterAdopt,
        refreshPendingOffer,
        t,
      }),
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.handleAdopt();
    });

    expect(ok).toBe(true);
    expect(runAdoptPendingPauseOfferMock).toHaveBeenCalledTimes(1);
    expect(runAdoptPendingPauseOfferMock).toHaveBeenCalledWith(mockPauseRepository);
    expect(trackPausePendingAdoptedMock).toHaveBeenCalledWith('inst-9');
    expect(onAfterMutation).toHaveBeenCalled();
    expect(navigateAfterAdopt).toHaveBeenCalledWith('inst-9');
    expect(refreshPendingOffer).toHaveBeenCalled();
  });

  it('declines via pending-offer use case on success', async () => {
    runDeclinePendingPauseOfferMock.mockResolvedValue({ status: 'ok' });
    const onAfterMutation = vi.fn().mockResolvedValue(undefined);
    const refreshPendingOffer = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePendingPauseOfferMutations({
        pending,
        onAfterMutation,
        refreshPendingOffer,
        t,
      }),
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.handleDecline();
    });

    expect(ok).toBe(true);
    expect(runDeclinePendingPauseOfferMock).toHaveBeenCalledTimes(1);
    expect(runDeclinePendingPauseOfferMock).toHaveBeenCalledWith(mockPauseRepository);
    expect(trackPausePendingDeclinedMock).toHaveBeenCalledWith('offer-1');
    expect(onAfterMutation).toHaveBeenCalled();
    expect(refreshPendingOffer).toHaveBeenCalled();
  });

  it('toasts when adopt RPC returns not ok', async () => {
    runAdoptPendingPauseOfferMock.mockResolvedValue({ status: 'failed' });
    const { result } = renderHook(() =>
      usePendingPauseOfferMutations({
        pending,
        onAfterMutation: vi.fn(),
        refreshPendingOffer: vi.fn().mockResolvedValue(undefined),
        t,
      }),
    );

    let ok = true;
    await act(async () => {
      ok = await result.current.handleAdopt();
    });

    expect(ok).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('pause.pendingAdoptFailed');
  });
});
