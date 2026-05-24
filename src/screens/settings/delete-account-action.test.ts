import { describe, expect, it, vi, beforeEach } from 'vitest';
import { deleteAccountAction } from './delete-account-action';

vi.mock('@/features/auth/public', () => ({
  getAuthUser: vi.fn(),
  signOutAuth: vi.fn(),
}));

vi.mock('@/features/auth/public-rpc', () => ({
  deleteAccount: vi.fn(),
}));

import { getAuthUser, signOutAuth } from '@/features/auth/public';
import { deleteAccount as invokeDeleteAccount } from '@/features/auth/public-rpc';

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
