import { describe, expect, it, vi, beforeEach } from 'vitest';
import { signOutAction } from './sign-out-action';

vi.mock('@/features/auth/public', () => ({
  signOutAuth: vi.fn(),
}));

import { signOutAuth } from '@/features/auth/public';

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
