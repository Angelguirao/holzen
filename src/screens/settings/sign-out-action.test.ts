import { describe, expect, it, vi, beforeEach } from 'vitest';
import { signOutAction } from './sign-out-action';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { signOut: vi.fn() },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('signOutAction', () => {
  beforeEach(() => {
    vi.mocked(supabase.auth.signOut).mockReset();
  });

  it('returns success when signOut succeeds', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null });
    await expect(signOutAction({}, new FormData())).resolves.toEqual({ success: true });
  });

  it('returns sign_out_failed when signOut errors', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: new Error('nope') as never });
    await expect(signOutAction({}, new FormData())).resolves.toEqual({ error: 'sign_out_failed' });
  });
});
