import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePauseArtifactReflectionText } from './use-pause-artifact-reflection-text';

const { fetchReflectionTextMock } = vi.hoisted(() => ({
  fetchReflectionTextMock: vi.fn(),
}));

vi.mock('@/features/pause/public-queries', () => ({
  fetchReflectionTextForPauseInstance: fetchReflectionTextMock,
}));

describe('usePauseArtifactReflectionText', () => {
  afterEach(() => {
    fetchReflectionTextMock.mockReset();
  });

  it('fetches immediately when pauseInstanceId is set', async () => {
    fetchReflectionTextMock.mockResolvedValue('persisted copy');

    const { result } = renderHook(() =>
      usePauseArtifactReflectionText({
        pauseInstanceId: 'pause-1',
        trigger: 'immediate',
      }),
    );

    await waitFor(() => {
      expect(result.current.artifactReflectionText).toBe('persisted copy');
    });
    expect(fetchReflectionTextMock).toHaveBeenCalledWith('pause-1');
  });

  it('defers fetch until whenEnabled is true', async () => {
    fetchReflectionTextMock.mockResolvedValue('late read');

    const { result, rerender } = renderHook(
      ({ fetchEnabled }: { fetchEnabled: boolean }) =>
        usePauseArtifactReflectionText({
          pauseInstanceId: 'pause-2',
          trigger: 'whenEnabled',
          fetchEnabled,
        }),
      { initialProps: { fetchEnabled: false } },
    );

    expect(fetchReflectionTextMock).not.toHaveBeenCalled();

    rerender({ fetchEnabled: true });

    await waitFor(() => {
      expect(result.current.artifactReflectionText).toBe('late read');
      expect(result.current.reflectionTextFetch).toBe('done');
    });
  });
});
