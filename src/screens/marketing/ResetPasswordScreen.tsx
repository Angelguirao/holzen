import { useActionState, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribePasswordRecoveryReady } from '@/features/auth/public';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@/components/ui/page-heading';
import { LoadingButton } from '@/components/ui/loading-button';
import { resetPasswordAction } from '@/screens/marketing/reset-password-action';

const ResetPasswordScreen = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [state, formAction, isPending] = useActionState(resetPasswordAction, {});
  const navigate = useNavigate();

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <PageHeading title={t('common.holzen')} />
          <p className="text-sm">{t('auth.passwordUpdated')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <PageHeading title={t('common.holzen')} subtitle={ready ? t('auth.setNewPassword') : t('auth.verifyingResetLink')} />
        {ready && (
          <form
            action={formAction}
            onSubmit={() => setError(null)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="reset-password-new" className="text-xs font-mono">{t('auth.newPassword')}</Label>
              <Input
                id="reset-password-new"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-confirm" className="text-xs font-mono">{t('auth.confirmPassword')}</Label>
              <Input
                id="reset-password-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="font-mono text-sm"
              />
            </div>
            {error && <p className="text-xs text-destructive font-mono">{error}</p>}
            <LoadingButton type="submit" className="w-full text-base font-sans font-normal" loading={isPending}>{t('auth.updatePassword')}</LoadingButton>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
