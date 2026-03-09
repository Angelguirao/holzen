import { useAuth } from '@/hooks/use-auth';
import { SourceManagement } from '@/components/SourceManagement';
import { ProLock } from '@/components/ProLock';
import { isHapticEnabled, setHapticEnabled } from '@/lib/haptics';
import { useHolzen } from '@/hooks/use-holzen';
import { useSubscription } from '@/hooks/use-subscription';
import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { ThresholdSetting } from '@/components/ThresholdSetting';
import { ReferralSection } from '@/components/ReferralSection';
import { Changelog } from '@/components/Changelog';
import { FeedbackForm } from '@/components/FeedbackForm';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, forwardRef } from 'react';
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

const LAST_SEEN_VERSION_KEY = 'holzen_last_seen_version';

const Settings = forwardRef<HTMLDivElement>(function Settings(_props, ref) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { threshold, setThreshold, thresholdDown, setThresholdDown, cumulativeThreshold, setCumulativeThreshold, emailNotifications, setEmailNotifications, companionPrefs, setCompanionPref, reflectionTone, setReflectionTone, reflectionStyle, setReflectionStyle, silentMode, setSilentMode, cooldownHours, setCooldownHours, digestFrequency, setDigestFrequency, customPrompt, setCustomPrompt, quietHoursStart, quietHoursEnd, setQuietHours, streakFreezeDates, useStreakFreeze, firstName, setFirstName, nightReflectionHour, setNightReflectionHour, aiInsightsEnabled, setAiInsightsEnabled, ritualTemplate, setRitualTemplate, notifyBadges, setNotifyBadges, motivations, setMotivations, mantra, setMantra, currency, setCurrency, language, setLanguage, profileLoaded } = useHolzen();
  const { subscribed, loading: subLoading, checkoutLoading, startCheckout, openPortal, monthlyRemaining } = useSubscription();
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [zenMode, setZenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');
  const [hapticEnabled, setHapticEnabledState] = useState(isHapticEnabled);
  const [btcMode, setBtcMode] = useState(() => localStorage.getItem('holzen_btc_mode') === 'true');
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    supabase
      .from('changelog_entries')
      .select('version')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
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
      const [{ data: profile }, { data: reflections }, { data: rituals }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('reflections').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('ritual_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
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

        const ritHeaders = ['created_at', 'decision', 'template', 'journal_text', 'duration_seconds'];
        const ritRows = (rituals ?? []).map((r: any) =>
          ritHeaders.map(h => {
            const val = r[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        );
        const ritCsv = [ritHeaders.join(','), ...ritRows].join('\n');

        const refBlob = new Blob([refCsv], { type: 'text/csv' });
        const refUrl = URL.createObjectURL(refBlob);
        const a1 = document.createElement('a');
        a1.href = refUrl; a1.download = `holzen-reflections-${dateStr}.csv`; a1.click();
        URL.revokeObjectURL(refUrl);

        if (rituals && rituals.length > 0) {
          const ritBlob = new Blob([ritCsv], { type: 'text/csv' });
          const ritUrl = URL.createObjectURL(ritBlob);
          const a2 = document.createElement('a');
          a2.href = ritUrl; a2.download = `holzen-rituals-${dateStr}.csv`; a2.click();
          URL.revokeObjectURL(ritUrl);
        }

        toast.success('CSV exported', { description: `${reflections?.length ?? 0} reflections + ${rituals?.length ?? 0} rituals.` });
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
            learning_title: r.learning_title, learning_body: r.learning_body,
            signal_title: r.signal_title, signal_body: r.signal_body, created_at: r.created_at,
          })),
          rituals: (rituals ?? []).map((r: any) => ({
            decision: r.decision, template: r.template, journal_text: r.journal_text,
            duration_seconds: r.duration_seconds, created_at: r.created_at,
          })),
        };

        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `holzen-export-${dateStr}.json`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Data exported', { description: `${reflections?.length ?? 0} reflections + ${rituals?.length ?? 0} rituals.` });
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

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
          {t('settings.title')}
        </h1>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <Accordion type="multiple" defaultValue={['you', 'reflection']} className="space-y-1">

        {/* 1. You */}
        <AccordionItem value="you" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.you')}
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-4">
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.firstName')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.firstNameDesc')}
              </p>
              <Input
                value={firstName ?? ''}
                onChange={(e) => setFirstName(e.target.value || null)}
                placeholder={t('settings.firstNamePlaceholder')}
                maxLength={30}
                className="text-xs font-mono"
              />
            </div>

            {/* My Why — Motivations */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.myWhy')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
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
                      <p className="text-xs font-mono font-medium">{t(`settings.motivations.${value}`)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t(`settings.motivations.${value}Desc`)}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mantra */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.personalMantra')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
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

            {/* 1 BTC = 1 BTC mode */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.btcMode')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.btcModeDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="btc-mode" className="text-xs text-muted-foreground cursor-pointer">
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.displayCurrency')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
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
                    <p className="text-xs font-mono font-medium">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Language — disabled, English only for now */}
          </AccordionContent>
        </AccordionItem>

        {/* 2. Reflection */}
        <AccordionItem value="reflection" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.reflection')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {profileLoaded ? (
              <ThresholdSetting thresholdUp={threshold} onSetUp={setThreshold} thresholdDown={thresholdDown} onSetDown={setThresholdDown} cumulativeThreshold={cumulativeThreshold} onSetCumulative={setCumulativeThreshold} />
            ) : (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-8 w-24 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded" />
              </div>
            )}

            {/* Cooldown */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.cooldown')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
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
                    <p className="text-xs font-mono">{h}h</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone — Pro */}
            <ProLock>
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.tone')}</p>
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
            <ProLock>
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.style')}</p>
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
            <ProLock>
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.customPrompt')}</p>
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

            {/* Silent Mode */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.silentMode')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.silentModeDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="silent-mode" className="text-xs font-mono text-muted-foreground">
                  {t('settings.enableSilentMode')}
                </Label>
                <Switch id="silent-mode" checked={silentMode} onCheckedChange={setSilentMode} />
              </div>
            </div>

            {/* Haptic Feedback */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.hapticFeedback')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.hapticDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="haptic-toggle" className="text-xs font-mono text-muted-foreground">
                  {t('settings.enableHaptics')}
                </Label>
                <Switch id="haptic-toggle" checked={hapticEnabled} onCheckedChange={(val) => { setHapticEnabledState(val); setHapticEnabled(val); }} />
              </div>
            </div>

            {/* Zen Mode */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.zenMode')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.zenModeDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="zen-mode" className="text-xs font-mono text-muted-foreground">
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
          </AccordionContent>
        </AccordionItem>

        {/* 3. Companions */}
        <AccordionItem value="companions" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.companions')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.companionsDesc')}
              </p>
              {(['breathing', 'haiku', 'learning', 'signal', 'zoomOut', 'history'] as const).map((comp) => (
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

            {/* Signal Sources */}
            <div className="border-t border-border/30 pt-4">
              <SourceManagement />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Ritual */}
        <AccordionItem value="ritual" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.ritual')}
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('settings.ritualDesc')}
            </p>
            <div className="space-y-2">
              {(['quick', 'standard', 'deep'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setRitualTemplate(value)}
                  className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors ${
                    ritualTemplate === value
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/40 bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <p className={`text-xs font-mono ${ritualTemplate === value ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t(`settings.ritualTemplates.${value}`)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">{t(`settings.ritualTemplates.${value}Desc`)}</p>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Notifications & Schedule */}
        <AccordionItem value="notifications" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.notificationsSchedule')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif" className="text-xs font-mono text-muted-foreground">
                  {t('settings.emailNotifications')}
                </Label>
                <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              {pushSupported && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notif" className="text-xs font-mono text-muted-foreground">
                    {t('settings.pushNotifications')}
                  </Label>
                  <Switch
                    id="push-notif"
                    checked={pushSubscribed}
                    disabled={pushLoading}
                    onCheckedChange={(checked) => checked ? pushSubscribe() : pushUnsubscribe()}
                  />
                </div>
              )}
            </div>

            {/* Digest */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.digestFrequency')}</p>
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.nightReflection')}</p>
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
                  <p className="text-[10px] font-mono text-muted-foreground/60">{t('settings.deliveryTime')}</p>
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.quietHours')}</p>
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
                    <p className="text-[10px] font-mono text-muted-foreground/60">{t('common.from')}</p>
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
                    <p className="text-[10px] font-mono text-muted-foreground/60">{t('common.until')}</p>
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
            </div>

            {/* Badge notifications */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.badgeNotifications')}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('settings.badgeNotifDesc')}
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-badges" className="text-xs font-mono text-muted-foreground">
                  {t('settings.enableBadgeNotif')}
                </Label>
                <Switch id="notify-badges" checked={notifyBadges} onCheckedChange={setNotifyBadges} />
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.aiInsights')}</p>
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
          </AccordionContent>
        </AccordionItem>

        {/* 6. Subscription & Referrals */}
        <AccordionItem value="subscription" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.subscriptionReferrals')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.plan')}</p>
              {subLoading ? (
                <p className="text-xs font-mono text-muted-foreground">{t('common.loading')}</p>
              ) : subscribed ? (
                <button
                  onClick={openPortal}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  {t('settings.manageSubscription')}
                </button>
              ) : (
                <div className="space-y-2">
                  {monthlyRemaining !== undefined && monthlyRemaining > 0 && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {t('home.subscription.freeRemaining', { count: monthlyRemaining })}
                    </p>
                  )}
                  {monthlyRemaining !== undefined && monthlyRemaining <= 0 && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {t('home.subscription.monthlyLimitReached')}
                    </p>
                  )}
                  <p className="text-xs font-mono text-muted-foreground">
                    {t('settings.pricePerMonth')}
                  </p>
                  <Button
                    onClick={startCheckout}
                    disabled={checkoutLoading}
                    className="w-full font-mono text-xs"
                    size="sm"
                  >
                    {checkoutLoading ? t('settings.openingCheckout') : t('pro.upgradeCta')}
                  </Button>
                </div>
              )}
            </div>

            <ReferralSection />
          </AccordionContent>
        </AccordionItem>

        {/* 7. Account */}
        <AccordionItem value="account" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.account')}
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {user && (
              <p className="text-xs font-mono text-muted-foreground truncate">{user.email}</p>
            )}

            <ChangeEmailSection />

            {/* Password */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.passwordLabel')}</p>
              <Input
                type="password"
                placeholder={t('settings.newPasswordPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs font-mono"
              />
              <Input
                type="password"
                placeholder={t('settings.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-xs font-mono"
              />
              <Button
                onClick={changePassword}
                disabled={changingPassword || !newPassword}
                size="sm"
                className="w-full font-mono text-xs"
              >
                {changingPassword ? t('settings.updatingPassword') : t('settings.updatePassword')}
              </Button>
            </div>

            {/* Data export */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.data')}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => exportData('json')}
                  disabled={exporting}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  {exporting ? t('settings.exporting') : t('settings.exportJson')}
                </button>
                <button
                  onClick={() => exportData('csv')}
                  disabled={exporting}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  {exporting ? t('settings.exporting') : t('settings.exportCsv')}
                </button>
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
                    {deleting ? t('settings.deleting') : t('settings.deleteForever')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </AccordionContent>
        </AccordionItem>

        {/* 8. About */}
        <AccordionItem value="about" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            {t('settings.about')}
            {hasNewVersion && (
              <span className="ml-2 text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {t('common.new')}
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-4">
            <FeedbackForm />
            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (latestVersion) {
                      localStorage.setItem(LAST_SEEN_VERSION_KEY, latestVersion);
                      setHasNewVersion(false);
                    }
                  }}
                  className="contents"
                >
                  <Changelog />
                </button>
                <a href="/roadmap" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-foreground underline">{t('settings.roadmap')}</a>
              </div>
              {latestVersion && (
                <p className="text-[10px] font-mono text-muted-foreground/50">
                  Holzen v{latestVersion}
                </p>
              )}
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
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{t('settings.emailLabel')}</p>
      <Input
        type="email"
        placeholder={t('settings.newEmailPlaceholder')}
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        className="text-xs font-mono"
      />
      <Button
        onClick={changeEmail}
        disabled={changing || !newEmail}
        size="sm"
        className="w-full font-mono text-xs"
      >
        {changing ? t('settings.sendingConfirmation') : t('settings.changeEmail')}
      </Button>
      <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
        {t('settings.emailConfirmNote')}
      </p>
    </div>
  );
}

export default Settings;
