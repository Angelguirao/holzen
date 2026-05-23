import { updateUserPassword } from '@/features/auth/public';
import { readThrownMessage } from '@/screens/settings/read-thrown-message';

export type ChangePasswordActionState = {
  error?: 'too_short' | 'mismatch' | 'update_failed';
  errorMessage?: string;
  success?: boolean;
};

export async function changePasswordAction(
  _prev: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (newPassword.length < 6) {
    return { error: 'too_short' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'mismatch' };
  }

  const { error } = await updateUserPassword(newPassword);
  if (error) {
    return {
      error: 'update_failed',
      errorMessage: readThrownMessage(error, 'Something went wrong'),
    };
  }

  return { success: true };
}
