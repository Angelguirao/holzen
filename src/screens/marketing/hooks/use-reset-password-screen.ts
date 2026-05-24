import { useActionState, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { subscribePasswordRecoveryReady } from '@/features/auth/public';
import { resetPasswordAction } from '@/screens/marketing/reset-password-action';

/**
 * Marketing reset-password route conductor.
 */
export function useResetPasswordScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [state, formAction, isPending] = useActionState(resetPasswordAction, {});

  useEffect(() => subscribePasswordRecoveryReady(() => setReady(true)), []);

  useEffect(() => {
    if (state.success) {
      setSuccess(true);
      const timer = setTimeout(() => navigate('/', { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
    if (state.error === 'passwords_mismatch') {
      setError(t('auth.passwordsDoNotMatch'));
    } else if (state.error === 'password_too_short') {
      setError(t('auth.passwordTooShort'));
    } else if (state.error) {
      setError(state.error);
    }
  }, [state.success, state.error, t, navigate]);

  return {
    t,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    setError,
    success,
    ready,
    formAction,
    isPending,
  };
}
