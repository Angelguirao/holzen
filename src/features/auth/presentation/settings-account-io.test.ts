import { describe, expect, it, vi, beforeEach } from 'vitest';
import { deleteAccountAction, signOutAction } from './settings-account-io';

vi.mock('@/features/auth/infrastructure/supabase-auth-operations', () => ({
  getAuthUser: vi.fn(),
  signOutAuth: vi.fn(),
}));

vi.mock('@/features/auth/infrastructure/edge/delete-account-edge', () => ({
  deleteAccount: vi.fn(),
}));

import { getAuthUser, signOutAuth } from '@/features/auth/infrastructure/supabase-auth-operations';
import { deleteAccount as invokeDeleteAccount } from '@/features/auth/infrastructure/edge/delete-account-edge';

describe('signOutAction', () => {
  beforeEach(() => {
    vi.mocked(signOutAuth).mockReset();
  });

  it('returns success when signOut succeeds', async () => {
    vi.mocked(signOutAuth).mockResolvedValueOnce({ error: null });
    await expect(signOutAction({}, new FormData())).resolves.toEqual({ success: true });
  });

  it('returns sign_out_failed when signOut errors', async () => {
    vi.mocked(signOutAuth).mockResolvedValueOnce({ error: new Error('nope') });
    await expect(signOutAction({}, new FormData())).resolves.toEqual({ error: 'sign_out_failed' });
  });
});

describe('deleteAccountAction', () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockReset();
    vi.mocked(signOutAuth).mockReset();
    vi.mocked(invokeDeleteAccount).mockReset();
  });

  it('returns not_authenticated when signed out', async () => {
    vi.mocked(getAuthUser).mockResolvedValueOnce(null);
    await expect(deleteAccountAction({}, new FormData())).resolves.toEqual({ error: 'not_authenticated' });
  });

  it('signs out after successful delete', async () => {
    vi.mocked(getAuthUser).mockResolvedValueOnce({ id: 'user-1' } as never);
    vi.mocked(invokeDeleteAccount).mockResolvedValueOnce({ error: null });
    vi.mocked(signOutAuth).mockResolvedValueOnce({ error: null });
    await expect(deleteAccountAction({}, new FormData())).resolves.toEqual({ success: true });
    expect(signOutAuth).toHaveBeenCalledOnce();
  });

  it('returns delete_failed when edge invoke fails', async () => {
    vi.mocked(getAuthUser).mockResolvedValueOnce({ id: 'user-1' } as never);
    vi.mocked(invokeDeleteAccount).mockResolvedValueOnce({ error: new Error('nope') });
    await expect(deleteAccountAction({}, new FormData())).resolves.toEqual({ error: 'delete_failed' });
  });
});
