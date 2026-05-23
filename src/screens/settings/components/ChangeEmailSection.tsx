import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { updateUserEmail } from '@/features/auth/public';
import { toast } from 'sonner';
import { readThrownMessage } from '@/screens/settings/read-thrown-message';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ChangeEmailSection() {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState('');
  const [changing, setChanging] = useState(false);

  const changeEmail = useCallback(async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Invalid email');
      return;
    }
    setChanging(true);
    try {
      const { error } = await updateUserEmail(newEmail);
      if (error) throw error;
      toast.success('Confirmation sent');
      setNewEmail('');
    } catch (e: unknown) {
      toast.error(readThrownMessage(e, 'Something went wrong'));
    } finally {
      setChanging(false);
    }
  }, [newEmail]);

  return (
    <div className="space-y-3">
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
        onClick={changeEmail}
        disabled={changing || !newEmail}
        size="sm"
        className="w-full font-mono text-xs !mt-4"
      >
        {changing ? t('settings.sendingConfirmation') : t('settings.changeEmail')}
      </Button>
      <p className="leading-relaxed text-[#7b8a9d] text-sm">
        {t('settings.emailConfirmNote')}
      </p>
    </div>
  );
}
