import { Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { ProLock } from '@/components/ui/pro-lock';
import { Switch } from '@/components/ui/switch';
import { InstallHolzenCard } from '@/screens/home/components/InstallHolzenCard';
import { QuietWindowsManager } from '@/screens/settings/components/QuietWindowsManager';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsNotificationsPanel() {
  const {
    t,
    user,
    emailNotifications,
    setEmailNotifications,
    pushSupported,
    pushSubscribed,
    pushLoading,
    pushPermissionGrantedIncomplete,
    pushSubscribe,
    pushUnsubscribe,
    quietHoursStart,
    quietHoursEnd,
    setQuietHours,
  } = useSettingsState();
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notif" className="font-sans text-base font-medium text-foreground">
            {t('settings.emailNotifications')}
          </Label>
          <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
        </div>
        {pushSupported && pushPermissionGrantedIncomplete && (
          <Alert className="border-border/60 bg-muted/30">
            <Info className="h-4 w-4 text-muted-foreground" />
            <AlertTitle className="text-sm">
              {t('settings.pushFinishBannerTitle', { defaultValue: 'Finish enabling push in Settings' })}
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                {t(
                  'settings.pushFinishBannerBody',
                  'Your browser already allows notifications for this site, but this device is not registered for Holzen push yet. Use the button below to complete setup (same as turning push on).',
                )}
              </p>
              <LoadingButton
                type="button"
                size="sm"
                variant="secondary"
                className="font-medium"
                loading={pushLoading}
                onClick={() => void pushSubscribe()}
              >
                {t('settings.pushFinishBannerAction', { defaultValue: 'Enable push on this device' })}
              </LoadingButton>
            </AlertDescription>
          </Alert>
        )}
        {pushSupported && (
          <div className="flex items-center justify-between">
            <Label
              htmlFor="push-notif"
              className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground text-base font-sans"
            >
              {t('settings.pushNotifications')}
            </Label>
            <div className="flex items-center gap-2">
              {pushLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Switch
                id="push-notif"
                checked={pushSubscribed}
                disabled={pushLoading}
                onCheckedChange={(checked) => (checked ? pushSubscribe() : pushUnsubscribe())}
              />
            </div>
          </div>
        )}
      </div>

      <InstallHolzenCard alwaysShow compact />

      <ProLock feature="notifications" hideContent>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.quietHours')}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.quietHoursDesc')}</p>
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-enabled" className="text-xs font-mono text-muted-foreground">
                {t('settings.enableQuietHours')}
              </Label>
              <Switch
                id="quiet-enabled"
                checked={quietHoursStart !== null}
                onCheckedChange={(v) => (v ? setQuietHours(22, 7) : setQuietHours(null, null))}
              />
            </div>
            {quietHoursStart !== null && quietHoursEnd !== null && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('common.from')}</p>
                  <select
                    value={quietHoursStart}
                    onChange={(e) => setQuietHours(Number(e.target.value), quietHoursEnd)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-border/60 bg-background text-foreground"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('common.until')}</p>
                  <select
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHours(quietHoursStart, Number(e.target.value))}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-border/60 bg-background text-foreground"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <QuietWindowsManager userId={user?.id} />
          </div>
        </div>
      </ProLock>
    </>
  );
}
