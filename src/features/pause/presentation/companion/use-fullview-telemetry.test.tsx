import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useFullviewTelemetry } from './use-fullview-telemetry';

const { logCompanionFullviewOpenedMock } = vi.hoisted(() => ({
  logCompanionFullviewOpenedMock: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('@/features/pause/presentation/companion/pause-companion-analytics-io', () => ({
  logCompanionFullviewOpened: logCompanionFullviewOpenedMock,
}));

const useAuthMock = vi.fn(() => ({ user: { id: 'user-1' } as User }));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => useAuthMock(),
}));

beforeEach(() => {
  logCompanionFullviewOpenedMock.mockReset().mockResolvedValue({ ok: true });
  useAuthMock.mockReturnValue({ user: { id: 'user-1' } as User });
});

describe('useFullviewTelemetry', () => {
  it('no-ops when pauseInstanceId is missing', async () => {
    renderHook(() => useFullviewTelemetry('signal', null));

    await waitFor(() => {
      expect(logCompanionFullviewOpenedMock).not.toHaveBeenCalled();
    });
  });

  it('no-ops when user is missing', async () => {
    useAuthMock.mockReturnValue({ user: null });

    renderHook(() => useFullviewTelemetry('grounding', 'inst-1'));

    await waitFor(() => {
      expect(logCompanionFullviewOpenedMock).not.toHaveBeenCalled();
    });
  });

  it('logs once via logCompanionFullviewOpened', async () => {
    renderHook(() => useFullviewTelemetry('history', 'inst-1'));

    await waitFor(() => {
      expect(logCompanionFullviewOpenedMock).toHaveBeenCalledTimes(1);
    });

    expect(logCompanionFullviewOpenedMock).toHaveBeenCalledWith({
      userId: 'user-1',
      companion: 'history',
      pauseInstanceId: 'inst-1',
    });
  });

  it('dedupes companion:pauseInstanceId within one mount', async () => {
    const { rerender } = renderHook(
      ({ companion, pauseInstanceId }) => useFullviewTelemetry(companion, pauseInstanceId),
      {
        initialProps: { companion: 'zoomOut' as const, pauseInstanceId: 'inst-1' },
      },
    );

    await waitFor(() => {
      expect(logCompanionFullviewOpenedMock).toHaveBeenCalledTimes(1);
    });

    rerender({ companion: 'zoomOut', pauseInstanceId: 'inst-1' });

    await waitFor(() => {
      expect(logCompanionFullviewOpenedMock).toHaveBeenCalledTimes(1);
    });
  });
});
