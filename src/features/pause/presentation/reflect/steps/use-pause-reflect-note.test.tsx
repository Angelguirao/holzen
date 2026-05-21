import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { usePauseReflectNote } from './use-pause-reflect-note';

const { logStepMock, mockRepository } = vi.hoisted(() => {
  const logStepMock = vi.fn();
  return {
    logStepMock,
    mockRepository: { logStep: logStepMock } as unknown as PauseRepository,
  };
});

vi.mock('@/features/pause/public-ports', () => ({
  supabasePauseRepository: mockRepository,
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
  logStepMock.mockReset().mockResolvedValue(null);
});

describe('usePauseReflectNote', () => {
  it('commits note blur via PauseRepository logStep', async () => {
    const { result } = renderHook(() => usePauseReflectNote('pause-1'));

    act(() => {
      result.current.setNote('steady breath');
    });

    await act(async () => {
      await result.current.commitOnBlur();
    });

    await waitFor(() => {
      expect(logStepMock).toHaveBeenCalledWith({
        instanceId: 'pause-1',
        stepType: 'note_updated',
        payload: { text: 'steady breath' },
      });
    });
  });
});
