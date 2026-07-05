import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsExperiencePanel() {
  const { t, currency, setCurrency, soundEnabled, setSoundEnabled, hapticEnabled, setHapticEnabled } =
    useSettingsState();
  return (
    <>
      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.displayCurrency')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.displayCurrencyDesc')}</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { code: 'USD', label: 'USD', desc: 'US Dollar ($)' },
              { code: 'EUR', label: 'EUR', desc: 'Euro (€)' },
              { code: 'GBP', label: 'GBP', desc: 'British Pound (£)' },
              { code: 'CHF', label: 'CHF', desc: 'Swiss Franc' },
              { code: 'CAD', label: 'CAD', desc: 'Canadian Dollar (C$)' },
              { code: 'AUD', label: 'AUD', desc: 'Australian Dollar (A$)' },
              { code: 'BRL', label: 'BRL', desc: 'Brazilian Real (R$)' },
              { code: 'TRY', label: 'TRY', desc: 'Turkish Lira (₺)' },
            ] as const
          ).map((c) => (
            <button
              type="button"
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                currency === c.code
                  ? 'border-ring bg-muted/40 text-foreground'
                  : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
              }`}
            >
              <p className="font-medium text-base font-sans text-secondary-foreground">{c.label}</p>
              <p className="mt-0.5 text-sm font-sans text-muted-foreground">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.notificationSound')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.notificationSoundDesc')}</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-toggle" className="text-xs font-mono text-muted-foreground">
            {t('settings.enableSound')}
          </Label>
          <Switch
            id="sound-toggle"
            checked={soundEnabled}
            onCheckedChange={(val) => {
              setSoundEnabled(val);
              localStorage.setItem('holzen_sound_enabled', String(val));
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.hapticFeedback')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.hapticDesc')}</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="haptic-toggle" className="text-xs font-mono text-muted-foreground">
            {t('settings.enableHaptics')}
          </Label>
          <Switch id="haptic-toggle" checked={hapticEnabled} onCheckedChange={setHapticEnabled} />
        </div>
      </div>
    </>
  );
}
