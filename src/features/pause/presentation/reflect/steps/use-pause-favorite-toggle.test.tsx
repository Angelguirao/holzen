import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseFavoriteToggle } from './use-pause-favorite-toggle';
import { showPauseFavoriteProHintToast } from './pause-favorite-pro-hint-toast';

const { logPauseFavoriteToggleMock, invalidateQueriesMock } = vi.hoisted(() => ({
  logPauseFavoriteToggleMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
}));

vi.mock('@/features/pause/public-queries', () => ({
  pauseArchiveListQueryPrefix: (userId: string) => ['pause-archive', userId] as const,
}));

vi.mock('./pause-favorite-pro-hint-toast', () => ({
  showPauseFavoriteProHintToast: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: { id: 'archive-user-1' }, loading: false }),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  logPauseFavoriteToggle: (...args: unknown[]) => logPauseFavoriteToggleMock(...args),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

/** Mirrors `pauseArchiveListQueryPrefix` without loading the real module (Supabase client). */
const archiveListPrefix = (userId: string) => ['pause-archive', userId] as const;

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  logPauseFavoriteToggleMock.mockReset();
  logPauseFavoriteToggleMock.mockResolvedValue({ status: 'success', newValue: true });
  invalidateQueriesMock.mockClear();
  vi.mocked(showPauseFavoriteProHintToast).mockClear();
});

describe('usePauseFavoriteToggle', () => {
  it('no-ops when there is no pause instance id', async () => {
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: null,
        isFavorite: false,
        setIsFavorite,
        subscribed: false,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(setIsFavorite).not.toHaveBeenCalled();
    expect(logPauseFavoriteToggleMock).not.toHaveBeenCalled();
  });

  it('optimistic toggle, RPC payload, and Pro hint when favoriting while not subscribed', async () => {
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: 'pi-1',
        isFavorite: false,
        setIsFavorite,
        subscribed: false,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(setIsFavorite).toHaveBeenCalledWith(true);
    expect(logPauseFavoriteToggleMock).toHaveBeenCalledWith({
      pauseInstanceId: 'pi-1',
      isFavorite: false,
    });
    expect(showPauseFavoriteProHintToast).toHaveBeenCalledWith(t);
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: archiveListPrefix('archive-user-1'),
    });
  });

  it('does not show Pro hint when already subscribed', async () => {
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: 'pi-1',
        isFavorite: false,
        setIsFavorite,
        subscribed: true,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(showPauseFavoriteProHintToast).not.toHaveBeenCalled();
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: archiveListPrefix('archive-user-1'),
    });
  });

  it('rolls back optimistic favorite when RPC fails', async () => {
    logPauseFavoriteToggleMock.mockResolvedValueOnce({
      status: 'sync_failed',
      attemptedValue: true,
    });
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: 'pi-1',
        isFavorite: false,
        setIsFavorite,
        subscribed: true,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(setIsFavorite).toHaveBeenNthCalledWith(1, true);
    expect(setIsFavorite).toHaveBeenNthCalledWith(2, false);
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });
});
