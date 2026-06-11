import { Label } from '@/components/ui/label';
import { ProLock } from '@/components/ui/pro-lock';
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
    reflectionTone,
    setReflectionTone,
    reflectionStyle,
    setReflectionStyle,
    customPrompt,
    setCustomPrompt,
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

      <ProLock feature="tone">
        <div className="space-y-3">
          <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.tone')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.toneDesc')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(['stoic', 'zen', 'poetic', 'blunt'] as const).map((value) => (
              <button type="button"
                key={value}
                onClick={() => setReflectionTone(value)}
                className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                  reflectionTone === value
                    ? 'border-ring bg-muted/40 text-foreground'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <p className="text-xs font-mono font-medium">{t(`settings.tones.${value}`)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t(`settings.tones.${value}Desc`)}</p>
              </button>
            ))}
          </div>
        </div>
      </ProLock>

      <ProLock feature="style">
        <div className="space-y-3">
          <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.style')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.styleDesc')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: 'standard', key: 'standard' },
                { value: 'one-liner', key: 'oneLiner' },
                { value: 'question', key: 'question' },
                { value: 'metaphor', key: 'metaphor' },
                { value: 'koan', key: 'koan' },
              ] as const
            ).map((s) => (
              <button type="button"
                key={s.value}
                onClick={() => setReflectionStyle(s.value)}
                className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                  reflectionStyle === s.value
                    ? 'border-ring bg-muted/40 text-foreground'
                    : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                <p className="text-xs font-mono font-medium">{t(`settings.styles.${s.key}`)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{t(`settings.styles.${s.key}Desc`)}</p>
              </button>
            ))}
          </div>
        </div>
      </ProLock>

      <ProLock feature="custom_prompt">
        <div className="space-y-3">
          <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.customPrompt')}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t('settings.customPromptDesc')}</p>
          <textarea
            value={customPrompt ?? ''}
            onChange={(e) => setCustomPrompt(e.target.value || null)}
            aria-label={t('settings.customPromptPlaceholder')}
            placeholder={t('settings.customPromptPlaceholder')}
            maxLength={200}
            rows={3}
            className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring transition-colors resize-none"
          />
          <p className="text-[10px] font-mono text-muted-foreground/50 text-right">{(customPrompt?.length ?? 0)}/200</p>
        </div>
      </ProLock>
    </>
  );
}
