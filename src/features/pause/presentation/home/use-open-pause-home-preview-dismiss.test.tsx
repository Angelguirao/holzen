import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useOpenPauseHomePreview } from './use-open-pause-home-preview';

const { dismissOpenPauseHomePreviewMock, clearSessionMock } = vi.hoisted(() => ({
  dismissOpenPauseHomePreviewMock: vi.fn(),
  clearSessionMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  dismissOpenPauseHomePreview: dismissOpenPauseHomePreviewMock,
}));

vi.mock('@/features/pause/infrastructure/session/persisted-session-storage', () => ({
  clearSession: clearSessionMock,
}));

vi.mock('../realtime/use-pause-instances-realtime', () => ({
  usePauseInstancesRealtime: vi.fn(),
}));

vi.mock('../../public-queries', () => ({
  fetchOpenPauseHomePreview: vi.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  dismissOpenPauseHomePreviewMock.mockReset().mockResolvedValue(undefined);
});

describe('useOpenPauseHomePreview dismiss', () => {
  it('dismisses via public-rpc facade when user is signed in', async () => {
    const user = { id: 'user-1' } as User;
    const { result } = renderHook(() => useOpenPauseHomePreview(user));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissOpenPauseHomePreviewMock).toHaveBeenCalledWith(
      true,
      expect.any(Function),
    );
  });

  it('clears preview without RPC when user is null', async () => {
    const { result } = renderHook(() => useOpenPauseHomePreview(null));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissOpenPauseHomePreviewMock).toHaveBeenCalledWith(
      false,
      expect.any(Function),
    );
  });
});
