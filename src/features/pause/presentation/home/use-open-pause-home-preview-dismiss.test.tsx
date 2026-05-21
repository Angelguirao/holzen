import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useOpenPauseHomePreview } from './use-open-pause-home-preview';

const { dismissOpenPauseHomeMock, clearSessionMock, mockPauseRepository } = vi.hoisted(() => ({
  dismissOpenPauseHomeMock: vi.fn(),
  clearSessionMock: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock('@/features/pause/application/use-cases/home/dismiss-open-pause-home', () => ({
  dismissOpenPauseHome: dismissOpenPauseHomeMock,
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/public-session', () => ({
  clearSession: clearSessionMock,
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
  it('dismisses via dismissOpenPauseHome + PauseRepository when user is signed in', async () => {
    const user = { id: 'user-1' } as User;
    const { result } = renderHook(() => useOpenPauseHomePreview(user));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(true, {
      clearPreview: expect.any(Function),
      repository: mockPauseRepository,
    });
  });

  it('clears preview without RPC when user is null', async () => {
    const { result } = renderHook(() => useOpenPauseHomePreview(null));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissOpenPauseHomeMock).toHaveBeenCalledWith(false, {
      clearPreview: expect.any(Function),
      repository: mockPauseRepository,
    });
  });
});
