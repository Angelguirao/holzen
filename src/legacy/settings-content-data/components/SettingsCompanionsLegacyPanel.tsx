import { Label } from '@/components/ui/label';
import { ProLock } from '@/components/ui/pro-lock';
import { Switch } from '@/components/ui/switch';
import { useProfile } from '@/features/user/public-hooks';
import { useTranslation } from 'react-i18next';
import { SourceManagement } from './SourceManagement';

/** Companion toggles + signal/grounding sources — legacy; not wired in pause-first MVP. */
export function SettingsCompanionsLegacyPanel() {
  const { t, companionPrefs, setCompanionPref } = useProfile();
  return (
    <ProLock feature="companions" hideContent>
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.companionsDesc')}</p>
          {(['haiku', 'grounding', 'signal', 'zoomOut', 'history'] as const).map((comp) => (
            <div key={comp} className="flex items-center justify-between">
              <Label htmlFor={`comp-${comp}`} className="text-xs font-mono text-muted-foreground">
                {t(`settings.companionLabels.${comp}`)}
              </Label>
              <Switch
                id={`comp-${comp}`}
                checked={companionPrefs[comp]}
                onCheckedChange={(v) => setCompanionPref(comp, v)}
              />
            </div>
          ))}
        </div>

        <SourceManagement />
      </div>
    </ProLock>
  );
}
