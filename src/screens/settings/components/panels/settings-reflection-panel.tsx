import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TRACKED_ASSETS } from '@/features/market/public';
import { ThresholdSetting } from '@/screens/settings/components/ThresholdSetting';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';

export function SettingsReflectionPanel() {
  const {
    t,
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
    trackedAssetId,
    setTrackedAssetId,
  } = useSettingsState();
  return (
    <>
      {TRACKED_ASSETS.length > 1 ? (
        <div className="space-y-3">
          <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">
            {t('settings.trackedAssetTitle')}
          </p>
          <p className="leading-relaxed text-foreground text-sm">{t('settings.trackedAssetDesc')}</p>
          <Select value={trackedAssetId} onValueChange={(v) => void setTrackedAssetId(v)}>
            <SelectTrigger className="max-w-md font-mono text-xs" aria-label={t('settings.trackedAssetTitle')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACKED_ASSETS.map((a) => (
                <SelectItem key={a.id} value={a.id} className="font-mono text-xs">
                  {t(`settings.trackedAssets.${a.id}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <ThresholdSetting
        thresholdUp={threshold}
        onSetUp={setThreshold}
        thresholdDown={thresholdDown}
        onSetDown={setThresholdDown}
        trackedAssetId={trackedAssetId}
      />
    </>
  );
}
