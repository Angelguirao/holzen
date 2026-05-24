import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeading } from '@/components/ui/page-heading';
import { LoadingButton } from '@/components/ui/loading-button';
import { useResetPasswordScreen } from '@/screens/marketing/hooks/use-reset-password-screen';

const ResetPasswordScreen = () => {
  const {
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
  } = useResetPasswordScreen();

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
