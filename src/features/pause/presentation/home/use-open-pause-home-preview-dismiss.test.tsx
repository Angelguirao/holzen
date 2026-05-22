import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { User } from '@supabase/supabase-js';
import { useOpenPauseHomePreview } from './use-open-pause-home-preview';

const { pauseDismissOpenPauseHomePreviewMock, clearSessionMock } = vi.hoisted(() => ({
  pauseDismissOpenPauseHomePreviewMock: vi.fn(),
  clearSessionMock: vi.fn(),
}));

vi.mock('@/features/pause/presentation/reflect/generation/manual-open/pause-home-reflect-io', () => ({
  pauseDismissOpenPauseHomePreview: pauseDismissOpenPauseHomePreviewMock,
}));

vi.mock('@/features/pause/presentation/session/pause-persisted-tab-session-io', () => ({
  clearPausePersistedTabSession: () => clearSessionMock(),
  loadPausePersistedTabSession: () => null,
  savePausePersistedTabSession: vi.fn(),
}));

vi.mock('../realtime/use-pause-instances-realtime', () => ({
  usePauseInstancesRealtime: vi.fn(),
}));

vi.mock('../../public-queries', () => ({
  fetchOpenPauseHomePreview: vi.fn().mockResolvedValue(null),
}));

beforeEach(() => {
  pauseDismissOpenPauseHomePreviewMock.mockReset().mockResolvedValue(undefined);
});

describe('useOpenPauseHomePreview dismiss', () => {
  it('dismisses via dismissOpenPauseHome + PauseRepository when user is signed in', async () => {
    const user = { id: 'user-1' } as User;
    const { result } = renderHook(() => useOpenPauseHomePreview(user));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(pauseDismissOpenPauseHomePreviewMock).toHaveBeenCalledWith({
      hasUser: true,
      clearPreview: expect.any(Function),
    });
  });

  it('clears preview without RPC when user is null', async () => {
    const { result } = renderHook(() => useOpenPauseHomePreview(null));

    await act(async () => {
      await result.current.dismissOpenPauseHome();
    });

    expect(pauseDismissOpenPauseHomePreviewMock).toHaveBeenCalledWith({
      hasUser: false,
      clearPreview: expect.any(Function),
    });
  });
});
