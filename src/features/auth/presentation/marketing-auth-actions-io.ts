/**
 * Public auth screen form actions (sign-in, sign-up, forgot password, reset password).
 */
import { readThrownMessage } from '@/features/auth/application/read-thrown-message';
import { checkSignupGateForApp } from '@/features/auth/infrastructure/supabase-auth-operations';
import {
  resetPasswordForEmail,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  updateUserPassword,
} from '@/features/auth/infrastructure/supabase-auth-operations';

export type AuthActionState = {
  errorKey?: string;
  error?: string;
  confirmSent?: boolean;
  resetSent?: boolean;
};

export async function emailAuthAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const intent = String(formData.get('intent') ?? 'sign-in');
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { errorKey: 'auth.missingCredentials' };
  }

  try {
    if (intent === 'sign-up') {
      const gate = await checkSignupGateForApp();
      if (!gate.allow) {
        if (gate.reason === 'daily_cap') {
          return { errorKey: 'auth.signupsDailyCap' };
        }
        return { errorKey: 'auth.signupsPaused' };
      }
      const { error } = await signUpWithEmailPassword(email, password, window.location.origin);
      if (error) throw error;
      return { confirmSent: true };
    }

    const { error } = await signInWithEmailPassword(email, password);
    if (error) throw error;
    return {};
  } catch (e: unknown) {
    return { error: readThrownMessage(e, 'Something went wrong') };
  }
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    return { errorKey: 'auth.emailRequired' };
  }

  try {
    const { error } = await resetPasswordForEmail(email, `${window.location.origin}/reset-password`);
    if (error) throw error;
    return { resetSent: true };
  } catch (e: unknown) {
    return { error: readThrownMessage(e, 'Something went wrong') };
  }
}

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
