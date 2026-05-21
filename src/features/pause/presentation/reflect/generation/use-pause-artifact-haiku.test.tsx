import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePauseArtifactHaiku } from './use-pause-artifact-haiku';

const { fetchHaikuTextMock, mockReflectGenerator } = vi.hoisted(() => ({
  fetchHaikuTextMock: vi.fn(),
  mockReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock('@/features/pause/infrastructure/supabase-reflect-generator', () => ({
  supabaseReflectGenerator: {
    ...mockReflectGenerator,
    fetchHaikuText: fetchHaikuTextMock,
  },
}));

describe('usePauseArtifactHaiku', () => {
  afterEach(() => {
    fetchHaikuTextMock.mockReset();
  });

  it('fetches immediately when pauseInstanceId and haiku are enabled', async () => {
    fetchHaikuTextMock.mockResolvedValue('five seven five');

    const { result } = renderHook(() =>
      usePauseArtifactHaiku({
        pauseInstanceId: 'pause-1',
        companionHaikuEnabled: true,
        trigger: 'immediate',
      }),
    );

    await waitFor(() => {
      expect(result.current.artifactHaiku).toBe('five seven five');
    });
    expect(fetchHaikuTextMock).toHaveBeenCalledWith('pause-1');
  });

  it('does not fetch when companion haiku is disabled', () => {
    renderHook(() =>
      usePauseArtifactHaiku({
        pauseInstanceId: 'pause-1',
        companionHaikuEnabled: false,
        trigger: 'immediate',
      }),
    );

    expect(fetchHaikuTextMock).not.toHaveBeenCalled();
  });

  it('defers fetch until whenEnabled is true', async () => {
    fetchHaikuTextMock.mockResolvedValue('frame haiku');

    const { result, rerender } = renderHook(
      ({ fetchEnabled }: { fetchEnabled: boolean }) =>
        usePauseArtifactHaiku({
          pauseInstanceId: 'pause-2',
          companionHaikuEnabled: true,
          trigger: 'whenEnabled',
          fetchEnabled,
        }),
      { initialProps: { fetchEnabled: false } },
    );

    expect(fetchHaikuTextMock).not.toHaveBeenCalled();

    rerender({ fetchEnabled: true });

    await waitFor(() => {
      expect(result.current.artifactHaiku).toBe('frame haiku');
      expect(result.current.haikuFetch).toBe('done');
    });
  });

  it('routes artifact reads through the default ReflectGenerator port adapter', async () => {
    fetchHaikuTextMock.mockResolvedValue('port haiku');

    renderHook(() =>
      usePauseArtifactHaiku({
        pauseInstanceId: 'pause-3',
        companionHaikuEnabled: true,
        trigger: 'immediate',
      }),
    );

    await waitFor(() => {
      expect(fetchHaikuTextMock).toHaveBeenCalledWith('pause-3');
    });
  });
});
