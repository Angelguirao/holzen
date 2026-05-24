/**
 * Settings credential form actions (change password / email).
 */
import { readThrownMessage } from '@/features/auth/application/read-thrown-message';
import {
  updateUserEmail,
  updateUserPassword,
} from '@/features/auth/infrastructure/supabase-auth-operations';

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
