import { useAuth } from '@/hooks/use-auth';
import { AppVersionBadge } from '@/components/AppVersionBadge';
import { QuietWindowsManager } from '@/components/QuietWindowsManager';
import { SourceManagement } from '@/components/SourceManagement';
import { ProLock } from '@/components/ProLock';
import { isHapticEnabled, setHapticEnabled } from '@/lib/haptics';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { PRICING } from '@/lib/pricing';
import { ThresholdSetting } from '@/components/ThresholdSetting';
import { ReferralSection } from '@/components/ReferralSection';
import { CreditsDashboard } from '@/components/CreditsDashboard';
import { Changelog } from '@/components/Changelog';
import { FeedbackForm } from '@/components/FeedbackForm';
import { InstallHolzenCard } from '@/components/InstallHolzenCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, forwardRef, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const LAST_SEEN_VERSION_KEY = 'holzen_last_seen_version';

function GroundingTagInput({ activities, onChange }: { activities: string[]; onChange: (v: string[]) => void }) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      const tag = inputValue.trim().toLowerCase();
      if (!activities.includes(tag)) {
        onChange([...activities, tag]);
      }
      setInputValue('');
    }
    if (e.key === 'Backspace' && !inputValue && activities.length > 0) {
      onChange(activities.slice(0, -1));
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.groundingTitle')}</p>
      <p className="leading-relaxed text-primary text-sm">
        {t('settings.groundingDesc')}
      </p>
      <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
        {activities.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-foreground/80"
          >
            {tag}
            <button
              onClick={() => onChange(activities.filter((a) => a !== tag))}
              className="hover:text-foreground transition-colors"
              style={{ color: '#7B8A9E' }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('onboarding.groundingPlaceholder', 'e.g. running, cooking, guitar...')}
        className="w-full bg-transparent border-b border-border/40 focus:border-foreground/30 outline-none text-sm font-mono py-2 text-foreground placeholder:text-muted-foreground/30 transition-colors"
      />
    </div>
  );
}

