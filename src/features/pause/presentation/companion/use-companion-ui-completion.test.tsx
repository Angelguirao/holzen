import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompanionUiCompletion } from './use-companion-ui-completion';

const {
  persistCompanionUiStepCompletionMock,
  invalidateCompanionUiCompletionQueryMock,
  mockPauseRepository,
  setQueryDataMock,
  getQueryDataMock,
  emptyCompletion,
} = vi.hoisted(() => ({
  persistCompanionUiStepCompletionMock: vi.fn(),
  invalidateCompanionUiCompletionQueryMock: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
  setQueryDataMock: vi.fn(),
  getQueryDataMock: vi.fn(),
  emptyCompletion: {
    breathing: false,
    haiku: false,
    grounding: false,
    signal: false,
    zoomOut: false,
    history: false,
  },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/persist-ui-step-completion',
  () => ({
    persistCompanionUiStepCompletion: persistCompanionUiStepCompletionMock,
  }),
);

vi.mock('./pause-companion-orchestration-io', () => ({
  companionPauseRepository: mockPauseRepository,
}));

vi.mock('@/features/pause/application/queries/companion-ui-completion-query-key', () => ({
  invalidateCompanionUiCompletionQuery: invalidateCompanionUiCompletionQueryMock,
}));

vi.mock('@/features/pause/public-queries', () => ({
  companionUiCompletionQueryKey: (id: string) => ['pause', 'companion-ui-completion', id] as const,
  getCompanionUiCompletionQueryOptions: () => ({
    queryKey: ['pause', 'companion-ui-completion', 'none'],
    queryFn: async () => emptyCompletion,
  }),
  EMPTY_COMPANION_UI_COMPLETION: emptyCompletion,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: emptyCompletion }),
  useQueryClient: () => ({
    setQueryData: setQueryDataMock,
    getQueryData: getQueryDataMock,
  }),
}));

vi.mock('@/lib/haptics', () => ({
  hapticFeedback: vi.fn(),
}));

beforeEach(() => {
  persistCompanionUiStepCompletionMock.mockReset().mockResolvedValue(undefined);
  invalidateCompanionUiCompletionQueryMock.mockReset();
  setQueryDataMock.mockReset();
  getQueryDataMock.mockReset().mockReturnValue(emptyCompletion);
});

describe('useCompanionUiCompletion', () => {
  it('no-ops markCompleted when pause instance id is missing', async () => {
    const { result } = renderHook(() => useCompanionUiCompletion(null));

    await act(async () => {
      await result.current.markCompleted('haiku');
    });

    expect(persistCompanionUiStepCompletionMock).not.toHaveBeenCalled();
  });

  it('persists via persistCompanionUiStepCompletion + PauseRepository', async () => {
    const { result } = renderHook(() => useCompanionUiCompletion('inst-1'));

    await act(async () => {
      await result.current.markCompleted('haiku');
    });

    expect(persistCompanionUiStepCompletionMock).toHaveBeenCalledTimes(1);
    expect(persistCompanionUiStepCompletionMock).toHaveBeenCalledWith(
      mockPauseRepository,
      'inst-1',
      'haiku',
    );
    expect(mockPauseRepository.port).toBe('supabasePauseRepository');
    expect(invalidateCompanionUiCompletionQueryMock).toHaveBeenCalledWith('inst-1');
  });

  it('skips persist when chip is already completed in cache', async () => {
    getQueryDataMock.mockReturnValue({
      ...emptyCompletion,
      haiku: true,
    });

    const { result } = renderHook(() => useCompanionUiCompletion('inst-1'));

    await act(async () => {
      await result.current.markCompleted('haiku');
    });

    expect(persistCompanionUiStepCompletionMock).not.toHaveBeenCalled();
  });
});
