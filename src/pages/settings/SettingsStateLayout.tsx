import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { useSettingsModel } from '@/pages/settings/useSettingsModel';
import { SettingsStateProvider } from '@/pages/settings/settings-context';

export default function SettingsStateLayout() {
  const { t } = useTranslation();
  const model = useSettingsModel();

  useEffect(() => {
    document.title = 'Holzen — Settings';
    return () => {
      document.title = 'Holzen — Pause before you act';
    };
  }, []);

  if (!model.profileLoaded) {
    return (
      <div className="space-y-6">
        <NoxHeaderMain title={t('settings.title')} subtitle={t('settings.pageSubtitle')} />
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border/40 rounded-md px-4 py-4 space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-2 w-full bg-muted/60 rounded" />
              <div className="h-2 w-3/4 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <SettingsStateProvider value={model}>
      <Outlet />
    </SettingsStateProvider>
  );
}
