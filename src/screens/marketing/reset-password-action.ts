import { updateUserPassword } from '@/features/auth/public';
import { readThrownMessage } from '@/screens/settings/read-thrown-message';

export type ResetPasswordActionState = {
  error?: string;
  success?: boolean;
};

export async function resetPasswordAction(
  _prev: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (password !== confirmPassword) {
    return { error: 'passwords_mismatch' };
  }
  if (password.length < 6) {
    return { error: 'password_too_short' };
  }

  try {
    const { error } = await updateUserPassword(password);
    if (error) throw error;
    return { success: true };
  } catch (e: unknown) {
    return { error: readThrownMessage(e, 'Something went wrong') };
  }
}
