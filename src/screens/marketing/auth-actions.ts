import {
  checkSignupGateForApp,
  resetPasswordForEmail,
  signInWithEmailPassword,
  signUpWithEmailPassword,
} from '@/features/auth/public';
import { readThrownMessage } from '@/screens/settings/read-thrown-message';

export type AuthActionState = {
  /** i18n key for known errors */
  errorKey?: string;
  /** Dynamic message (e.g. Supabase) */
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
