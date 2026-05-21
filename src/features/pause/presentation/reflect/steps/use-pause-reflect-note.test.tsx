import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePauseReflectNote } from './use-pause-reflect-note';

const { pauseReflectNoteUpdateMock } = vi.hoisted(() => ({
  pauseReflectNoteUpdateMock: vi.fn(),
}));

vi.mock('./pause-reflect-steps-io', () => ({
  pauseReflectNoteUpdate: pauseReflectNoteUpdateMock,
}));

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
  pauseReflectNoteUpdateMock.mockReset().mockResolvedValue({ status: 'success' });
});

describe('usePauseReflectNote', () => {
  it('commits note blur via pauseReflectNoteUpdate I/O', async () => {
    const { result } = renderHook(() => usePauseReflectNote('pause-1'));

    act(() => {
      result.current.setNote('steady breath');
    });

    await act(async () => {
      await result.current.commitOnBlur();
    });

    await waitFor(() => {
      expect(pauseReflectNoteUpdateMock).toHaveBeenCalledWith({
        pauseInstanceId: 'pause-1',
        text: 'steady breath',
      });
    });
  });
});
