import { Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { Switch } from '@/components/ui/switch';
import { useInstallPrompt } from '@/app/hooks/use-install-prompt';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsNotificationsPanel() {
  const {
    t,
    pushSupported,
    pushSubscribed,
    pushLoading,
    pushPermissionGrantedIncomplete,
    pushSubscribe,
    pushUnsubscribe,
  } = useSettingsState();
  const { isInstalled } = useInstallPrompt();

  return (
    <>
      <div className="space-y-3">
        {!pushSupported && !isInstalled && (
          <Alert className="border-border/60 bg-muted/30">
            <Info className="h-4 w-4 text-muted-foreground" />
            <AlertTitle className="text-sm">
              {t('settings.pushRequiresInstallTitle', { defaultValue: 'Install Holzen for push' })}
            </AlertTitle>
            <AlertDescription className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t(
                'settings.pushRequiresInstallBody',
                'Push notifications need the installed app (especially on iPhone). Use Settings → Account & security → Install app, or add Holzen to your home screen from the browser share menu.',
              )}
            </AlertDescription>
          </Alert>
        )}
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
    </>
  );
}
