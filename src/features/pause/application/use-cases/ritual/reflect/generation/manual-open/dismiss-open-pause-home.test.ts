import { describe, expect, it, vi } from 'vitest';
import type { PauseRepository } from '@/features/pause/ports/pause-repository';
import { dismissOpenPauseHome } from './dismiss-open-pause-home';

const { runPauseDismissCurrentMock, mockPauseRepository } = vi.hoisted(() => ({
  runPauseDismissCurrentMock: vi.fn(),
  mockPauseRepository: { port: 'supabasePauseRepository' },
}));

vi.mock(
  '@/features/pause/application/use-cases/session/run-pause-dismiss-current',
  () => ({
    runPauseDismissCurrent: runPauseDismissCurrentMock,
  }),
);

describe('dismissOpenPauseHome', () => {
  const repository = mockPauseRepository as unknown as PauseRepository;

  it('clears preview without RPC when signed out', async () => {
    const clearPreview = vi.fn();
    runPauseDismissCurrentMock.mockReset();
    await dismissOpenPauseHome(false, { clearPreview, repository });
    expect(clearPreview).toHaveBeenCalledOnce();
    expect(runPauseDismissCurrentMock).not.toHaveBeenCalled();
  });

  it('clears preview then dismisses via runPauseDismissCurrent when signed in', async () => {
    const clearPreview = vi.fn();
    runPauseDismissCurrentMock.mockReset().mockResolvedValue('completed');
    await dismissOpenPauseHome(true, { clearPreview, repository });
    expect(clearPreview).toHaveBeenCalledOnce();
    expect(runPauseDismissCurrentMock).toHaveBeenCalledOnce();
    expect(runPauseDismissCurrentMock).toHaveBeenCalledWith(repository);
  });

  it('keeps preview cleared when dismiss use case fails', async () => {
    const clearPreview = vi.fn();
    runPauseDismissCurrentMock.mockReset().mockRejectedValue(new Error('network'));
    await dismissOpenPauseHome(true, { clearPreview, repository });
    expect(clearPreview).toHaveBeenCalledOnce();
    expect(runPauseDismissCurrentMock).toHaveBeenCalledOnce();
  });
});
