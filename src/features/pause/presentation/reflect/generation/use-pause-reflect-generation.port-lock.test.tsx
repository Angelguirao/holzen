import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePauseReflectGeneration } from './use-pause-reflect-generation';
import { usePauseArtifactReflectionText } from './use-pause-artifact-reflection-text';

const { runReflectGenerationMock, mockReflectGenerator } = vi.hoisted(() => ({
  runReflectGenerationMock: vi.fn(),
  mockReflectGenerator: { port: 'supabaseReflectGenerator' },
}));

vi.mock(
  '@/features/pause/application/use-cases/ritual/reflect/generation/run-reflect-generation',
  () => ({
    runReflectGeneration: runReflectGenerationMock,
  }),
);

vi.mock('@/features/pause/infrastructure/supabase-reflect-generator', () => ({
  supabaseReflectGenerator: mockReflectGenerator,
}));

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
  runReflectGenerationMock.mockReset();
  runReflectGenerationMock.mockResolvedValue({ status: 'generated', message: 'edge' });
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
      expect(runReflectGenerationMock).toHaveBeenCalledWith(
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
