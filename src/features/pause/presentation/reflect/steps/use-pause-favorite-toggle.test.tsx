import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { usePauseFavoriteToggle } from './use-pause-favorite-toggle';

const {
  pauseReflectFavoriteToggleMock,
  showPauseFavoriteProHintToastMock,
  invalidateQueriesMock,
} = vi.hoisted(() => ({
  pauseReflectFavoriteToggleMock: vi.fn(),
  showPauseFavoriteProHintToastMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'reflectStepsRepository' },
}));

vi.mock('./pause-reflect-steps-io', async () => {
  const actual = await vi.importActual<typeof import('./pause-reflect-steps-io')>(
    './pause-reflect-steps-io',
  );
  return {
    ...actual,
    pauseReflectFavoriteToggle: pauseReflectFavoriteToggleMock,
    showPauseFavoriteProHintToast: showPauseFavoriteProHintToastMock,
  };
});

vi.mock('@/features/pause/public-queries', () => ({
  pauseArchiveListQueryPrefix: (userId: string) => ['pause-archive', userId] as const,
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: invalidateQueriesMock }),
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: { id: 'archive-user-1' }, loading: false }),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

/** Mirrors `pauseArchiveListQueryPrefix` without loading the real module (Supabase client). */
const archiveListPrefix = (userId: string) => ['pause-archive', userId] as const;

const t = ((k: string) => k) as TFunction;

beforeEach(() => {
  pauseReflectFavoriteToggleMock.mockReset();
  pauseReflectFavoriteToggleMock.mockResolvedValue({ status: 'success', newValue: true });
  invalidateQueriesMock.mockClear();
  showPauseFavoriteProHintToastMock.mockClear();
});

describe('usePauseFavoriteToggle', () => {
  it('no-ops when there is no pause instance id', async () => {
    const addOptimisticFavorite = vi.fn();
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: null,
        isFavoriteCommitted: false,
        addOptimisticFavorite,
        setIsFavorite,
        subscribed: false,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(addOptimisticFavorite).not.toHaveBeenCalled();
    expect(setIsFavorite).not.toHaveBeenCalled();
    expect(pauseReflectFavoriteToggleMock).not.toHaveBeenCalled();
  });

  it('optimistic toggle, RPC payload, and Pro hint when favoriting while not subscribed', async () => {
    const addOptimisticFavorite = vi.fn();
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: 'pi-1',
        isFavoriteCommitted: false,
        addOptimisticFavorite,
        setIsFavorite,
        subscribed: false,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(addOptimisticFavorite).toHaveBeenCalledWith(true);
    expect(pauseReflectFavoriteToggleMock).toHaveBeenCalledWith({
      pauseInstanceId: 'pi-1',
      isFavorite: false,
    });
    expect(setIsFavorite).toHaveBeenCalledWith(true);
    expect(showPauseFavoriteProHintToastMock).toHaveBeenCalledWith(t);
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: archiveListPrefix('archive-user-1'),
    });
  });

  it('does not show Pro hint when already subscribed', async () => {
    const addOptimisticFavorite = vi.fn();
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: 'pi-1',
        isFavoriteCommitted: false,
        addOptimisticFavorite,
        setIsFavorite,
        subscribed: true,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(showPauseFavoriteProHintToastMock).not.toHaveBeenCalled();
    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: archiveListPrefix('archive-user-1'),
    });
  });

  it('rolls back committed favorite when RPC fails', async () => {
    pauseReflectFavoriteToggleMock.mockResolvedValueOnce({
      status: 'sync_failed',
      attemptedValue: true,
    });
    const addOptimisticFavorite = vi.fn();
    const setIsFavorite = vi.fn();
    const { result } = renderHook(() =>
      usePauseFavoriteToggle({
        pauseInstanceId: 'pi-1',
        isFavoriteCommitted: false,
        addOptimisticFavorite,
        setIsFavorite,
        subscribed: true,
        t,
      }),
    );
    await act(async () => {
      await result.current.toggleFavorite();
    });
    expect(addOptimisticFavorite).toHaveBeenCalledWith(true);
    expect(setIsFavorite).toHaveBeenCalledWith(false);
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });
});
