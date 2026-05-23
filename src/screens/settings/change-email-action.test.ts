import { describe, expect, it, vi } from 'vitest';
import { changeEmailAction } from './change-email-action';

vi.mock('@/features/auth/public', () => ({
  updateUserEmail: vi.fn(),
}));

import { updateUserEmail } from '@/features/auth/public';

describe('changeEmailAction', () => {
  it('rejects invalid email', async () => {
    const formData = new FormData();
    formData.set('email', 'not-an-email');
    await expect(changeEmailAction({}, formData)).resolves.toEqual({ error: 'Invalid email' });
  });

  it('returns success when auth update succeeds', async () => {
    vi.mocked(updateUserEmail).mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.set('email', 'user@example.com');
    await expect(changeEmailAction({}, formData)).resolves.toEqual({ success: true });
  });

  it('surfaces auth errors', async () => {
    vi.mocked(updateUserEmail).mockResolvedValueOnce({ error: new Error('rate limited') });
    const formData = new FormData();
    formData.set('email', 'user@example.com');
    await expect(changeEmailAction({}, formData)).resolves.toEqual({ error: 'rate limited' });
  });
});
