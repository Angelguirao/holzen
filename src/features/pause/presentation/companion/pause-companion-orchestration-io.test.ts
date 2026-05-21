import { describe, expect, it, vi } from 'vitest';
import {
  companionPauseRepository,
  nextExpandedWithLazyFetch,
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-io';

const {
  loadCompanionOrchestrateSessionMock,
  loadMoodHistoryForOrchestrateMock,
  runToggleCompanionLibraryFavoriteMock,
} = vi.hoisted(() => ({
  loadCompanionOrchestrateSessionMock: vi.fn(),
  loadMoodHistoryForOrchestrateMock: vi.fn().mockResolvedValue([]),
  runToggleCompanionLibraryFavoriteMock: vi.fn(),
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session',
  () => ({
    loadCompanionOrchestrateSession: loadCompanionOrchestrateSessionMock,
  }),
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite',
  () => ({
    runToggleCompanionLibraryFavorite: runToggleCompanionLibraryFavoriteMock,
  }),
);

vi.mock('@/features/pause/public-queries', () => ({
  loadMoodHistoryForOrchestrate: loadMoodHistoryForOrchestrateMock,
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'companionPauseRepository' },
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
}));

describe('pause-companion-orchestration-io', () => {
  it('routes orchestrate session load through default mood-history query', async () => {
    loadCompanionOrchestrateSessionMock.mockResolvedValue({ pauseInstanceId: 'pi-1' });

    await pauseLoadCompanionOrchestrateSession({
      pauseInstanceId: 'pi-1',
      language: 'en',
    });

    expect(loadCompanionOrchestrateSessionMock).toHaveBeenCalledWith(
      { pauseInstanceId: 'pi-1', language: 'en' },
      { loadMoodHistory: loadMoodHistoryForOrchestrateMock },
    );
  });

  it('re-exports nextExpandedWithLazyFetch from ritual/frame use case', () => {
    const fetch = vi.fn();
    expect(
      nextExpandedWithLazyFetch(false, {
        data: null,
        loading: false,
        error: null,
        canAccess: () => true,
        fetch,
        slot: 'signal',
      }),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledWith('signal');
  });

  it('routes library favorite toggle through the default PauseRepository port', async () => {
    runToggleCompanionLibraryFavoriteMock.mockResolvedValue(true);
    const onBucketComputed = vi.fn();

    await pauseToggleCompanionLibraryFavorite({
      pauseInstanceId: 'pi-1',
      sourceType: 'article',
      onBucketComputed,
    });

    expect(runToggleCompanionLibraryFavoriteMock).toHaveBeenCalledWith(
      companionPauseRepository,
      {
        pauseInstanceId: 'pi-1',
        sourceType: 'article',
        onBucketComputed,
      },
    );
    expect(companionPauseRepository).toEqual({ port: 'companionPauseRepository' });
  });
});
