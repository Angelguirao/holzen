import { useActionState, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  changePasswordAction,
} from '@/features/auth/public';

export function ChangePasswordSection() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, formAction, isPending] = useActionState(changePasswordAction, {});

  useEffect(() => {
    if (state.success) {
      toast.success(t('auth.passwordUpdated'));
      setNewPassword('');
      setConfirmPassword('');
    } else if (state.error === 'too_short') {
      toast.error(t('auth.passwordTooShort'));
    } else if (state.error === 'mismatch') {
      toast.error(t('auth.passwordsDoNotMatch'));
    } else if (state.errorMessage) {
      toast.error(state.errorMessage);
    }
  }, [state.success, state.error, state.errorMessage, t]);

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.passwordLabel')}</p>
      <Input
        id="settings-new-password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        placeholder={t('settings.newPasswordPlaceholder')}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        minLength={8}
        pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
        className="text-xs font-mono"
      />
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
        <span>Must be at least 8 characters and include a letter and a number.</span>
      </p>
      <Input
        id="settings-confirm-password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder={t('settings.confirmPasswordPlaceholder')}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="text-xs font-mono"
      />
      <Button
        type="submit"
        disabled={isPending || !newPassword}
        size="sm"
        className="w-full font-mono text-xs !mt-4"
      >
        {isPending ? t('settings.updatingPassword') : t('settings.updatePassword')}
      </Button>
    </form>
  );
}
