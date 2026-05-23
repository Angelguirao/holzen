import { describe, expect, it, vi, beforeEach } from 'vitest';
import { deleteAccountAction } from './delete-account-action';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('@/features/auth/public-rpc', () => ({
  deleteAccount: vi.fn(),
}));

import { supabase } from '@/integrations/supabase/client';
import { deleteAccount as invokeDeleteAccount } from '@/features/auth/public-rpc';

describe('deleteAccountAction', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.getUser).mockReset();
    vi.mocked(supabase.auth.signOut).mockReset();
    vi.mocked(invokeDeleteAccount).mockReset();
  });

  it('returns not_authenticated when signed out', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(deleteAccountAction({}, new FormData())).resolves.toEqual({ error: 'not_authenticated' });
  });

  it('signs out after successful delete', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } as never },
      error: null,
    });
    vi.mocked(invokeDeleteAccount).mockResolvedValueOnce({ error: null });
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });
    await expect(deleteAccountAction({}, new FormData())).resolves.toEqual({ success: true });
    expect(supabase.auth.signOut).toHaveBeenCalledOnce();
  });

  it('returns delete_failed when edge invoke fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: 'user-1' } as never },
      error: null,
    });
    vi.mocked(invokeDeleteAccount).mockResolvedValueOnce({ error: new Error('nope') });
    await expect(deleteAccountAction({}, new FormData())).resolves.toEqual({ error: 'delete_failed' });
  });
});
