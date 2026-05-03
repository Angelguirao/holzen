import { Link } from 'react-router-dom';
import { QuietWindowsManager } from '@/components/QuietWindowsManager';
import { SourceManagement } from '@/components/SourceManagement';
import { ProLock } from '@/components/ProLock';
import { PRICING } from '@/lib/pricing';
import { ThresholdSetting } from '@/components/ThresholdSetting';
import { ReferralSection } from '@/components/ReferralSection';
import { CreditsDashboard } from '@/components/CreditsDashboard';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
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
} from '@/lib/checkout-suppression-window';
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
import { useSettingsState } from '@/pages/settings/use-settings-state';
import { GroundingTagInput } from '@/pages/settings/GroundingTagInput';
import { ChangeEmailSection } from '@/pages/settings/ChangeEmailSection';
import { HoldGoalWidget } from '@/components/HoldGoalWidget';

export function SettingsYouPanel() {
  const {
    t,
    firstName,
    setFirstName,
    motivations,
    setMotivations,
    mantra,
    setMantra,
    groundingActivities,
    setGroundingActivities,
  } = useSettingsState();
  return (
    <>

            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.firstName')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.firstNameDesc')}
              </p>
              <Input
                id="settings-first-name"
                name="given-name"
                autoComplete="given-name"
                value={firstName ?? ''}
                onChange={(e) => setFirstName(e.target.value || null)}
                placeholder={t('settings.firstNamePlaceholder')}
                maxLength={30}
                className="text-xs font-mono"
              />
            </div>

            {/* Hold goal — full editor (Home “Why you stay” is summary-only) */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.holdGoalTitle')}</p>
              <p className="leading-relaxed text-primary text-sm">{t('settings.holdGoalDesc')}</p>
              <HoldGoalWidget />
            </div>

            {/* My Why — Motivations */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.myWhy')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.myWhyDesc')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['freedom', 'family', 'generational', 'discipline', 'conviction', 'sovereignty', 'inflation', 'curiosity'] as const).map((value) => {
                  const selected = motivations.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        const next = selected
                          ? motivations.filter((v) => v !== value)
                          : [...motivations, value];
                        setMotivations(next);
                      }}
                      className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <p className="font-medium text-sm font-sans text-secondary-foreground">{t(`settings.motivations.${value}`)}</p>
                      <p className="text-muted-foreground mt-0.5 text-sm font-sans font-normal">{t(`settings.motivations.${value}Desc`)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mantra */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.personalMantra')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.mantraDesc')}
              </p>
              <textarea
                value={mantra ?? ''}
                onChange={(e) => setMantra(e.target.value || null)}
                placeholder={t('settings.mantraPlaceholder')}
                maxLength={200}
                rows={2}
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors resize-none"
              />
              <p className="text-[10px] font-mono text-muted-foreground/50 text-right">
                {(mantra?.length ?? 0)}/200
              </p>
            </div>

            {/* Grounding Activities */}
            <GroundingTagInput
              activities={groundingActivities}
              onChange={setGroundingActivities}
            />


            {/* Language — disabled, English only for now */}
    </>
  );
}

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
  } = useSettingsState();
  return (
    <>

            <ThresholdSetting
              thresholdUp={threshold}
              onSetUp={setThreshold}
              thresholdDown={thresholdDown}
              onSetDown={setThresholdDown}
              cumulativeThreshold={cumulativeThreshold}
              onSetCumulative={setCumulativeThreshold}
              cooldownHours={cooldownHours}
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
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="text-base font-sans">{h}h</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone — Pro */}
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
                        ? 'border-primary bg-primary/5 text-foreground'
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

            {/* Style — Pro */}
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
                        ? 'border-primary bg-primary/5 text-foreground'
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

            {/* Custom Prompt — Pro */}
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
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors resize-none"
              />
              <p className="text-[10px] font-mono text-muted-foreground/50 text-right">
                {(customPrompt?.length ?? 0)}/200
              </p>
            </div>
            </ProLock>
    </>
  );
}

