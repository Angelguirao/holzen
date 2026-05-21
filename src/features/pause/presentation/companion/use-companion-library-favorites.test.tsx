import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompanionLibraryFavorites } from './use-companion-library-favorites';

const {
  runToggleCompanionLibraryFavoriteMock,
  mockPauseRepository,
  setQueryDataMock,
} = vi.hoisted(() => ({
  runToggleCompanionLibraryFavoriteMock: vi.fn().mockResolvedValue(true),
  mockPauseRepository: { port: 'supabasePauseRepository' },
  setQueryDataMock: vi.fn(),
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite',
  () => ({
    runToggleCompanionLibraryFavorite: runToggleCompanionLibraryFavoriteMock,
  }),
);

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: mockPauseRepository,
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
    setQueryData: setQueryDataMock,
  }),
}));

beforeEach(() => {
  runToggleCompanionLibraryFavoriteMock.mockReset().mockResolvedValue(true);
  setQueryDataMock.mockReset();
});

describe('useCompanionLibraryFavorites', () => {
  it('no-ops toggle when pause instance id is missing', async () => {
    const { result } = renderHook(() => useCompanionLibraryFavorites(null));

    await act(async () => {
      await result.current.toggleCompanionFavorite('article');
    });

    expect(runToggleCompanionLibraryFavoriteMock).not.toHaveBeenCalled();
  });

  it('toggles via runToggleCompanionLibraryFavorite + PauseRepository', async () => {
    const { result } = renderHook(() => useCompanionLibraryFavorites('inst-1'));

    await act(async () => {
      await result.current.toggleCompanionFavorite('article');
    });

    expect(runToggleCompanionLibraryFavoriteMock).toHaveBeenCalledTimes(1);
    expect(runToggleCompanionLibraryFavoriteMock).toHaveBeenCalledWith(
      mockPauseRepository,
      expect.objectContaining({
        pauseInstanceId: 'inst-1',
        sourceType: 'article',
        onBucketComputed: expect.any(Function),
      }),
    );
    expect(mockPauseRepository.port).toBe('supabasePauseRepository');
  });
});
