import { useActionState, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { signInWithOAuthGoogle } from '@/features/auth/public';
import { emailAuthAction, forgotPasswordAction } from '@/screens/marketing/auth-actions';

export type AuthView = 'sign-in' | 'sign-up' | 'forgot-password';

/**
 * Marketing auth route conductor — form actions, view state, Google OAuth.
 */
export function useAuthScreen() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AuthView>(() => {
    const v = searchParams.get('view');
    return v === 'sign-up' ? 'sign-up' : 'sign-in';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [emailAuthState, emailAuthFormAction, emailAuthPending] = useActionState(emailAuthAction, {});
  const [forgotState, forgotFormAction, forgotPending] = useActionState(forgotPasswordAction, {});
  const [isGooglePending, startGoogleTransition] = useTransition();

  useEffect(() => {
    if (emailAuthState.confirmSent) {
      setConfirmSent(true);
      return;
    }
    if (emailAuthState.errorKey) {
      setError(t(emailAuthState.errorKey, { defaultValue: emailAuthState.errorKey }));
    } else if (emailAuthState.error) {
      setError(emailAuthState.error);
    }
  }, [emailAuthState, t]);

  useEffect(() => {
    if (forgotState.resetSent) {
      setResetSent(true);
      return;
    }
    if (forgotState.errorKey) {
      setError(t(forgotState.errorKey, { defaultValue: forgotState.errorKey }));
    } else if (forgotState.error) {
      setError(forgotState.error);
    }
  }, [forgotState, t]);

  const handleGoogle = () => {
    setError(null);
    startGoogleTransition(async () => {
      const { error: oauthError } = await signInWithOAuthGoogle(window.location.origin);
      if (oauthError) setError(oauthError.message);
    });
  };

  const switchView = (next: AuthView) => {
    setView(next);
    setError(null);
  };

  const toggleSignUpSignIn = () => {
    switchView(view === 'sign-up' ? 'sign-in' : 'sign-up');
  };

  return {
    t,
    view,
    setView: switchView,
    toggleSignUpSignIn,
    email,
    setEmail,
    password,
    setPassword,
    error,
    setError,
    confirmSent,
    setConfirmSent,
    resetSent,
    setResetSent,
    emailAuthFormAction,
    emailAuthPending,
    forgotFormAction,
    forgotPending,
    handleGoogle,
    isGooglePending,
  };
}
