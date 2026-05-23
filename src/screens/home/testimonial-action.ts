import { submitUserTestimonial } from '@/features/user/public-queries';

export type TestimonialActionState = {
  error?: 'failed';
  success?: boolean;
};

export async function submitTestimonialAction(
  _prev: TestimonialActionState,
  formData: FormData,
): Promise<TestimonialActionState> {
  const userId = String(formData.get('userId') ?? '').trim();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const quote = String(formData.get('quote') ?? '').trim();

  if (!userId || !displayName || !quote) {
    return { error: 'failed' };
  }

  const { error } = await submitUserTestimonial({ userId, displayName, quote });
  if (error) {
    return { error: 'failed' };
  }

  return { success: true };
}