const Settings = forwardRef<HTMLDivElement>(function Settings(_props, ref) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { threshold, setThreshold, thresholdDown, setThresholdDown, cumulativeThreshold, setCumulativeThreshold, emailNotifications, setEmailNotifications, companionPrefs, setCompanionPref, reflectionTone, setReflectionTone, reflectionStyle, setReflectionStyle, silentMode, setSilentMode, cooldownHours, setCooldownHours, digestFrequency, setDigestFrequency, customPrompt, setCustomPrompt, quietHoursStart, quietHoursEnd, setQuietHours, streakFreezeDates, useStreakFreeze, firstName, setFirstName, nightReflectionHour, setNightReflectionHour, aiInsightsEnabled, setAiInsightsEnabled, notifyBadges, setNotifyBadges, motivations, setMotivations, mantra, setMantra, currency, setCurrency, language, setLanguage, groundingActivities, setGroundingActivities, profileLoaded } = useHolzen();
  const {
    subscribed,
    loading: subLoading,
    checkoutLoading,
    checkoutLoadingTarget,
    startCheckout,
    openPortal,
    monthlyRemaining,
    tier,
  } = useSubscription();
  const { canInstall, install } = useInstallPrompt();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    loading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    permissionGrantedNotSubscribed: pushPermissionGrantedIncomplete,
  } = usePushNotifications();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [zenMode, setZenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('holzen_sound_enabled') !== 'false');
  const [btcMode, setBtcMode] = useState(() => localStorage.getItem('holzen_btc_mode') === 'true');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const initialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Track profile-level setting changes to show auto-save toast
  useEffect(() => {
    if (!profileLoaded) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      toast(t('settings.saved', 'Saved'), { duration: 1200, id: 'auto-save' });
    }, 400);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [threshold, thresholdDown, cumulativeThreshold, emailNotifications, reflectionTone, reflectionStyle, silentMode, cooldownHours, digestFrequency, customPrompt, quietHoursStart, quietHoursEnd, firstName, nightReflectionHour, aiInsightsEnabled, notifyBadges, mantra, currency, language, groundingActivities, companionPrefs]);


  useEffect(() => {
    supabase
      .from('changelog_entries')
      .select('version')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.version) {
          const v = data.version;
          setLatestVersion(v);
          const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY);
          setHasNewVersion(lastSeen !== v);
        }
      });
  }, []);

  const changePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(t('auth.passwordUpdated'));
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword, t]);

  useEffect(() => {
    document.title = 'Holzen — Settings';
    return () => { document.title = 'Holzen — Pause before you act'; };
  }, []);

  const exportData = async (format: 'json' | 'csv' = 'json') => {
    if (!user) return;
    setExporting(true);
    try {
      const [{ data: profile }, { data: reflections }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        (supabase.from('v_reflection_with_companions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }) as any),
      ]);

      const dateStr = new Date().toISOString().slice(0, 10);

      if (format === 'csv') {
        const refHeaders = ['created_at', 'message', 'context', 'mood', 'outcome', 'note', 'tags', 'haiku', 'is_favorite'];
        const refRows = (reflections ?? []).map((r: any) =>
          refHeaders.map(h => {
            const val = h === 'tags' ? (r[h] ?? []).join('; ') : (r[h] ?? '');
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        );
        const refCsv = [refHeaders.join(','), ...refRows].join('\n');

        const refBlob = new Blob([refCsv], { type: 'text/csv' });
        const refUrl = URL.createObjectURL(refBlob);
        const a1 = document.createElement('a');
        a1.href = refUrl; a1.download = `holzen-reflections-${dateStr}.csv`; a1.click();
        URL.revokeObjectURL(refUrl);

        toast.success('CSV exported', { description: `${reflections?.length ?? 0} pauses.` });
      } else {
        const exportPayload = {
          exported_at: new Date().toISOString(),
          profile: profile ? {
            threshold: profile.threshold,
            threshold_down: profile.threshold_down,
            cooldown_hours: profile.cooldown_hours,
            reflection_tone: profile.reflection_tone,
            reflection_style: profile.reflection_style,
            language: profile.language,
            email_notifications: profile.email_notifications,
            created_at: profile.created_at,
          } : null,
          reflections: (reflections ?? []).map((r: any) => ({
            message: r.message, context: r.context, mood: r.mood, outcome: r.outcome,
            note: r.note, tags: r.tags, haiku: r.haiku, is_favorite: r.is_favorite,
            grounding_title: r.grounding_title, grounding_body: r.grounding_body,
            signal_title: r.signal_title, signal_body: r.signal_body, created_at: r.created_at,
          })),
        };

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `holzen-export-${dateStr}.json`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Data exported', { description: `${reflections?.length ?? 0} pauses.` });
      }
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      toast.success('Account deleted');
      await signOut();
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  if (!profileLoaded) {
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
    <div ref={ref} className="space-y-6">
      <NoxHeaderMain title={t('settings.title')} subtitle={t('settings.pageSubtitle')} />

      <Accordion type="multiple" className="space-y-4">

        {/* 1. You */}
        <AccordionItem value="you" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.you')}
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* 2. Reflection */}
        <AccordionItem value="reflection" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.reflection')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {profileLoaded ? (
              <ThresholdSetting thresholdUp={threshold} onSetUp={setThreshold} thresholdDown={thresholdDown} onSetDown={setThresholdDown} cumulativeThreshold={cumulativeThreshold} onSetCumulative={setCumulativeThreshold} cooldownHours={cooldownHours} />
            ) : (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
              </div>
            )}

            {/* Cooldown */}
            <div className="space-y-3 text-sm font-sans">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.cooldown')}</p>
              <p className="leading-relaxed text-sm text-secondary-foreground">
                {t('settings.cooldownDesc')}
              </p>
              <div className="grid grid-cols-4 gap-2">
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

          </AccordionContent>
        </AccordionItem>

        {/* 3. Experience */}
        <AccordionItem value="experience" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.experience', 'Experience')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4 text-muted-foreground">
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
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.notificationSound', 'Notification sound')}</p>
              <p className="leading-relaxed text-primary text-sm">
                {t('settings.notificationSoundDesc', 'Play a singing-bowl chime when a new reflection arrives.')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-toggle" className="text-xs font-mono text-muted-foreground">
                  {t('settings.enableSound', 'Enable sound')}
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
                <Switch id="haptic-toggle" checked={hapticEnabled} onCheckedChange={(val) => { setHapticEnabledState(val); setHapticEnabled(val); }} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Companions & AI */}
        <AccordionItem value="companions" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.companionsAi', 'Companions & AI')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
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
          </AccordionContent>
        </AccordionItem>
  

        {/* 5. Notifications & Schedule */}
        <AccordionItem value="notifications" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.notificationsSchedule')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
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
                    {t('settings.pushFinishBannerTitle', 'Finish enabling push in Settings')}
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
                      {t('settings.pushFinishBannerAction', 'Enable push on this device')}
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
          </AccordionContent>
        </AccordionItem>

        {/* 6. Subscription & Referrals */}
        <AccordionItem value="subscription" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.subscriptionReferrals')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            <div className="space-y-3">
              <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.plan')}</p>
              {subLoading ? (
                <p className="text-xs font-mono text-muted-foreground">{t('common.loading')}</p>
              ) : subscribed ? (
                <div className="space-y-3">
                  <p className="text-sm font-sans text-primary">
                    {tier === 'pro_plus'
                      ? t('settings.planProPlus', 'Pro+ plan')
                      : tier === 'lifetime'
                      ? t('settings.planLifetime', 'Lifetime plan')
                      : t('settings.planPro', 'Pro plan')}
                  </p>
                  {tier !== 'lifetime' && (
                    <div className="grid grid-cols-1 gap-2">
                      {tier === 'pro' && (
                        <LoadingButton
                          onClick={() => startCheckout('pro_plus')}
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
                        onClick={() => startCheckout('flex_pack_s')}
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
                        onClick={() => startCheckout('flex_pack_m')}
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
                    <a
                      href="/settings/billing-history"
                      className="text-xs font-mono text-muted-foreground underline"
                    >
                      View checkout history
                    </a>
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
                    {t('settings.choosePlan', 'Choose your plan')}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <LoadingButton
                      onClick={() => startCheckout('pro')}
                      loading={checkoutLoading}
                      loadingText={t('settings.openingCheckout')}
                      className="w-full text-base font-sans"
                      size="sm"
                    >
                      {t('settings.planProCta', 'Start Pro · $4.99/month')}
                    </LoadingButton>
                    <LoadingButton
                      onClick={() => startCheckout('pro_plus')}
                      loading={checkoutLoading}
                      loadingText={t('settings.openingCheckout')}
                      variant="outline"
                      className="w-full text-base font-sans"
                      size="sm"
                    >
                      {t('settings.planProPlusCta', 'Start Pro+ · $9.99/month')}
                    </LoadingButton>
                  </div>
                </div>
              )}
            </div>

            <CreditsDashboard />

            <ReferralSection />
          </AccordionContent>
        </AccordionItem>

        {/* 7. Account */}
        <AccordionItem value="account" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.account')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
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
          </AccordionContent>
        </AccordionItem>

        {/* 8. About */}
        <AccordionItem value="about" className="border border-border/40 rounded-md px-4 mb-[16px]">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            <span className="flex items-center gap-4 flex-1">
              {t('settings.about')}
              {hasNewVersion && (
                <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  {t('common.new')}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-4">
            <FeedbackForm />
            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Changelog
                  onWhatsNewOpen={() => {
                    if (latestVersion) {
                      localStorage.setItem(LAST_SEEN_VERSION_KEY, latestVersion);
                      setHasNewVersion(false);
                    }
                  }}
                />
              </div>
              <AppVersionBadge changelogVersion={latestVersion} />
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
});

function ChangeEmailSection() {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState('');
  const [changing, setChanging] = useState(false);

  const changeEmail = useCallback(async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Invalid email');
      return;
    }
    setChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Confirmation sent');
      setNewEmail('');
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong');
    } finally {
      setChanging(false);
    }
  }, [newEmail]);

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground/60 uppercase tracking-wider text-sm font-sans">{t('settings.emailLabel')}</p>
      <Input
        id="settings-new-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t('settings.newEmailPlaceholder')}
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        className="text-xs font-mono"
      />
      <Button
        onClick={changeEmail}
        disabled={changing || !newEmail}
        size="sm"
        className="w-full font-mono text-xs !mt-4"
      >
        {changing ? t('settings.sendingConfirmation') : t('settings.changeEmail')}
      </Button>
      <p className="leading-relaxed text-[#7b8a9d] text-sm">
        {t('settings.emailConfirmNote')}
      </p>
    </div>
  );
}

export default Settings;
