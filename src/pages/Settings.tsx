import { useAuth } from '@/hooks/use-auth';
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
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
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

const Settings = () => {
  const { user, signOut } = useAuth();
  const { threshold, setThreshold, thresholdDown, setThresholdDown, cumulativeThreshold, setCumulativeThreshold, emailNotifications, setEmailNotifications, companionPrefs, setCompanionPref, reflectionTone, setReflectionTone, reflectionStyle, setReflectionStyle, silentMode, setSilentMode, cooldownHours, setCooldownHours, digestFrequency, setDigestFrequency, customPrompt, setCustomPrompt, quietHoursStart, quietHoursEnd, setQuietHours, streakFreezeDates, useStreakFreeze, firstName, setFirstName, nightReflectionHour, setNightReflectionHour, aiInsightsEnabled, setAiInsightsEnabled, ritualTemplate, setRitualTemplate, notifyBadges, setNotifyBadges, motivations, setMotivations, mantra, setMantra, currency, setCurrency, language, setLanguage, profileLoaded } = useHolzen();
  const { subscribed, loading: subLoading, checkoutLoading, startCheckout, openPortal, trialRemaining } = useSubscription();
  const { theme, setTheme } = useTheme();
  const { canInstall, install } = useInstallPrompt();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, loading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [zenMode, setZenMode] = useState(() => localStorage.getItem('holzen_zen_mode') === 'true');
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
      toast.error('Too short', { description: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords don\'t match', { description: 'Please make sure both fields are identical.' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated', { description: 'Your new password is now active.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong';
      toast.error('Failed to update password', { description: msg });
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

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
        // Reflections CSV
        const refHeaders = ['created_at', 'message', 'context', 'mood', 'outcome', 'note', 'tags', 'haiku', 'is_favorite'];
        const refRows = (reflections ?? []).map((r: any) =>
          refHeaders.map(h => {
            const val = h === 'tags' ? (r[h] ?? []).join('; ') : (r[h] ?? '');
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        );
        const refCsv = [refHeaders.join(','), ...refRows].join('\n');

        // Rituals CSV
        const ritHeaders = ['created_at', 'decision', 'template', 'journal_text', 'duration_seconds'];
        const ritRows = (rituals ?? []).map((r: any) =>
          ritHeaders.map(h => {
            const val = r[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
          }).join(',')
        );
        const ritCsv = [ritHeaders.join(','), ...ritRows].join('\n');

        // Download reflections CSV
        const refBlob = new Blob([refCsv], { type: 'text/csv' });
        const refUrl = URL.createObjectURL(refBlob);
        const a1 = document.createElement('a');
        a1.href = refUrl; a1.download = `holzen-reflections-${dateStr}.csv`; a1.click();
        URL.revokeObjectURL(refUrl);

        // Download rituals CSV if any
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
            message: r.message,
            context: r.context,
            mood: r.mood,
            outcome: r.outcome,
            note: r.note,
            tags: r.tags,
            haiku: r.haiku,
            is_favorite: r.is_favorite,
            learning_title: r.learning_title,
            learning_body: r.learning_body,
            signal_title: r.signal_title,
            signal_body: r.signal_body,
            created_at: r.created_at,
          })),
          rituals: (rituals ?? []).map((r: any) => ({
            decision: r.decision,
            template: r.template,
            journal_text: r.journal_text,
            duration_seconds: r.duration_seconds,
            created_at: r.created_at,
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
      toast.error('Export failed', { description: 'Could not export your data. Please try again.' });
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
      toast.error('Failed to delete account', { description: 'Please try again or contact support.' });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-mono tracking-widest uppercase text-muted-foreground">
          Settings
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
            You
          </AccordionTrigger>
          <AccordionContent className="space-y-5 pb-4">
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">First name</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Optional. Shown as a quiet greeting on home.
              </p>
              <Input
                value={firstName ?? ''}
                onChange={(e) => setFirstName(e.target.value || null)}
                placeholder="Your first name"
                maxLength={30}
                className="text-xs font-mono"
              />
            </div>

            {/* My Why — Motivations */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">My Why</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Why do you hold? Select what resonates. This anchors your reflections and appears as a mantra during rituals.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'freedom', label: 'Financial freedom', desc: 'Building independence' },
                  { value: 'family', label: 'Family security', desc: 'Protecting what matters' },
                  { value: 'generational', label: 'Generational wealth', desc: 'Beyond your lifetime' },
                  { value: 'discipline', label: 'Learning discipline', desc: 'Mastering patience' },
                  { value: 'conviction', label: 'Philosophical conviction', desc: 'Believing in the protocol' },
                  { value: 'sovereignty', label: 'Self-sovereignty', desc: 'Being your own bank' },
                  { value: 'inflation', label: 'Inflation hedge', desc: 'Preserving purchasing power' },
                  { value: 'curiosity', label: 'Curiosity', desc: 'Learning about money' },
                ] as const).map((m) => {
                  const selected = motivations.includes(m.value);
                  return (
                    <button
                      key={m.value}
                      onClick={() => {
                        const next = selected
                          ? motivations.filter((v) => v !== m.value)
                          : [...motivations, m.value];
                        setMotivations(next);
                      }}
                      className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <p className="text-xs font-mono font-medium">{m.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mantra */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Personal mantra</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Optional. Your own words — shown during rituals and woven into AI reflections.
              </p>
              <textarea
                value={mantra ?? ''}
                onChange={(e) => setMantra(e.target.value || null)}
                placeholder="e.g. I hold because time is on my side…"
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">1 BTC = 1 BTC</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Strip away fiat noise. No prices, no percentages, no red or green. Just Bitcoin.
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="btc-mode" className="text-xs text-muted-foreground cursor-pointer">
                  Enable conviction mode
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Display currency</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose how BTC prices are displayed throughout the app.
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

            {/* Language */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Reflection language</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose the language for AI-generated reflections, haikus, and insights.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { code: 'en', label: 'English', desc: 'Default' },
                  { code: 'es', label: 'Español', desc: 'Spanish' },
                  { code: 'pt', label: 'Português', desc: 'Portuguese' },
                  { code: 'de', label: 'Deutsch', desc: 'German' },
                  { code: 'nl', label: 'Nederlands', desc: 'Dutch' },
                  { code: 'fr', label: 'Français', desc: 'French' },
                  { code: 'tr', label: 'Türkçe', desc: 'Turkish' },
                ] as const).map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                      language === l.code
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="text-xs font-mono font-medium">{l.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Reflection */}
        <AccordionItem value="reflection" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            Reflection
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* Threshold */}
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Cooldown</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Minimum time between automatic reflections.
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

            {/* Tone */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Tone</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose the voice of your reflections.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'stoic', label: 'Stoic', desc: 'Grounded, like Marcus Aurelius' },
                  { value: 'zen', label: 'Zen', desc: 'Spacious, meditative' },
                  { value: 'poetic', label: 'Poetic', desc: 'Evocative, literary' },
                  { value: 'blunt', label: 'Blunt', desc: 'Direct, no fluff' },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setReflectionTone(t.value)}
                    className={`rounded-md border px-3 py-2.5 text-left transition-colors ${
                      reflectionTone === t.value
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="text-xs font-mono font-medium">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Style</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose how your reflections are structured.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'standard', label: 'Standard', desc: '1-3 sentence reflection' },
                  { value: 'one-liner', label: 'One-liner', desc: 'Single impactful sentence' },
                  { value: 'question', label: 'Question', desc: 'One thought-provoking question' },
                  { value: 'metaphor', label: 'Metaphor', desc: 'A vivid image for the moment' },
                  { value: 'koan', label: 'Koan', desc: 'A zen paradox to sit with' },
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
                    <p className="text-xs font-mono font-medium">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Custom prompt</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add personal guidance the AI will weave into every reflection.
              </p>
              <textarea
                value={customPrompt ?? ''}
                onChange={(e) => setCustomPrompt(e.target.value || null)}
                placeholder="Your personal reflection guidance…"
                maxLength={200}
                rows={3}
                className="w-full text-xs font-mono px-3 py-2 rounded-md border border-border/60 bg-background text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors resize-none"
              />
              <p className="text-[10px] font-mono text-muted-foreground/50 text-right">
                {(customPrompt?.length ?? 0)}/200
              </p>
            </div>

            {/* Silent Mode */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Silent mode</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Just "BTC moved." — no reflection text.
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="silent-mode" className="text-xs font-mono text-muted-foreground">
                  Enable silent mode
                </Label>
                <Switch id="silent-mode" checked={silentMode} onCheckedChange={setSilentMode} />
              </div>
            </div>

            {/* Zen Mode */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Zen mode</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Strips the home screen to just the reflection and breathing exercise.
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="zen-mode" className="text-xs font-mono text-muted-foreground">
                  Enable zen mode
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
            Companions
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Optional additions shown below each reflection.
            </p>
            {([
              { id: 'breathing', label: 'Breathing exercise' },
              { id: 'haiku', label: 'Haiku' },
              { id: 'learning', label: 'Learning nudge' },
              { id: 'signal', label: 'Signal' },
              { id: 'zoomOut', label: 'Zoom out' },
              { id: 'history', label: 'Historical insight' },
            ] as const).map((comp) => (
              <div key={comp.id} className="flex items-center justify-between">
                <Label htmlFor={`comp-${comp.id}`} className="text-xs font-mono text-muted-foreground">
                  {comp.label}
                </Label>
                <Switch
                  id={`comp-${comp.id}`}
                  checked={companionPrefs[comp.id]}
                  onCheckedChange={(v) => setCompanionPref(comp.id, v)}
                />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* 4. Ritual */}
        <AccordionItem value="ritual" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            Ritual
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              A guided pre-decision sequence. Choose your preferred depth.
            </p>
            <div className="space-y-2">
              {([
                { value: 'quick', label: 'Quick', desc: 'Breathe → Decide' },
                { value: 'standard', label: 'Standard', desc: 'Breathe → Reflect → Decide' },
                { value: 'deep', label: 'Deep', desc: 'Breathe → Reflect → Journal → Decide' },
              ] as const).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setRitualTemplate(t.value)}
                  className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors ${
                    ritualTemplate === t.value
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/40 bg-muted/10 hover:bg-muted/20'
                  }`}
                >
                  <p className={`text-xs font-mono ${ritualTemplate === t.value ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">{t.desc}</p>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Notifications & Schedule */}
        <AccordionItem value="notifications" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            Notifications & Schedule
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* Email & Push */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif" className="text-xs font-mono text-muted-foreground">
                  Email notifications
                </Label>
                <Switch id="email-notif" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              {pushSupported && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notif" className="text-xs font-mono text-muted-foreground">
                    Push notifications
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Digest frequency</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                How often you receive your reflection digest email.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'biweekly', label: 'Biweekly' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDigestFrequency(opt.value)}
                    className={`rounded-md border px-3 py-2 text-center transition-colors ${
                      digestFrequency === opt.value
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="text-xs font-mono">{opt.label}</p>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'off', label: 'Off' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDigestFrequency(opt.value)}
                    className={`rounded-md border px-3 py-2 text-center transition-colors ${
                      digestFrequency === opt.value
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <p className="text-xs font-mono">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Night Reflection */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Night reflection</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A nightly summary of your day's BTC movement and whether you reflected.
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="night-reflection-enabled" className="text-xs font-mono text-muted-foreground">
                  Enable night reflection
                </Label>
                <Switch
                  id="night-reflection-enabled"
                  checked={nightReflectionHour !== null}
                  onCheckedChange={(v) => v ? setNightReflectionHour(21) : setNightReflectionHour(null)}
                />
              </div>
              {nightReflectionHour !== null && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono text-muted-foreground/60">Delivery time (local)</p>
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Quiet hours</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No automatic reflections during these hours.
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="quiet-enabled" className="text-xs font-mono text-muted-foreground">
                  Enable quiet hours
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
                    <p className="text-[10px] font-mono text-muted-foreground/60">From</p>
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
                    <p className="text-[10px] font-mono text-muted-foreground/60">Until</p>
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
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Badge notifications</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Get notified when you unlock new milestone badges.
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-badges" className="text-xs font-mono text-muted-foreground">
                  Enable badge notifications
                </Label>
                <Switch id="notify-badges" checked={notifyBadges} onCheckedChange={setNotifyBadges} />
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">AI Insights</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Weekly AI-generated pattern analysis across your reflections.
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-insights" className="text-xs font-mono text-muted-foreground">
                  Enable AI insights
                </Label>
                <Switch id="ai-insights" checked={aiInsightsEnabled} onCheckedChange={setAiInsightsEnabled} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 6. Subscription & Referrals */}
        <AccordionItem value="subscription" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            Subscription & Referrals
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {/* Subscription */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Plan</p>
              {subLoading ? (
                <p className="text-xs font-mono text-muted-foreground">Loading</p>
              ) : subscribed ? (
                <button
                  onClick={openPortal}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  Manage subscription
                </button>
              ) : (
                <div className="space-y-2">
                  {trialRemaining !== undefined && trialRemaining > 0 && (
                    <p className="text-xs font-mono text-muted-foreground">
                      {trialRemaining} free reflection{trialRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                  <p className="text-xs font-mono text-muted-foreground">
                    $3/month · Cancel anytime
                  </p>
                  <Button
                    onClick={startCheckout}
                    disabled={checkoutLoading}
                    className="w-full font-mono text-xs"
                    size="sm"
                  >
                    {checkoutLoading ? 'Opening checkout…' : 'Subscribe'}
                  </Button>
                </div>
              )}
            </div>

            {/* Referrals */}
            <ReferralSection />
          </AccordionContent>
        </AccordionItem>

        {/* 7. Account */}
        <AccordionItem value="account" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            Account
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-4">
            {user && (
              <p className="text-xs font-mono text-muted-foreground truncate">{user.email}</p>
            )}

            {/* Change Email */}
            <ChangeEmailSection />

            {/* Password */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Password</p>
              <Input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs font-mono"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
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
                {changingPassword ? 'Updating…' : 'Update password'}
              </Button>
            </div>

            {/* Data export */}
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Data</p>
              <div className="flex gap-4">
                <button
                  onClick={() => exportData('json')}
                  disabled={exporting}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  {exporting ? 'Exporting…' : 'Export as JSON'}
                </button>
                <button
                  onClick={() => exportData('csv')}
                  disabled={exporting}
                  className="text-xs font-mono text-muted-foreground underline"
                >
                  {exporting ? 'Exporting…' : 'Export as CSV'}
                </button>
              </div>
            </div>

            {/* Install */}
            {canInstall && (
              <button
                onClick={install}
                className="text-xs font-mono text-muted-foreground underline"
              >
                Install app
              </button>
            )}

            {/* Sign out */}
            <button
              onClick={signOut}
              className="block text-xs font-mono text-muted-foreground underline"
            >
              Sign out
            </button>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-xs font-mono text-destructive underline">
                  Delete account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-mono text-sm">Delete account</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">
                    This will permanently delete your account, all reflections, and all data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-mono text-xs">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-mono text-xs"
                  >
                    {deleting ? 'Deleting…' : 'Delete forever'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </AccordionContent>
        </AccordionItem>

        {/* 8. About */}
        <AccordionItem value="about" className="border border-border/40 rounded-md px-4">
          <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-3 hover:no-underline">
            About
            {hasNewVersion && (
              <span className="ml-2 text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                New
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
                <a href="/roadmap" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-foreground underline">Roadmap</a>
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
};

function ChangeEmailSection() {
  const [newEmail, setNewEmail] = useState('');
  const [changing, setChanging] = useState(false);

  const changeEmail = useCallback(async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Invalid email', { description: 'Please enter a valid email address.' });
      return;
    }
    setChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Confirmation sent', { description: 'Check both your old and new email to confirm the change.' });
      setNewEmail('');
    } catch (e: any) {
      toast.error('Failed to update email', { description: e?.message || 'Something went wrong' });
    } finally {
      setChanging(false);
    }
  }, [newEmail]);

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">Email</p>
      <Input
        type="email"
        placeholder="New email address"
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
        {changing ? 'Sending confirmation…' : 'Change email'}
      </Button>
      <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
        You'll receive a confirmation link on both your current and new email.
      </p>
    </div>
  );
}

export default Settings;
