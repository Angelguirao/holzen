import { ChangeEmailSection } from '@/screens/settings/components/ChangeEmailSection';
import { ChangePasswordSection } from '@/screens/settings/components/ChangePasswordSection';
import { SettingsAccountDataSection } from '@/screens/settings/components/SettingsAccountDataSection';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsAccountPanel() {
  const { t, user, canInstall, install } = useSettingsState();
  return (
    <>
      <p className="truncate font-sans text-foreground text-sm">{user.email}</p>

      <ChangeEmailSection />

      <ChangePasswordSection />

      <SettingsAccountDataSection />

      {canInstall && (
        <button type="button"
          onClick={install}
          className="text-xs font-mono text-muted-foreground underline"
        >
          {t('settings.installApp')}
        </button>
      )}
    </>
  );
}
