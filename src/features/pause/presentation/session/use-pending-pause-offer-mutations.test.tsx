import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '@/features/pause/application/use-cases/trigger/pending-pause-offer-telemetry';
import { usePendingPauseOfferMutations } from './use-pending-pause-offer-mutations';

const { adoptPendingPauseOfferMock, declinePendingPauseOfferMock } = vi.hoisted(() => ({
  adoptPendingPauseOfferMock: vi.fn(),
  declinePendingPauseOfferMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  adoptPendingPauseOffer: adoptPendingPauseOfferMock,
  declinePendingPauseOffer: declinePendingPauseOfferMock,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock(
  '@/features/pause/application/use-cases/trigger/pending-pause-offer-telemetry',
  () => ({
    trackPausePendingAdopted: vi.fn(),
    trackPausePendingDeclined: vi.fn(),
  }),
);

const t = ((k: string) => k) as TFunction;
const pending = { id: 'offer-1' } as import('./use-pending-pause-offer').PendingPauseOfferRow;

beforeEach(() => {
  adoptPendingPauseOfferMock.mockReset();
  declinePendingPauseOfferMock.mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(trackPausePendingAdopted).mockClear();
  vi.mocked(trackPausePendingDeclined).mockClear();
});

describe('usePendingPauseOfferMutations', () => {
  it('adopts via public-rpc facade and navigates on success', async () => {
    adoptPendingPauseOfferMock.mockResolvedValue({ status: 'ok', instanceId: 'inst-9' });
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
    expect(adoptPendingPauseOfferMock).toHaveBeenCalledTimes(1);
    expect(trackPausePendingAdopted).toHaveBeenCalledWith('inst-9');
    expect(onAfterMutation).toHaveBeenCalled();
    expect(navigateAfterAdopt).toHaveBeenCalledWith('inst-9');
    expect(refreshPendingOffer).toHaveBeenCalled();
  });

  it('declines via public-rpc facade on success', async () => {
    declinePendingPauseOfferMock.mockResolvedValue({ status: 'ok' });
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
    expect(declinePendingPauseOfferMock).toHaveBeenCalledTimes(1);
    expect(trackPausePendingDeclined).toHaveBeenCalledWith('offer-1');
    expect(onAfterMutation).toHaveBeenCalled();
    expect(refreshPendingOffer).toHaveBeenCalled();
  });

  it('toasts when adopt RPC returns not ok', async () => {
    adoptPendingPauseOfferMock.mockResolvedValue({ status: 'failed' });
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
