import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { useReflectionShareHandlers } from './use-reflection-share-handlers';

const pauseReflectionShareImageMock = vi.hoisted(() => vi.fn(async () => 'downloaded' as const));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock('./pause-reflect-share-io', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./pause-reflect-share-io')>();
  return {
    ...actual,
    pauseReflectionShareImage: pauseReflectionShareImageMock,
  };
});

describe('useReflectionShareHandlers', () => {
  const t = ((key: string) => key) as unknown as TFunction;
  const openSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    pauseReflectionShareImageMock.mockResolvedValue('downloaded');
    vi.stubGlobal('open', openSpy);
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(async () => undefined) },
      share: undefined,
      canShare: undefined,
    });
  });

  it('opens tweet intent with encoded reflection text', () => {
    const { result } = renderHook(() =>
      useReflectionShareHandlers({ message: 'Stay calm.', t }),
    );

    act(() => {
      result.current.shareToX();
    });

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://x.com/intent/tweet?text='),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('passes wallpaperMood into share image generation', async () => {
    const { result } = renderHook(() =>
      useReflectionShareHandlers({
        message: 'Stay calm.',
        wallpaperMood: 'anxious',
        t,
      }),
    );

    await act(async () => {
      await result.current.shareImage();
    });

    expect(pauseReflectionShareImageMock).toHaveBeenCalledWith(
      'Stay calm.',
      undefined,
      undefined,
      'anxious',
    );
  });
});