export function SettingsExperiencePanel() {
  const {
    t,
    btcMode,
    setBtcMode,
    currency,
    setCurrency,
    zenMode,
    setZenMode,
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

            {/* 1 BTC = 1 BTC mode */}
            <div className="space-y-3">
              <p className="uppercase tracking-wider text-base font-sans font-semibold text-[#dbb266]">{t('settings.btcMode')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.btcModeDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="btc-mode" className="cursor-pointer text-base font-sans text-secondary-foreground">
                  {t('settings.enableConvictionMode')}
                </Label>
                <Switch
                  id="btc-mode"
                  checked={btcMode}
                  onCheckedChange={(val) => {
                    setBtcMode(val);
                    localStorage.setItem('holzen_btc_mode', String(val));
                  }}
                />
              </div>
            </div>

            {/* Currency */}
            <div className={`space-y-3 transition-opacity ${btcMode ? 'opacity-30 pointer-events-none' : ''}`}>
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.displayCurrency')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.displayCurrencyDesc')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { code: 'USD', label: 'USD', desc: 'US Dollar ($)' },
                  { code: 'EUR', label: 'EUR', desc: 'Euro (€)' },
                  { code: 'GBP', label: 'GBP', desc: 'British Pound (£)' },
                  { code: 'CHF', label: 'CHF', desc: 'Swiss Franc' },
                  { code: 'CAD', label: 'CAD', desc: 'Canadian Dollar (C$)' },
                  { code: 'AUD', label: 'AUD', desc: 'Australian Dollar (A$)' },
                  { code: 'BRL', label: 'BRL', desc: 'Brazilian Real (R$)' },
                  { code: 'TRY', label: 'TRY', desc: 'Turkish Lira (₺)' },
                ] as const).map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                      currency === c.code
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="font-medium text-base font-sans text-secondary-foreground">{c.label}</p>
                    <p className="mt-0.5 text-sm font-sans text-muted-foreground">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Zen Mode */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.zenMode')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.zenModeDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="zen-mode" className="text-muted-foreground text-base font-sans">
                  {t('settings.enableZenMode')}
                </Label>
                <Switch
                  id="zen-mode"
                  checked={zenMode}
                  onCheckedChange={(v) => {
                    setZenMode(v);
                    localStorage.setItem('holzen_zen_mode', String(v));
                  }}
                />
              </div>
            </div>

            {/* Checkout-confirmed suppression window */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">
                {t('settings.checkoutWindow', { defaultValue: 'Checkout-confirmed window' })}
              </p>
              <p className="leading-relaxed text-primary text-sm">
                {t(
                  'settings.checkoutWindowDesc',
                  'After a successful purchase, the confirmation dialog and subscription re-sync are skipped if you return within this window. Default is {{default}} minutes.',
                  { default: CHECKOUT_SUPPRESSION_WINDOW_DEFAULT_MINUTES },
                )}
              </p>
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="checkout-window-minutes"
                  className="text-muted-foreground text-base font-sans"
                >
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
                {t(
                  'settings.checkoutWindowRange',
                  'Allowed range: {{min}}–{{max}} minutes.',
                  {
                    min: CHECKOUT_SUPPRESSION_WINDOW_MIN_MINUTES,
                    max: CHECKOUT_SUPPRESSION_WINDOW_MAX_MINUTES,
                  },
                )}
              </p>
            </div>

            {/* Silent Mode */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.silentMode')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.silentModeDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="silent-mode" className="text-xs font-mono text-muted-foreground">
                  {t('settings.enableSilentMode')}
                </Label>
                <Switch id="silent-mode" checked={silentMode} onCheckedChange={setSilentMode} />
              </div>
            </div>

            {/* Notification Sound */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.notificationSound')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.notificationSoundDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-toggle" className="text-xs font-mono text-muted-foreground">
                  {t('settings.enableSound')}
                </Label>
                <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={(val) => { setSoundEnabled(val); localStorage.setItem('holzen_sound_enabled', String(val)); }} />
              </div>
            </div>

            {/* Haptic Feedback */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.hapticFeedback')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.hapticDesc')}
              </p>
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

export function SettingsCompanionsPanel() {
  const {
    t,
    companionPrefs,
    setCompanionPref,
    aiInsightsEnabled,
    setAiInsightsEnabled,
  } = useSettingsState();
  return (
    <>

            <ProLock feature="companions" hideContent>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.companionsDesc')}
                </p>
                {(['breathing', 'haiku', 'grounding', 'signal', 'zoomOut', 'history'] as const).map((comp) => (
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

              {/* Source Management */}
              <SourceManagement />

              <div className="space-y-3">
                <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.aiInsights')}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.aiInsightsDesc')}
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai-insights" className="text-xs font-mono text-muted-foreground">
                    {t('settings.enableAiInsights')}
                  </Label>
                  <Switch id="ai-insights" checked={aiInsightsEnabled} onCheckedChange={setAiInsightsEnabled} />
                </div>
              </div>
            </div>
            </ProLock>
    </>
  );
}

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
    notifyBadges,
    setNotifyBadges,
    digestFrequency,
    setDigestFrequency,
    nightReflectionHour,
    setNightReflectionHour,
    quietHoursStart,
    quietHoursEnd,
    setQuietHours,
  } = useSettingsState();
  return (
    <>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif" className="font-sans text-base font-medium text-primary">
                  {t('settings.emailNotifications')}
                </Label>
                <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              {pushSupported && pushPermissionGrantedIncomplete && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
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
                  <Label htmlFor="push-notif" className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground text-base font-sans">
                    {t('settings.pushNotifications')}
                  </Label>
                  <div className="flex items-center gap-2">
                    {pushLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    <Switch
                      id="push-notif"
                      checked={pushSubscribed}
                      disabled={pushLoading}
                      onCheckedChange={(checked) => checked ? pushSubscribe() : pushUnsubscribe()}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Install Holzen — persistent re-entry point */}
            <InstallHolzenCard alwaysShow compact />

            {/* Badge notifications — free */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.badgeNotifications')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.badgeNotifDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-badges" className="text-xs font-mono text-muted-foreground">
                  {t('settings.enableBadgeNotif')}
                </Label>
                <Switch id="notify-badges" checked={notifyBadges} onCheckedChange={setNotifyBadges} />
              </div>
            </div>

            {/* Pro notification settings — single ProLock */}
            <ProLock feature="notifications" hideContent>
            <div className="space-y-6">
              {/* Digest */}
              <div className="space-y-3">
                <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.digestFrequency')}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.digestDesc')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'biweekly'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDigestFrequency(opt)}
                      className={`rounded-md border px-3 py-2 text-center transition-colors ${
                        digestFrequency === opt
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <p className="text-xs font-mono">{t(`settings.digestOptions.${opt}`)}</p>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['monthly', 'off'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDigestFrequency(opt)}
                      className={`rounded-md border px-3 py-2 text-center transition-colors ${
                        digestFrequency === opt
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <p className="text-xs font-mono">{t(`settings.digestOptions.${opt}`)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Night Reflection */}
              <div className="space-y-3">
                <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.nightReflection')}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.nightReflectionDesc')}
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="night-reflection-enabled" className="text-xs font-mono text-muted-foreground">
                    {t('settings.enableNightReflection')}
                  </Label>
                  <Switch
                    id="night-reflection-enabled"
                    checked={nightReflectionHour !== null}
                    onCheckedChange={(v) => v ? setNightReflectionHour(21) : setNightReflectionHour(null)}
                  />
                </div>
                {nightReflectionHour !== null && (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.deliveryTime')}</p>
                    <select
                      value={nightReflectionHour}
                      onChange={(e) => setNightReflectionHour(Number(e.target.value))}
                      className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-border/60 bg-background text-foreground"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Quiet Hours */}
              <div className="space-y-3">
                <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.quietHours')}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('settings.quietHoursDesc')}
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="quiet-enabled" className="text-xs font-mono text-muted-foreground">
                    {t('settings.enableQuietHours')}
                  </Label>
                  <Switch
                    id="quiet-enabled"
                    checked={quietHoursStart !== null}
                    onCheckedChange={(v) => v ? setQuietHours(22, 7) : setQuietHours(null, null)}
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
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
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
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Extended Quiet Windows */}
                <QuietWindowsManager userId={user?.id} />
              </div>
            </div>
            </ProLock>
    </>
  );
}

export function SettingsSubscriptionPanel() {
  const {
    t,
    subLoading,
    subscribed,
    tier,
    monthlyRemaining,
    checkoutLoading,
    checkoutLoadingTarget,
    startCheckoutFromSettings,
    openPortal,
  } = useSettingsState();
  return (
    <>

            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.plan')}</p>
              {subLoading ? (
                <p className="text-xs font-mono text-muted-foreground">{t('common.loading')}</p>
              ) : subscribed ? (
                <div className="space-y-3">
                  <p className="text-sm font-sans text-primary">
                    {tier === 'pro_plus'
                      ? t('settings.planProPlus', { defaultValue: 'Pro+ plan' })
                      : tier === 'lifetime'
                        ? t('settings.planLifetime', { defaultValue: 'Lifetime plan' })
                        : t('settings.planPro', { defaultValue: 'Pro plan' })}
                  </p>
                  {tier !== 'lifetime' && (
                    <div className="grid grid-cols-1 gap-2">
                      {tier === 'pro' && (
                        <LoadingButton
                          onClick={() => startCheckoutFromSettings('pro_plus')}
                          loading={checkoutLoading && checkoutLoadingTarget === 'pro_plus'}
                          disabled={checkoutLoading && checkoutLoadingTarget !== 'pro_plus'}
                          loadingText={t('settings.openingCheckout')}
                          className="w-full text-sm font-sans"
                          size="sm"
                        >
                          {t('settings.upgradeToProPlusCta', {
                            price: PRICING.proPlusMonthlyPrice.toFixed(2),
                            defaultValue: 'Upgrade to Pro+ · ${{price}}/month',
                          })}
                        </LoadingButton>
                      )}
                      <LoadingButton
                        onClick={() => startCheckoutFromSettings('flex_pack_s')}
                        loading={checkoutLoading && checkoutLoadingTarget === 'flex_pack_s'}
                        disabled={checkoutLoading && checkoutLoadingTarget !== 'flex_pack_s'}
                        loadingText={t('settings.openingCheckout')}
                        variant="outline"
                        className="w-full text-sm font-sans"
                        size="sm"
                      >
                        {t('settings.flexPackSCta', {
                          count: PRICING.flexPackSCredits,
                          price: PRICING.flexPackSPrice.toFixed(2),
                          defaultValue: 'Buy Flex Pack S · ${{price}} · {{count}} credits',
                        })}
                      </LoadingButton>
                      <LoadingButton
                        onClick={() => startCheckoutFromSettings('flex_pack_m')}
                        loading={checkoutLoading && checkoutLoadingTarget === 'flex_pack_m'}
                        disabled={checkoutLoading && checkoutLoadingTarget !== 'flex_pack_m'}
                        loadingText={t('settings.openingCheckout')}
                        variant="outline"
                        className="w-full text-sm font-sans"
                        size="sm"
                      >
                        {t('settings.flexPackMCta', {
                          count: PRICING.flexPackMCredits,
                          price: PRICING.flexPackMPrice.toFixed(2),
                          defaultValue: 'Buy Flex Pack M · ${{price}} · {{count}} credits',
                        })}
                      </LoadingButton>
                    </div>
                  )}
                  <Button
                    onClick={openPortal}
                    variant="outline"
                    size="sm"
                    className="w-full text-sm font-sans"
                  >
                    {t('settings.manageSubscription')}
                  </Button>
                  <div>
                    <Link to="/settings/billing-history" className="text-xs font-mono text-muted-foreground underline">View checkout history</Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {monthlyRemaining !== undefined && monthlyRemaining > 0 && (
                    <p className="text-sm font-sans text-primary">
                      {t('home.subscription.freeRemaining', { count: monthlyRemaining })}
                    </p>
                  )}
                  {monthlyRemaining !== undefined && monthlyRemaining <= 0 && (
                    <p className="text-sm font-sans text-primary">
                      {t('home.subscription.monthlyLimitReached')}
                    </p>
                  )}
                  <p className="text-sm font-sans text-muted-foreground">
                    {t('settings.choosePlan', { defaultValue: 'Choose your plan' })}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <LoadingButton
                      onClick={() => startCheckoutFromSettings('pro')}
                      loading={checkoutLoading}
                      loadingText={t('settings.openingCheckout')}
                      className="w-full text-base font-sans"
                      size="sm"
                    >
                      {t('settings.planProCta', {
                        price: PRICING.monthlyPrice.toFixed(2),
                        defaultValue: 'Start Pro · ${{price}}/month',
                      })}
                    </LoadingButton>
                    <LoadingButton
                      onClick={() => startCheckoutFromSettings('pro_plus')}
                      loading={checkoutLoading}
                      loadingText={t('settings.openingCheckout')}
                      variant="outline"
                      className="w-full text-base font-sans"
                      size="sm"
                    >
                      {t('settings.planProPlusCta', {
                        price: PRICING.proPlusMonthlyPrice.toFixed(2),
                        defaultValue: 'Start Pro+ · ${{price}}/month',
                      })}
                    </LoadingButton>
                  </div>
                </div>
              )}
            </div>

            <CreditsDashboard />

            <ReferralSection />
    </>
  );
}

export function SettingsAccountPanel() {
  const {
    t,
    user,
    signOut,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    changePassword,
    changingPassword,
    exporting,
    exportData,
    deleteAccount,
    deleting,
    canInstall,
    install,
  } = useSettingsState();
  return (
    <>

              <p className="truncate font-sans text-primary text-sm">{user.email}</p>

            <ChangeEmailSection />

            {/* Password */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.passwordLabel')}</p>
              <Input
                id="settings-new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder={t('settings.newPasswordPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                pattern="(?=.*[A-Za-z])(?=.*\d).{8,}"
                className="text-xs font-mono"
              />
              <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <Info className="h-3 w-3 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Must be at least 8 characters and include a letter and a number.</span>
              </p>
              <Input
                id="settings-confirm-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder={t('settings.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-xs font-mono"
              />
              <Button
                onClick={changePassword}
                disabled={changingPassword || !newPassword}
                size="sm"
                className="w-full font-mono text-xs !mt-4"
              >
                {changingPassword ? t('settings.updatingPassword') : t('settings.updatePassword')}
              </Button>
            </div>

            {/* Data export */}
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.data')}</p>
              <div className="flex gap-4">
                <LoadingButton
                  variant="link"
                  onClick={() => exportData('json')}
                  loading={exporting}
                  loadingText={t('settings.exporting')}
                  className="text-xs font-mono text-muted-foreground underline p-0 h-auto"
                >
                  {t('settings.exportJson')}
                </LoadingButton>
                <LoadingButton
                  variant="link"
                  onClick={() => exportData('csv')}
                  loading={exporting}
                  loadingText={t('settings.exporting')}
                  className="text-xs font-mono text-muted-foreground underline p-0 h-auto"
                >
                  {t('settings.exportCsv')}
                </LoadingButton>
              </div>
            </div>

            {/* Install */}
            {canInstall && (
              <button
                onClick={install}
                className="text-xs font-mono text-muted-foreground underline"
              >
                {t('settings.installApp')}
              </button>
            )}

            {/* Sign out */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="block text-xs font-mono text-muted-foreground underline">
                  {t('common.signOut')}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono text-sm">{t('common.signOut')}</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    {t('settings.signOutConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-mono text-xs">{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={signOut} className="font-mono text-xs">
                    {t('common.signOut')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-xs font-mono text-destructive underline">
                  {t('settings.deleteAccount')}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono text-sm">{t('settings.deleteAccount')}</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    {t('settings.deleteAccountDesc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-mono text-xs">{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
                  >
                    {deleting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                    {deleting ? t('settings.deleting') : t('settings.deleteForever')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
    </>
  );
}

