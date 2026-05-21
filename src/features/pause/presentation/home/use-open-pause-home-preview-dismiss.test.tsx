import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useOpenPauseHomePreview } from './use-open-pause-home-preview';

const dismissOpenPauseHomeMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: {},
}));

vi.mock('@/features/pause/application/use-cases/dismiss/dismiss-open-pause-home', () => ({
  dismissOpenPauseHome: dismissOpenPauseHomeMock,
}));

vi.mock('@/features/pause/infrastructure/session/persisted-session-storage', () => ({
  clearSession: vi.fn(),
}));

vi.mock('../realtime/use-pause-instances-realtime', () => ({
  usePauseInstancesRealtime: vi.fn(),
}));

vi.mock('../../public-queries', () => ({
  fetchOpenPauseHomePreview: vi.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  dismissOpenPauseHomeMock.mockReset().mockResolvedValue(undefined);
});

describe('useOpenPauseHomePreview dismiss', () => {
  it('dismisses via dismiss use case when user is signed in', async () => {
    const user = { id: 'user-1' } as User;
    const { result } = renderHook(() => useOpenPauseHomePreview(user));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(true, expect.objectContaining({
      clearPreview: expect.any(Function),
      dismissCurrent: expect.any(Function),
    }));
  });

  it('clears preview without RPC when user is null', async () => {
    const { result } = renderHook(() => useOpenPauseHomePreview(null));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(false, expect.objectContaining({
      clearPreview: expect.any(Function),
      dismissCurrent: expect.any(Function),
    }));
  });
});
