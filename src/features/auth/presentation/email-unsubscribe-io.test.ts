import { describe, expect, it, vi, beforeEach } from 'vitest';
import { emailUnsubscribeAction } from './email-unsubscribe-io';

vi.mock('@/features/auth/infrastructure/queries/email-unsubscribe-query', () => ({
  submitEmailUnsubscribe: vi.fn(),
}));

import { submitEmailUnsubscribe } from '@/features/auth/infrastructure/queries/email-unsubscribe-query';

describe('emailUnsubscribeAction', () => {
  beforeEach(() => {
    vi.mocked(submitEmailUnsubscribe).mockReset();
  });

  it('rejects missing token', async () => {
    const formData = new FormData();
    await expect(emailUnsubscribeAction({}, formData)).resolves.toEqual({
      error: 'Missing token',
    });
  });

  it('returns success when edge confirms', async () => {
    vi.mocked(submitEmailUnsubscribe).mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });
    const formData = new FormData();
    formData.set('token', 'tok_abc');
    await expect(emailUnsubscribeAction({}, formData)).resolves.toEqual({ success: true });
  });

  it('returns already when edge reports prior unsubscribe', async () => {
    vi.mocked(submitEmailUnsubscribe).mockResolvedValueOnce({
      data: { reason: 'already_unsubscribed' },
      error: null,
    });
    const formData = new FormData();
    formData.set('token', 'tok_abc');
    await expect(emailUnsubscribeAction({}, formData)).resolves.toEqual({ already: true });
  });

  it('surfaces edge errors', async () => {
    vi.mocked(submitEmailUnsubscribe).mockResolvedValueOnce({
      data: null,
      error: new Error('network'),
    });
    const formData = new FormData();
    formData.set('token', 'tok_abc');
    await expect(emailUnsubscribeAction({}, formData)).resolves.toEqual({ error: 'network' });
  });
});
