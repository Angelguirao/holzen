import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePauseSessionExitNavigation } from '@/screens/pause/hooks/use-pause-session-exit-navigation';

const { clearSessionMock } = vi.hoisted(() => ({
  clearSessionMock: vi.fn(),
}));

vi.mock('@/features/pause/public', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/pause/public')>();
  return {
    ...actual,
    clearSession: () => clearSessionMock(),
  };
});

describe('usePauseSessionExitNavigation', () => {
  beforeEach(() => {
    clearSessionMock.mockClear();
  });

  it('handleClose navigates home with replace', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => usePauseSessionExitNavigation(navigate));
    act(() => {
      result.current.handleClose();
    });
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
    expect(clearSessionMock).not.toHaveBeenCalled();
  });

  it('handleReturn clears session then navigates home with replace', () => {
    const navigate = vi.fn();
    const { result } = renderHook(() => usePauseSessionExitNavigation(navigate));
    act(() => {
      result.current.handleReturn();
    });
    expect(clearSessionMock).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
