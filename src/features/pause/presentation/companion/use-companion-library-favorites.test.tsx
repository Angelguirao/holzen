import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompanionLibraryFavorites } from './use-companion-library-favorites';

const { pauseToggleCompanionLibraryFavoriteMock, setQueryDataMock } = vi.hoisted(() => ({
  pauseToggleCompanionLibraryFavoriteMock: vi.fn().mockResolvedValue(true),
  setQueryDataMock: vi.fn(),
}));

vi.mock('./pause-companion-orchestration-io', () => ({
  pauseToggleCompanionLibraryFavorite: pauseToggleCompanionLibraryFavoriteMock,
}));

vi.mock('@/features/pause/public-queries', () => ({
  companionLibraryFavoritesQueryKey: (id: string) => ['pause', 'companion-library-favorites', id] as const,
  getCompanionLibraryFavoritesQueryOptions: () => ({
    queryKey: ['pause', 'companion-library-favorites', 'none'],
    queryFn: async () => ({}),
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { article: true } }),
  useQueryClient: () => ({
    getQueryData: () => ({ article: true }),
    setQueryData: setQueryDataMock,
  }),
}));

beforeEach(() => {
  pauseToggleCompanionLibraryFavoriteMock.mockReset().mockResolvedValue(true);
  setQueryDataMock.mockReset();
});

describe('useCompanionLibraryFavorites', () => {
  it('no-ops toggle when pause instance id is missing', async () => {
    const { result } = renderHook(() => useCompanionLibraryFavorites(null));

    await act(async () => {
      await result.current.toggleCompanionFavorite('article');
    });

    expect(pauseToggleCompanionLibraryFavoriteMock).not.toHaveBeenCalled();
  });

  it('toggles via pauseToggleCompanionLibraryFavorite presentation I/O', async () => {
    const { result } = renderHook(() => useCompanionLibraryFavorites('inst-1'));

    await act(async () => {
      await result.current.toggleCompanionFavorite('article');
    });

    expect(pauseToggleCompanionLibraryFavoriteMock).toHaveBeenCalledTimes(1);
    expect(pauseToggleCompanionLibraryFavoriteMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pauseInstanceId: 'inst-1',
        sourceType: 'article',
        nextBucket: { article: false },
        onBucketComputed: expect.any(Function),
      }),
    );
  });
});
