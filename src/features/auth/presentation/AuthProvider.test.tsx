import type { ReactNode } from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from './AuthProvider';

const { getAuthUserMock, signOutAuthMock, subscribeMock } = vi.hoisted(() => ({
  getAuthUserMock: vi.fn(),
  signOutAuthMock: vi.fn().mockResolvedValue({ error: null }),
  subscribeMock: vi.fn(),
}));

vi.mock('./auth-session-io', () => ({
  getAuthUser: getAuthUserMock,
  signOutAuth: signOutAuthMock,
  subscribeAuthStateChange: subscribeMock,
  handleAuthFunnelEvents: vi.fn(),
  identifyAuthenticatedUser: vi.fn(),
  syncAuthObservability: vi.fn(),
}));

vi.mock('../public-hooks', () => ({
  runSignedInSideEffects: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthProvider', () => {
  let listener: (event: AuthChangeEvent, session: Session | null) => void;

  beforeEach(() => {
    getAuthUserMock.mockReset();
    signOutAuthMock.mockClear();
    subscribeMock.mockImplementation((cb: typeof listener) => {
      listener = cb;
      return () => undefined;
    });
  });

  it('signs out when INITIAL_SESSION JWT fails server validation', async () => {
    getAuthUserMock.mockResolvedValue(null);
    const staleUser = { id: 'ghost-user' } as User;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(subscribeMock).toHaveBeenCalled();
    });

    await act(async () => {
      await listener('INITIAL_SESSION', { user: staleUser } as Session);
    });

    await waitFor(() => {
      expect(signOutAuthMock).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('keeps user when INITIAL_SESSION passes server validation', async () => {
    const validUser = { id: 'user-1' } as User;
    getAuthUserMock.mockResolvedValue(validUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(subscribeMock).toHaveBeenCalled();
    });

    await act(async () => {
      await listener('INITIAL_SESSION', { user: validUser } as Session);
    });

    await waitFor(() => {
      expect(signOutAuthMock).not.toHaveBeenCalled();
      expect(result.current.user).toEqual(validUser);
    });
  });
});
