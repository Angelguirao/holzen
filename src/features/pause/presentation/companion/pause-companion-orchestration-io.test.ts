import { describe, expect, it, vi } from 'vitest';

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
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session')
    >();
    return {
      ...actual,
      loadCompanionOrchestrateSession: loadCompanionOrchestrateSessionMock,
    };
  },
);

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite',
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import('@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite')
    >();
    return {
      ...actual,
      runToggleCompanionLibraryFavorite: runToggleCompanionLibraryFavoriteMock,
    };
  },
);

vi.mock('@/features/pause/public-queries', () => ({
  loadMoodHistoryForOrchestrate: loadMoodHistoryForOrchestrateMock,
  invalidateCompanionUiCompletionQuery: vi.fn(),
}));

vi.mock('./pause-companion-analytics-io', () => ({
  logCompanionFeedbackVote: vi.fn(),
  logCompanionFullviewOpened: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'companionPauseRepository' },
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
}));

import { loadCompanionOrchestrateSession as loadSessionDirect } from '@/features/pause/application/use-cases/ritual/frame/load-companion-orchestrate-session';
import { runToggleCompanionLibraryFavorite as toggleFavoriteDirect } from '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite';
import {
  COMPANION_FULL_VIEW_BREATHING_ROOM_MS,
  getCompanionSectionVisibility,
  isCompanionSectionVisible,
} from './pause-companion-frame-ui-io';
import {
  companionPauseRepository,
  invalidateCompanionUiCompletionQuery,
  loadCompanionOrchestrateSession,
  nextExpandedWithLazyFetch,
  pauseLoadCompanionOrchestrateSession,
  pauseToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-io';
import {
  logCompanionFeedbackVote,
  logCompanionFullviewOpened,
} from './pause-companion-analytics-io';

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

  it('re-exports nextExpandedWithLazyFetch from leaf expansion helper', () => {
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

  it('exports orchestration port-bound wrappers distinct from ritual/frame leaf use cases', () => {
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(loadSessionDirect);
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(loadCompanionOrchestrateSession);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(toggleFavoriteDirect);
    expect(nextExpandedWithLazyFetch).toBeDefined();
  });

  it('sibling cluster: frame-ui-io exports stay distinct from orchestration-io', () => {
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(getCompanionSectionVisibility);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(isCompanionSectionVisible);
    expect(nextExpandedWithLazyFetch).not.toBe(COMPANION_FULL_VIEW_BREATHING_ROOM_MS);
    // Reciprocal inline pins: `pause-companion-frame-ui-io.test.ts`;
    // dedicated sibling: `pause-companion-frame-ui-orchestration-io-sibling-parity.test.ts`.
  });

  it('sibling cluster: analytics-io exports stay distinct from orchestration-io', () => {
    expect(pauseLoadCompanionOrchestrateSession).not.toBe(logCompanionFeedbackVote);
    expect(pauseToggleCompanionLibraryFavorite).not.toBe(logCompanionFullviewOpened);
    expect(nextExpandedWithLazyFetch).not.toBe(logCompanionFeedbackVote);
    expect(invalidateCompanionUiCompletionQuery).not.toBe(logCompanionFullviewOpened);
    // Reciprocal inline pins: `pause-companion-analytics-io.test.ts`;
    // dedicated sibling: `pause-companion-analytics-orchestration-io-sibling-parity.test.ts`.
  });
});
