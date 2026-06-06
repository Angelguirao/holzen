import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHomePauseActions } from './use-home-pause-actions';

const { trackPauseOpenDismissedMock } = vi.hoisted(() => ({
  trackPauseOpenDismissedMock: vi.fn(),
}));

vi.mock('@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-telemetry-io', () => ({
  trackPauseOpenDismissed: trackPauseOpenDismissedMock,
}));

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

  it('navigates to /pause depth picker immediately, then replaces state after manual open', async () => {
    const { result } = renderHook(() =>
      useHomePauseActions({
        message: null,
        context: null,
        lastPauseInstanceId: null,
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

    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate.mock.calls[0]).toEqual([
      '/pause',
      expect.objectContaining({
        state: expect.objectContaining({
          startAtDepthPicker: true,
          openingManualPause: true,
        }),
      }),
    ]);
    expect(navigate.mock.calls[1]).toEqual([
      '/pause',
      expect.objectContaining({
        replace: true,
        state: expect.objectContaining({
          pauseInstanceId: '00000000-0000-4000-8000-000000000099',
          startAtDepthPicker: true,
        }),
      }),
    ]);
    expect(manualTrigger).toHaveBeenCalledWith(undefined, { skipHomePreview: true });
    for (const call of navigate.mock.calls) {
      expect(String(call[0])).not.toMatch(/\/tools/);
    }
  });
});
