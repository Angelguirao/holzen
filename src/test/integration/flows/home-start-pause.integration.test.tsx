import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHomePauseActions } from '@/screens/home/hooks/use-home-pause-actions';

const navigate = vi.fn();
const manualTrigger = vi.fn();

describe('F2 — Home → start pause', () => {
  beforeEach(() => {
    navigate.mockClear();
    manualTrigger.mockReset();
    manualTrigger.mockResolvedValue({
      opened: true,
      instanceId: '00000000-0000-4000-8000-000000000099',
      pendingOffer: false,
      context: 'manual',
    });
  });

  it('navigates to /pause after “I need a pause” (no /tools)', async () => {
    const { result } = renderHook(() =>
      useHomePauseActions({
        message: null,
        context: null,
        lastPauseInstanceId: null,
        openPauseState: null,
        companions: {} as never,
        companionPrefs: {} as never,
        severity: 'mild',
        navigate,
        dismissMessage: vi.fn(),
        manualTrigger,
        manualCooldownRemaining: () => 0,
        startCheckout: vi.fn(),
        dismissAnalyticsSurface: 'home_your_pause_widget',
      }),
    );

    await act(async () => {
      await result.current.handleNeedAPause();
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      '/pause',
      expect.objectContaining({
        state: expect.objectContaining({
          pauseInstanceId: '00000000-0000-4000-8000-000000000099',
        }),
      }),
    );
    for (const call of navigate.mock.calls) {
      expect(String(call[0])).not.toMatch(/\/tools/);
    }
  });
});
