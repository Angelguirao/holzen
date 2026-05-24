import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompanionUiCompletion } from './use-companion-ui-completion';

const {
  pauseCompanionUiStepCompletionMock,
  invalidateCompanionUiCompletionQueryMock,
  setQueryDataMock,
  getQueryDataMock,
  emptyCompletion,
} = vi.hoisted(() => ({
  pauseCompanionUiStepCompletionMock: vi.fn(),
  invalidateCompanionUiCompletionQueryMock: vi.fn(),
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

vi.mock('./pause-companion-orchestration-io', () => ({
  pauseCompanionUiStepCompletion: pauseCompanionUiStepCompletionMock,
}));

vi.mock('@/features/pause/public-queries', () => ({
  companionUiCompletionQueryKey: (id: string) => ['pause', 'companion-ui-completion', id] as const,
  getCompanionUiCompletionQueryOptions: () => ({
    queryKey: ['pause', 'companion-ui-completion', 'none'],
    queryFn: async () => emptyCompletion,
  }),
  EMPTY_COMPANION_UI_COMPLETION: emptyCompletion,
  invalidateCompanionUiCompletionQuery: invalidateCompanionUiCompletionQueryMock,
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
  pauseCompanionUiStepCompletionMock.mockReset().mockResolvedValue(undefined);
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

    expect(pauseCompanionUiStepCompletionMock).not.toHaveBeenCalled();
  });

  it('persists via pauseCompanionUiStepCompletion (orchestration I/O)', async () => {
    const { result } = renderHook(() => useCompanionUiCompletion('inst-1'));

    await act(async () => {
      await result.current.markCompleted('haiku');
    });

    expect(pauseCompanionUiStepCompletionMock).toHaveBeenCalledTimes(1);
    expect(pauseCompanionUiStepCompletionMock).toHaveBeenCalledWith('inst-1', 'haiku');
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

    expect(pauseCompanionUiStepCompletionMock).not.toHaveBeenCalled();
  });
});
