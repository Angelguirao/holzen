import { describe, expect, it, vi, beforeEach } from 'vitest';
import { changePasswordAction } from './change-password-action';

vi.mock('@/features/auth/public', () => ({
  updateUserPassword: vi.fn(),
}));

import { updateUserPassword } from '@/features/auth/public';

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
