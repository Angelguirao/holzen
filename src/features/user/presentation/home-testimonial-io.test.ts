import { describe, expect, it, vi, beforeEach } from 'vitest';
import { submitTestimonialAction } from './home-testimonial-io';

vi.mock('@/features/user/infrastructure/queries/testimonial-mutations', () => ({
  submitUserTestimonial: vi.fn(),
}));

import { submitUserTestimonial } from '@/features/user/infrastructure/queries/testimonial-mutations';

describe('submitTestimonialAction', () => {
  beforeEach(() => {
    vi.mocked(submitUserTestimonial).mockReset();
  });

  it('rejects incomplete form', async () => {
    const formData = new FormData();
    formData.set('userId', 'u1');
    await expect(submitTestimonialAction({}, formData)).resolves.toEqual({ error: 'failed' });
  });

  it('returns success when mutation succeeds', async () => {
    vi.mocked(submitUserTestimonial).mockResolvedValueOnce({ error: null });
    const formData = new FormData();
    formData.set('userId', 'u1');
    formData.set('displayName', 'Alex');
    formData.set('quote', 'Holzen helped me pause.');
    await expect(submitTestimonialAction({}, formData)).resolves.toEqual({ success: true });
    expect(submitUserTestimonial).toHaveBeenCalledWith({
      userId: 'u1',
      displayName: 'Alex',
      quote: 'Holzen helped me pause.',
    });
  });

  it('returns failed when mutation errors', async () => {
    vi.mocked(submitUserTestimonial).mockResolvedValueOnce({ error: new Error('rls') });
    const formData = new FormData();
    formData.set('userId', 'u1');
    formData.set('displayName', 'Alex');
    formData.set('quote', 'Quote');
    await expect(submitTestimonialAction({}, formData)).resolves.toEqual({ error: 'failed' });
  });
});
