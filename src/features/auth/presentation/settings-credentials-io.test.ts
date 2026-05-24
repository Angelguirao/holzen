import { describe, expect, it, vi, beforeEach } from 'vitest';
import { changeEmailAction, changePasswordAction } from './settings-credentials-io';

vi.mock('@/features/auth/infrastructure/supabase-auth-operations', () => ({
  updateUserPassword: vi.fn(),
  updateUserEmail: vi.fn(),
}));

import { updateUserEmail, updateUserPassword } from '@/features/auth/infrastructure/supabase-auth-operations';

describe('changePasswordAction', () => {
  beforeEach(() => {
    vi.mocked(updateUserPassword).mockReset();
  });

  it('rejects passwords shorter than 6 characters', async () => {
    const formData = new FormData();
    formData.set('newPassword', '12345');
    formData.set('confirmPassword', '12345');
    await expect(changePasswordAction({}, formData)).resolves.toEqual({ error: 'too_short' });
  });

  it('rejects mismatched passwords', async () => {
    const formData = new FormData();
    formData.set('newPassword', 'secret12');
    formData.set('confirmPassword', 'secret13');
    await expect(changePasswordAction({}, formData)).resolves.toEqual({ error: 'mismatch' });
  });

  it('returns success when updateUserPassword succeeds', async () => {
    vi.mocked(updateUserPassword).mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.set('newPassword', 'secret12');
    formData.set('confirmPassword', 'secret12');
    await expect(changePasswordAction({}, formData)).resolves.toEqual({ success: true });
  });

  it('surfaces update failures', async () => {
    vi.mocked(updateUserPassword).mockResolvedValueOnce({ error: new Error('weak') });
    const formData = new FormData();
    formData.set('newPassword', 'secret12');
    formData.set('confirmPassword', 'secret12');
    await expect(changePasswordAction({}, formData)).resolves.toEqual({
      error: 'update_failed',
      errorMessage: 'weak',
    });
  });
});

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
