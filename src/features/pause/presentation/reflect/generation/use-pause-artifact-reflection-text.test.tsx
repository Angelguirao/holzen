import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePauseArtifactReflectionText } from './use-pause-artifact-reflection-text';

const { fetchPauseReflectReflectionTextMock } = vi.hoisted(() => ({
  fetchPauseReflectReflectionTextMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  fetchPauseReflectReflectionText: fetchPauseReflectReflectionTextMock,
}));

describe('usePauseArtifactReflectionText', () => {
  afterEach(() => {
    fetchPauseReflectReflectionTextMock.mockReset();
  });

  it('fetches immediately when pauseInstanceId is set', async () => {
    fetchPauseReflectReflectionTextMock.mockResolvedValue('persisted copy');

    const { result } = renderHook(() =>
      usePauseArtifactReflectionText({
        pauseInstanceId: 'pause-1',
        trigger: 'immediate',
      }),
    );

    await waitFor(() => {
      expect(result.current.artifactReflectionText).toBe('persisted copy');
    });
    expect(fetchPauseReflectReflectionTextMock).toHaveBeenCalledWith('pause-1');
  });

  it('defers fetch until whenEnabled is true', async () => {
    fetchPauseReflectReflectionTextMock.mockResolvedValue('late read');

    const { result, rerender } = renderHook(
      ({ fetchEnabled }: { fetchEnabled: boolean }) =>
        usePauseArtifactReflectionText({
          pauseInstanceId: 'pause-2',
          trigger: 'whenEnabled',
          fetchEnabled,
        }),
      { initialProps: { fetchEnabled: false } },
    );

    expect(fetchPauseReflectReflectionTextMock).not.toHaveBeenCalled();

    rerender({ fetchEnabled: true });

    await waitFor(() => {
      expect(result.current.artifactReflectionText).toBe('late read');
      expect(result.current.reflectionTextFetch).toBe('done');
    });
  });
});
