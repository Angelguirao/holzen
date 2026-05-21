import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { toast } from 'sonner';
import {
  trackPausePendingAdopted,
  trackPausePendingDeclined,
} from '@/features/pause/application/use-cases/trigger/pending-pause-offer-telemetry';
import { usePendingPauseOfferMutations } from './use-pending-pause-offer-mutations';

const {
  adoptPendingOfferMock,
  declinePendingOfferMock,
  mockRepository,
} = vi.hoisted(() => {
  const adoptPendingOfferMock = vi.fn();
  const declinePendingOfferMock = vi.fn();
  return {
    adoptPendingOfferMock,
    declinePendingOfferMock,
    mockRepository: {
      adoptPendingOffer: adoptPendingOfferMock,
      declinePendingOffer: declinePendingOfferMock,
    } as unknown as PauseRepository,
  };
});

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
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
  adoptPendingOfferMock.mockReset();
  declinePendingOfferMock.mockReset();
  vi.mocked(toast.error).mockClear();
  vi.mocked(trackPausePendingAdopted).mockClear();
  vi.mocked(trackPausePendingDeclined).mockClear();
});

describe('usePendingPauseOfferMutations', () => {
  it('adopts via PauseRepository and navigates on success', async () => {
    adoptPendingOfferMock.mockResolvedValue({ ok: true, instance_id: 'inst-9' });
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
    expect(adoptPendingOfferMock).toHaveBeenCalledTimes(1);
    expect(trackPausePendingAdopted).toHaveBeenCalledWith('inst-9');
    expect(onAfterMutation).toHaveBeenCalled();
    expect(navigateAfterAdopt).toHaveBeenCalledWith('inst-9');
    expect(refreshPendingOffer).toHaveBeenCalled();
  });

  it('declines via PauseRepository on success', async () => {
    declinePendingOfferMock.mockResolvedValue({ ok: true, cleared: 1 });
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
    expect(declinePendingOfferMock).toHaveBeenCalledTimes(1);
    expect(trackPausePendingDeclined).toHaveBeenCalledWith('offer-1');
    expect(onAfterMutation).toHaveBeenCalled();
    expect(refreshPendingOffer).toHaveBeenCalled();
  });

  it('toasts when adopt RPC returns not ok', async () => {
    adoptPendingOfferMock.mockResolvedValue({ ok: false });
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
