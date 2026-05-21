import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePauseReflectGeneration } from './use-pause-reflect-generation';
import { usePauseArtifactReflectionText } from './use-pause-artifact-reflection-text';

const { runPauseReflectGenerationMock } = vi.hoisted(() => ({
  runPauseReflectGenerationMock: vi.fn(),
}));

vi.mock('@/features/pause/public-rpc', () => ({
  runPauseReflectGeneration: runPauseReflectGenerationMock,
}));

vi.mock('./use-pause-artifact-reflection-text', () => ({
  usePauseArtifactReflectionText: vi.fn(),
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/features/user/public-hooks', () => ({
  useProfile: () => ({}),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

const usePauseArtifactReflectionTextMock = vi.mocked(usePauseArtifactReflectionText);

function baseParams(
  overrides: Partial<Parameters<typeof usePauseReflectGeneration>[0]> = {},
) {
  return {
    pauseInstanceId: 'pause-1',
    context: 'btc',
    initialReflectionMessage: '',
    severityAbsPct: 50,
    enabled: true,
    ...overrides,
  };
}

beforeEach(() => {
  runPauseReflectGenerationMock.mockReset();
  runPauseReflectGenerationMock.mockImplementation(
    () =>
      new Promise(() => {
        /* never resolves — isolate artifact hydrate */
      }),
  );
  usePauseArtifactReflectionTextMock.mockReturnValue({
    artifactReflectionText: null,
    reflectionTextFetch: 'idle',
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('usePauseReflectGeneration', () => {
  it('enables artifact reflection fetch when nav seed is empty and hook is enabled', () => {
    renderHook(() => usePauseReflectGeneration(baseParams()));

    expect(usePauseArtifactReflectionTextMock).toHaveBeenCalledWith({
      pauseInstanceId: 'pause-1',
      trigger: 'whenEnabled',
      fetchEnabled: true,
    });
  });

  it('does not enable artifact fetch when nav seed is non-empty', () => {
    renderHook(() =>
      usePauseReflectGeneration(baseParams({ initialReflectionMessage: '  seeded  ' })),
    );

    expect(usePauseArtifactReflectionTextMock).toHaveBeenCalledWith({
      pauseInstanceId: 'pause-1',
      trigger: 'whenEnabled',
      fetchEnabled: false,
    });
  });

  it('hydrates reflectionMessage from artifact before holzen-reflect completes', async () => {
    usePauseArtifactReflectionTextMock.mockReturnValue({
      artifactReflectionText: 'persisted reflection',
      reflectionTextFetch: 'done',
    });

    const { result } = renderHook(() => usePauseReflectGeneration(baseParams()));

    await waitFor(() => {
      expect(result.current.reflectionMessage).toBe('persisted reflection');
    });
    expect(runPauseReflectGenerationMock).toHaveBeenCalled();
  });

  it('keeps nav seed when initialReflectionMessage is non-empty', async () => {
    runPauseReflectGenerationMock.mockResolvedValue({ status: 'generated', message: 'edge' });

    usePauseArtifactReflectionTextMock.mockReturnValue({
      artifactReflectionText: 'artifact only',
      reflectionTextFetch: 'done',
    });

    const { result } = renderHook(() =>
      usePauseReflectGeneration(baseParams({ initialReflectionMessage: 'nav seed' })),
    );

    await waitFor(() => {
      expect(result.current.reflectionMessage).toBe('nav seed');
    });
    expect(runPauseReflectGenerationMock).not.toHaveBeenCalled();
  });

  it('commits holzen-reflect result after artifact hydrate when edge completes', async () => {
    usePauseArtifactReflectionTextMock.mockReturnValue({
      artifactReflectionText: 'from artifact row',
      reflectionTextFetch: 'done',
    });

    let resolveEdge: (value: { status: 'generated'; message: string }) => void = () => {};
    runPauseReflectGenerationMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEdge = resolve;
        }),
    );

    const { result } = renderHook(() => usePauseReflectGeneration(baseParams()));

    await waitFor(() => {
      expect(result.current.reflectionMessage).toBe('from artifact row');
    });

    resolveEdge({ status: 'generated', message: 'edge copy' });
    await waitFor(() => {
      expect(result.current.reflectionMessage).toBe('edge copy');
    });
  });

  it('reports missing-context error without calling holzen-reflect', async () => {
    const { result } = renderHook(() =>
      usePauseReflectGeneration(baseParams({ context: '   ' })),
    );

    await waitFor(() => {
      expect(result.current.error).toMatch(/missing market context/i);
      expect(result.current.loading).toBe(false);
    });
    expect(runPauseReflectGenerationMock).not.toHaveBeenCalled();
  });
});
