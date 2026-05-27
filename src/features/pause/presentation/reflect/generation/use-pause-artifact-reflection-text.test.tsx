import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePauseArtifactReflectionText } from './use-pause-artifact-reflection-text';

const { fetchReflectionContentMock, mockReflectGenerator } = vi.hoisted(() => ({
  fetchReflectionContentMock: vi.fn(),
  mockReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock('./pause-reflect-generation-io', () => ({
  reflectGenerator: {
    ...mockReflectGenerator,
    fetchReflectionContent: fetchReflectionContentMock,
  },
}));

describe('usePauseArtifactReflectionText', () => {
  afterEach(() => {
    fetchReflectionContentMock.mockReset();
  });

  it('fetches immediately when pauseInstanceId is set', async () => {
    fetchReflectionContentMock.mockResolvedValue({ message: 'persisted copy' });

    const { result } = renderHook(() =>
      usePauseArtifactReflectionText({
        pauseInstanceId: 'pause-1',
        trigger: 'immediate',
      }),
    );

    await waitFor(() => {
      expect(result.current.artifactReflectionText).toBe('persisted copy');
    });
    expect(fetchReflectionContentMock).toHaveBeenCalledWith('pause-1');
  });

  it('defers fetch until whenEnabled is true', async () => {
    fetchReflectionContentMock.mockResolvedValue({ message: 'late read' });

    const { result, rerender } = renderHook(
      ({ fetchEnabled }: { fetchEnabled: boolean }) =>
        usePauseArtifactReflectionText({
          pauseInstanceId: 'pause-2',
          trigger: 'whenEnabled',
          fetchEnabled,
        }),
      { initialProps: { fetchEnabled: false } },
    );

    expect(fetchReflectionContentMock).not.toHaveBeenCalled();

    rerender({ fetchEnabled: true });

    await waitFor(() => {
      expect(result.current.artifactReflectionText).toBe('late read');
      expect(result.current.reflectionTextFetch).toBe('done');
    });
  });

  it('routes artifact reads through the default ReflectGenerator port adapter', async () => {
    fetchReflectionContentMock.mockResolvedValue({ message: 'port-backed' });

    renderHook(() =>
      usePauseArtifactReflectionText({
        pauseInstanceId: 'pause-3',
        trigger: 'immediate',
      }),
    );

    await waitFor(() => {
      expect(fetchReflectionContentMock).toHaveBeenCalledWith('pause-3');
    });
    expect(mockReflectGenerator.port).toBe('supabaseReflectGenerator');
  });
});
