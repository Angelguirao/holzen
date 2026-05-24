import { Link } from 'react-router-dom';
import { QuietWindowsManager } from '@/screens/settings/components/QuietWindowsManager';
import { SourceManagement } from '@/screens/settings/components/SourceManagement';
import { ProLock } from '@/components/ui/pro-lock';
import { PRICING } from '@/features/subscription/public';
import { ThresholdSetting } from '@/screens/settings/components/ThresholdSetting';
import { ReferralSection } from '@/screens/settings/components/ReferralSection';
import { CreditsDashboard } from '@/screens/settings/components/CreditsDashboard';
import { InstallHolzenCard } from '@/screens/home/components/InstallHolzenCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  CHECKOUT_SUPPRESSION_WINDOW_DEFAULT_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES,
  CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES,
} from '@/features/subscription/public';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettingsState } from '@/screens/settings/hooks/use-settings-state';
import { GroundingTagInput } from '@/screens/settings/components/GroundingTagInput';
import { ChangeEmailSection } from '@/screens/settings/components/ChangeEmailSection';
import { ChangePasswordSection } from '@/screens/settings/components/ChangePasswordSection';
import { SettingsAccountDataSection } from '@/screens/settings/components/SettingsAccountDataSection';
import { HoldGoalWidget } from '@/screens/home/components/HoldGoalWidget';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TRACKED_ASSETS } from '@/features/market/public';


export function SettingsReflectionPanel() {
  const {
    t,
    threshold,
    setThreshold,
    thresholdDown,
    setThresholdDown,
    cumulativeThreshold,
    setCumulativeThreshold,
    cooldownHours,
    setCooldownHours,
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

            <ThresholdSetting
              thresholdUp={threshold}
              onSetUp={setThreshold}
              thresholdDown={thresholdDown}
              onSetDown={setThresholdDown}
              cumulativeThreshold={cumulativeThreshold}
              onSetCumulative={setCumulativeThreshold}
              cooldownHours={cooldownHours}
              trackedAssetId={trackedAssetId}
            />

            {/* Cooldown */}
            <div className="space-y-3 text-sm font-sans">
              <p id="settings-cooldown-label" className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">
                {t('settings.cooldown')}
              </p>
              <p className="leading-relaxed text-sm text-secondary-foreground">
                {t('settings.cooldownDesc')}
              </p>
              <section
                role="note"
                aria-labelledby="settings-cooldown-help-title"
                aria-describedby="settings-cooldown-help-body"
                className="space-y-1 rounded-md border border-border/50 bg-muted/20 px-3 py-2"
              >
                <h3 id="settings-cooldown-help-title" className="text-sm font-medium text-secondary-foreground">
                  {t('settings.cooldownHelpTitle', { defaultValue: 'Cooldown help' })}
                </h3>
                <p id="settings-cooldown-help-body" className="text-sm leading-relaxed text-muted-foreground">
                  {t(
                    'settings.cooldownHelpBody',
                    'After an automatic pause, Holzen waits before sending another one. You can set this wait between 6 and 24 hours: shorter means more frequent pauses, longer means more quiet time.',
                  )}
                </p>
              </section>
              <div
                className="grid grid-cols-4 gap-2"
                role="group"
                aria-labelledby="settings-cooldown-label"
                aria-describedby="settings-cooldown-help-body"
              >
                {([1, 6, 12, 24] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => setCooldownHours(h)}
                    className={`rounded-md border px-3 py-2 text-center transition-colors ${
                      cooldownHours === h
                        ? 'border-ring bg-muted/40 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="text-base font-sans">{h}h</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone â€” Pro */}
            <ProLock feature="tone">
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.tone')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.toneDesc')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['stoic', 'zen', 'poetic', 'blunt'] as const).map((value) => (
                  <button
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

            {/* Style â€” Pro */}
            <ProLock feature="style">
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.style')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.styleDesc')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'standard', key: 'standard' },
                  { value: 'one-liner', key: 'oneLiner' },
                  { value: 'question', key: 'question' },
                  { value: 'metaphor', key: 'metaphor' },
                  { value: 'koan', key: 'koan' },
                ] as const).map((s) => (
                  <button
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

            {/* Custom Prompt â€” Pro */}
            <ProLock feature="custom_prompt">
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.customPrompt')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.customPromptDesc')}
              </p>
              <textarea
                value={customPrompt ?? ''}
                onChange={(e) => setCustomPrompt(e.target.value || null)}
                placeholder={t('settings.customPromptPlaceholder')}
                maxLength={200}
                rows={3}
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-ring transition-colors resize-none"
              />
              <p className="text-[10px] font-mono text-muted-foreground/50 text-right">
                {(customPrompt?.length ?? 0)}/200
              </p>
            </div>
            </ProLock>
    </>
  );
}

