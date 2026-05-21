import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';
import { useReflectionShareHandlers } from './use-reflection-share-handlers';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock('@/features/pause/application/use-cases/ritual/reflect/share/reflection-share-canvas', () => ({
  generateReflectionShareImage: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
}));

describe('useReflectionShareHandlers', () => {
  const t = ((key: string) => key) as unknown as TFunction;
  const openSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
});
