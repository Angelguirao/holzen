import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PauseImpactData } from '@/features/pause/domain/decide/pause-impact-data';
import { usePauseDonePracticeXp } from './use-pause-done-practice-xp';

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/pause/infrastructure/queries/pause-instance-practice-xp-query', () => ({
  pauseInstancePracticeXpQueryKey: (id: string | null | undefined) =>
    ['pause-instance-practice-xp', id] as const,
  fetchPauseInstancePracticeXpAwarded: fetchMock,
}));

const briefPauseData: PauseImpactData = {
  mood: 'calm',
  moodAfter: null,
  breathingCompleted: true,
  decision: 'held',
  context: null,
  engagedTools: 0,
  wroteNote: false,
  usedTags: false,
  ritualDepth: 'brief',
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('usePauseDonePracticeXp', () => {
  it('returns client estimate when server award is unavailable', async () => {
    fetchMock.mockResolvedValue(null);

    const { result } = renderHook(
      () => usePauseDonePracticeXp('inst-1', briefPauseData),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.presenceXp).toBe(10);
    });
    expect(result.current.isServerAwarded).toBe(false);
  });

  it('prefers server practice_xp_awarded when present', async () => {
    fetchMock.mockResolvedValue(17);

    const { result } = renderHook(
      () => usePauseDonePracticeXp('inst-1', briefPauseData),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.presenceXp).toBe(17);
    });
    expect(result.current.isServerAwarded).toBe(true);
  });

  it('keeps optimistic post-check-in XP until server catches up', async () => {
    fetchMock.mockResolvedValue(10);

    const { result } = renderHook(
      () => usePauseDonePracticeXp('inst-1', briefPauseData, 5),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.presenceXp).toBe(15);
    });
  });

  it('does not query when pauseInstanceId is missing', () => {
    renderHook(() => usePauseDonePracticeXp(null, briefPauseData), { wrapper: createWrapper() });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
