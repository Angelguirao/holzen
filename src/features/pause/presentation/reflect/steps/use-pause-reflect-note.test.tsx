import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePauseReflectNote } from './use-pause-reflect-note';

const { runPauseReflectNoteUpdateMock } = vi.hoisted(() => ({
  runPauseReflectNoteUpdateMock: vi.fn(),
}));

vi.mock('@/features/pause/infrastructure/supabase-pause-repository', () => ({
  supabasePauseRepository: {},
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/steps/run-pause-reflect-note-update',
  () => ({
    runPauseReflectNoteUpdate: runPauseReflectNoteUpdateMock,
  }),
);

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: '' }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@/features/pause/public-queries', () => ({
  getLatestPauseReflectNoteQueryOptions: () => ({ queryKey: ['reflect-note'] }),
  PAUSE_REFLECT_STEP_NOTE: 'note_updated',
  pauseArchiveListQueryPrefix: (userId: string) => ['pause-archive', userId] as const,
  pauseReflectStepLatestQueryKey: (id: string, step: string) => ['reflect-step', id, step] as const,
}));

beforeEach(() => {
  runPauseReflectNoteUpdateMock.mockReset().mockResolvedValue({ status: 'success' });
});

describe('usePauseReflectNote', () => {
  it('commits note blur via runPauseReflectNoteUpdate + PauseRepository', async () => {
    const { result } = renderHook(() => usePauseReflectNote('pause-1'));

    act(() => {
      result.current.setNote('steady breath');
    });

    await act(async () => {
      await result.current.commitOnBlur();
    });

    await waitFor(() => {
      expect(runPauseReflectNoteUpdateMock).toHaveBeenCalledWith(
        {},
        {
          pauseInstanceId: 'pause-1',
          text: 'steady breath',
        },
      );
    });
  });
});
