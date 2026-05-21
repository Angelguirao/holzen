import { describe, expect, it, vi } from 'vitest';
import {
  companionPauseRepository,
  pauseToggleCompanionLibraryFavorite,
} from './pause-companion-orchestration-io';

const { runToggleCompanionLibraryFavoriteMock } = vi.hoisted(() => ({
  runToggleCompanionLibraryFavoriteMock: vi.fn(),
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/frame/run-toggle-companion-library-favorite',
  () => ({
    runToggleCompanionLibraryFavorite: runToggleCompanionLibraryFavoriteMock,
  }),
);

vi.mock('@/features/pause/public-rpc', () => ({
  supabasePauseRepository: { port: 'companionPauseRepository' },
  supabaseCompanionOrchestrator: { port: 'companionOrchestrator' },
}));

describe('pause-companion-orchestration-io', () => {
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
