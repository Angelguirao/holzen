import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { useOpenPauseHomePreview } from './use-open-pause-home-preview';

const { dismissCurrentMock, mockRepository } = vi.hoisted(() => {
  const dismissCurrentMock = vi.fn();
  return {
    dismissCurrentMock,
    mockRepository: { dismissCurrent: dismissCurrentMock } as unknown as PauseRepository,
  };
});

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
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
  dismissCurrentMock.mockReset().mockResolvedValue(null);
});

describe('useOpenPauseHomePreview dismiss', () => {
  it('dismisses via PauseRepository when user is signed in', async () => {
    const user = { id: 'user-1' } as User;
    const { result } = renderHook(() => useOpenPauseHomePreview(user));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissCurrentMock).toHaveBeenCalledTimes(1);
  });

  it('clears preview without RPC when user is null', async () => {
    const { result } = renderHook(() => useOpenPauseHomePreview(null));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(dismissCurrentMock).not.toHaveBeenCalled();
  });
});
