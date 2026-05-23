import { updateUserEmail } from '@/features/auth/public';
import { readThrownMessage } from '@/screens/settings/read-thrown-message';

export type ChangeEmailActionState = {
  error?: string;
  success?: boolean;
};

export async function changeEmailAction(
  _prev: ChangeEmailActionState,
  formData: FormData,
): Promise<ChangeEmailActionState> {
  const newEmail = String(formData.get('email') ?? '').trim();
  if (!newEmail || !newEmail.includes('@')) {
    return { error: 'Invalid email' };
  }

  const { error } = await updateUserEmail(newEmail);
  if (error) {
    return { error: readThrownMessage(error, 'Something went wrong') };
  }

  return { success: true };
}
