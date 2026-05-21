import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseReflectTags } from './use-pause-reflect-tags';

const { runPauseReflectTagUpdateMock, emptyTags } = vi.hoisted(() => ({
  runPauseReflectTagUpdateMock: vi.fn(),
  emptyTags: [] as string[],
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-tag-update',
  () => ({
    runPauseReflectTagUpdate: runPauseReflectTagUpdateMock,
  }),
);

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: {},
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: emptyTags }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/features/pause/public-queries', () => ({
  getLatestPauseReflectTagsQueryOptions: () => ({ queryKey: ['reflect-tags'] }),
  PAUSE_REFLECT_STEP_TAGS: 'tag_updated',
  pauseArchiveListQueryPrefix: (userId: string) => ['pause-archive', userId] as const,
  pauseReflectStepLatestQueryKey: (id: string, step: string) => ['reflect-step', id, step] as const,
}));

beforeEach(() => {
  runPauseReflectTagUpdateMock.mockReset().mockResolvedValue({ status: 'success' });
});

describe('usePauseReflectTags', () => {
  it('commits new tag via runPauseReflectTagUpdate + PauseRepository', async () => {
    const { result } = renderHook(() => usePauseReflectTags('pause-1'));

    act(() => {
      result.current.setDraft('calm');
    });

    await act(async () => {
      result.current.addDraft();
    });

    expect(runPauseReflectTagUpdateMock).toHaveBeenCalledWith(
      {},
      {
        pauseInstanceId: 'pause-1',
        tags: ['calm'],
      },
    );
  });
});
