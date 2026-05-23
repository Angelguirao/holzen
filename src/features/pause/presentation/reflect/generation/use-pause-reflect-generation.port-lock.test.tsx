import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePauseReflectGeneration } from './use-pause-reflect-generation';
import { usePauseArtifactReflectionText } from './use-pause-artifact-reflection-text';

const { pauseReflectGenerationMock, mockReflectGenerator } = vi.hoisted(() => ({
  pauseReflectGenerationMock: vi.fn(),
  mockReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock('@/features/pause/public-rpc', () => ({
  supabaseReflectGenerator: mockReflectGenerator,
}));

vi.mock('./pause-reflect-generation-io', async () => {
  const actual = await vi.importActual<typeof import('./pause-reflect-generation-io')>(
    './pause-reflect-generation-io',
  );
  return {
    ...actual,
    reflectGenerator: mockReflectGenerator,
    pauseReflectGeneration: pauseReflectGenerationMock,
  };
});

vi.mock('./use-pause-artifact-reflection-text', () => ({
  usePauseArtifactReflectionText: vi.fn(),
}));

vi.mock('@/features/auth/public', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/features/user/public-hooks', () => ({
  useProfile: () => ({ display_name: 'Test' }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? _key,
  }),
}));

const usePauseArtifactReflectionTextMock = vi.mocked(usePauseArtifactReflectionText);

beforeEach(() => {
  pauseReflectGenerationMock.mockReset();
  pauseReflectGenerationMock.mockResolvedValue({ status: 'generated', message: 'edge' });
  usePauseArtifactReflectionTextMock.mockReturnValue({
    artifactReflectionText: null,
    reflectionTextFetch: 'idle',
  });
});

describe('usePauseReflectGeneration port-lock', () => {
  it('routes holzen-reflect through the default ReflectGenerator port adapter', async () => {
    renderHook(() =>
      usePauseReflectGeneration({
        pauseInstanceId: 'pause-1',
        context: 'btc',
        initialReflectionMessage: '',
        severityAbsPct: 50,
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(pauseReflectGenerationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pauseInstanceId: 'pause-1',
          userId: 'user-1',
          context: 'btc',
          severityAbsPct: 50,
        }),
        mockReflectGenerator,
      );
    });
    expect(mockReflectGenerator.port).toBe('supabaseReflectGenerator');
  });
});
