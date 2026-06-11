import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

/** Email notification toggle — legacy UI only (not persisted after schema cleanup). */
export function SettingsEmailNotificationsLegacySection() {
  const { t } = useTranslation();
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="email-notif" className="font-sans text-base font-medium text-foreground">
        {t('settings.emailNotifications')}
      </Label>
      <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
    </div>
  );
}
