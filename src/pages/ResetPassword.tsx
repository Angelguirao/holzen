import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { NoxHeaderMain } from '@/components/ui/nox-header';

const ResetPassword = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : t('common.unexpectedError', { defaultValue: 'Something went wrong' });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError(t('auth.passwordsDoNotMatch')); return; }
    if (password.length < 6) { setError(t('auth.passwordTooShort')); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <NoxHeaderMain title={t('common.holzen')} />
          <p className="text-sm">{t('auth.passwordUpdated')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <NoxHeaderMain
          title={t('common.holzen')}
          subtitle={ready ? t('auth.setNewPassword') : t('auth.verifyingResetLink')}
        />
        {ready && (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-password-new" className="text-xs font-mono">{t('auth.newPassword')}</Label>
              <Input
                id="reset-password-new"
                name="new-password"
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
                name="new-password"
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
            <Button type="submit" className="w-full text-base font-sans font-normal" disabled={loading}>{t('auth.updatePassword')}</Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
