import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionPendingPauseOfferNavigation } from '@/screens/pause/hooks/use-pause-session-pending-pause-offer-navigation';

const clearSessionMock = vi.fn();

vi.mock('@/features/pause/public', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pause/public')>();
  return {
    ...actual,
    clearSession: (...args: unknown[]) => clearSessionMock(...args),
  };
});

describe('usePauseSessionPendingPauseOfferNavigation', () => {
  beforeEach(() => {
    clearSessionMock.mockClear();
  });

  it('onAfterMutation voids resync', async () => {
    const resyncOpenPauseFromDb = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionPendingPauseOfferNavigation({ navigate, resyncOpenPauseFromDb }),
    );
    await act(async () => {
      result.current.onAfterMutation();
    });
    expect(resyncOpenPauseFromDb).toHaveBeenCalledTimes(1);
  });

  it('navigateAfterAdopt clears session then navigates with instance id', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() =>
      usePauseSessionPendingPauseOfferNavigation({
        navigate,
        resyncOpenPauseFromDb: vi.fn(),
      }),
    );
    act(() => {
      result.current.navigateAfterAdopt('abc-uuid');
    });
    expect(clearSessionMock).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/pause', {
      state: { pauseInstanceId: 'abc-uuid' },
      replace: true,
    });
  });
});
