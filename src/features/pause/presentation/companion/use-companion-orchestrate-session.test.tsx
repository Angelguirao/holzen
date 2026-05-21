import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCompanionOrchestrateSession } from './use-companion-orchestrate-session';

const { loadCompanionOrchestrateSessionMock, loadMoodHistoryForOrchestrateMock, sessionFixture } =
  vi.hoisted(() => ({
    loadCompanionOrchestrateSessionMock: vi.fn(),
    loadMoodHistoryForOrchestrateMock: vi.fn().mockResolvedValue([]),
    sessionFixture: { pauseInstanceId: 'pause-1', language: 'en' },
  }));

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session',
  () => ({
    loadCompanionOrchestrateSession: loadCompanionOrchestrateSessionMock,
  }),
);

vi.mock('@/features/pause/public-queries', () => ({
  loadMoodHistoryForOrchestrate: loadMoodHistoryForOrchestrateMock,
}));

beforeEach(() => {
  loadCompanionOrchestrateSessionMock.mockReset().mockResolvedValue(sessionFixture);
  loadMoodHistoryForOrchestrateMock.mockReset().mockResolvedValue([]);
});

describe('useCompanionOrchestrateSession', () => {
  it('loads session via loadCompanionOrchestrateSession + mood-history port', async () => {
    const { result } = renderHook(() =>
      useCompanionOrchestrateSession({
        pauseInstanceId: 'pause-1',
        context: 'btc',
        reflectionMessage: 'reflect',
        mood: 'calm',
        severityNumber: 42,
        language: 'en',
      }),
    );

    let loaded: unknown;
    await act(async () => {
      loaded = await result.current();
    });

    expect(loadCompanionOrchestrateSessionMock).toHaveBeenCalledOnce();
    expect(loadCompanionOrchestrateSessionMock).toHaveBeenCalledWith(
      {
        pauseInstanceId: 'pause-1',
        context: 'btc',
        language: 'en',
        reflectionMessage: 'reflect',
        mood: 'calm',
        severityNumber: 42,
      },
      { loadMoodHistory: loadMoodHistoryForOrchestrateMock },
    );
    expect(loaded).toEqual(sessionFixture);
  });

  it('memoizes callback until ritual inputs change', async () => {
    const { result, rerender } = renderHook(
      (props: { language: string }) =>
        useCompanionOrchestrateSession({
          pauseInstanceId: 'pause-1',
          language: props.language,
        }),
      { initialProps: { language: 'en' } },
    );

    const first = result.current;
    rerender({ language: 'en' });
    expect(result.current).toBe(first);

    rerender({ language: 'es' });
    expect(result.current).not.toBe(first);
  });
});
