import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { writeUnitBasisModeToStorage } from '@/features/market/domain/unit-basis-mode-storage';
import { isBitcoinTrackedAsset } from '@/features/market/public';
import {
  CHECKOUT_SUPPRESSION_WINDOW_DEFAULT_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES,
} from '@/features/subscription/public';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsExperiencePanel() {
  const {
    t,
    unitBasisMode,
    setUnitBasisMode,
    trackedAssetId,
    currency,
    setCurrency,
    checkoutWindowDraft,
    setCheckoutWindowDraft,
    commitCheckoutWindow,
    silentMode,
    setSilentMode,
    soundEnabled,
    setSoundEnabled,
    hapticEnabled,
    setHapticEnabled,
  } = useSettingsState();
  return (
    <>
      {isBitcoinTrackedAsset(trackedAssetId) ? (
        <div className="space-y-3">
          <p className="uppercase tracking-wider text-base font-sans font-semibold text-[#dbb266]">{t('settings.unitBasisMode')}</p>
          <p className="leading-relaxed text-foreground text-sm">{t('settings.unitBasisModeDesc')}</p>
          <div className="flex items-center justify-between">
            <Label htmlFor="btc-mode" className="cursor-pointer text-base font-sans text-secondary-foreground">
              {t('settings.enableConvictionMode')}
            </Label>
            <Switch
              id="btc-mode"
              checked={unitBasisMode}
              onCheckedChange={(val) => {
                setUnitBasisMode(val);
                writeUnitBasisModeToStorage(val);
              }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={`space-y-3 transition-opacity ${isBitcoinTrackedAsset(trackedAssetId) && unitBasisMode ? 'opacity-30 pointer-events-none' : ''}`}
      >
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
            <button type="button"
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
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">
          {t('settings.checkoutWindow', { defaultValue: 'Checkout-confirmed window' })}
        </p>
        <p className="leading-relaxed text-foreground text-sm">
          {t(
            'settings.checkoutWindowDesc',
            'After a successful purchase, the confirmation dialog and subscription re-sync are skipped if you return within this window. Default is {{default}} minutes.',
            { default: CHECKOUT_SUPPRESSION_WINDOW_DEFAULT_MINUTES },
          )}
        </p>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="checkout-window-minutes" className="text-muted-foreground text-base font-sans">
            {t('settings.checkoutWindowLabel', { defaultValue: 'Window (minutes)' })}
          </Label>
          <Input
            id="checkout-window-minutes"
            type="number"
            inputMode="numeric"
            min={CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES}
            max={CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES}
            step={1}
            value={checkoutWindowDraft}
            onChange={(e) => setCheckoutWindowDraft(e.target.value)}
            onBlur={(e) => commitCheckoutWindow(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitCheckoutWindow((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-24 text-right font-mono"
          />
        </div>
        <p className="text-[11px] font-mono text-muted-foreground">
          {t('settings.checkoutWindowRange', 'Allowed range: {{min}}–{{max}} minutes.', {
            min: CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES,
            max: CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES,
          })}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.silentMode')}</p>
        <p className="leading-relaxed text-foreground text-sm">{t('settings.silentModeDesc')}</p>
        <div className="flex items-center justify-between">
          <Label htmlFor="silent-mode" className="text-xs font-mono text-muted-foreground">
            {t('settings.enableSilentMode')}
          </Label>
          <Switch id="silent-mode" checked={silentMode} onCheckedChange={setSilentMode} />
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
