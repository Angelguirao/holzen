import { useActionState, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { changeEmailAction } from '@/features/auth/public';

export function ChangeEmailSection() {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState('');
  const [state, formAction, isPending] = useActionState(changeEmailAction, {});

  useEffect(() => {
    if (state.success) {
      toast.success('Confirmation sent');
      setNewEmail('');
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.emailLabel')}</p>
      <Input
        id="settings-new-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t('settings.newEmailPlaceholder')}
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        className="text-xs font-mono"
      />
      <Button
        type="submit"
        disabled={isPending || !newEmail}
        size="sm"
        className="w-full font-mono text-xs !mt-4"
      >
        {isPending ? t('settings.sendingConfirmation') : t('settings.changeEmail')}
      </Button>
      <p className="leading-relaxed text-[#7b8a9d] text-sm">
        {t('settings.emailConfirmNote')}
      </p>
    </form>
  );
}
