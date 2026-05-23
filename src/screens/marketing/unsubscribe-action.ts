import { submitEmailUnsubscribe } from '@/features/auth/public-queries';

export type UnsubscribeActionState = {
  error?: string;
  success?: boolean;
  already?: boolean;
};

export async function emailUnsubscribeAction(
  _prev: UnsubscribeActionState,
  formData: FormData,
): Promise<UnsubscribeActionState> {
  const token = String(formData.get('token') ?? '').trim();
  if (!token) {
    return { error: 'Missing token' };
  }

  const { data, error } = await submitEmailUnsubscribe(token);
  if (error) {
    return { error: error.message };
  }
  if (data?.success) {
    return { success: true };
  }
  if (data?.reason === 'already_unsubscribed') {
    return { already: true };
  }
  return { error: 'Unable to process request.' };
}
